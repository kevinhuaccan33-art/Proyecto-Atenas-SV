"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  ChevronRight,
  FolderKanban,
  Home,
  LayoutGrid,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { getSupabase } from "@/lib/supabase-browser";


type GroupRow = {
  id: number;
  members: string;
  project_name: string | null;
  logo_path: string | null;
  active: boolean;
  completion_approved: boolean;
  completion_approved_at: string | null;
  diploma_code: string | null;
  updated_at: string;
};


type StageDefinition = {
  id: number;
  name: string;
  description: string;
  milestone_percent: number;
};


type StageStatus =
  | "locked"
  | "editable"
  | "submitted"
  | "correction_required"
  | "approved"
  | "rejected";


type StageWork = {
  group_id: number;
  stage_id: number;
  status: StageStatus;
  score: number | string;
  content: Record<string, unknown>;
  evidence_url: string | null;
  student_comment: string;
  teacher_comment: string;
  revision: number;
  submitted_at: string | null;
  reviewed_at: string | null;
};


type AtenasGroup = GroupRow & {
  grade: number;
  progress: number;
  pendingReviews: number;
  corrections: number;
  approvedStages: number;
  currentStage: number;
  stageWorks: StageWork[];
};


const CARD_COLORS = [
  {
    accent: "#6c56d9",
    soft: "#eeeafd",
  },
  {
    accent: "#2388d9",
    soft: "#e7f4ff",
  },
  {
    accent: "#f39a32",
    soft: "#fff2df",
  },
  {
    accent: "#159b7d",
    soft: "#e7faf5",
  },
  {
    accent: "#e05c77",
    soft: "#fff0f3",
  },
];


const STATUS_INFO: Record<
  StageStatus,
  {
    icon: string;
    label: string;
  }
> = {
  locked: {
    icon: "🔒",
    label: "Bloqueada",
  },

  editable: {
    icon: "✏️",
    label: "Editable",
  },

  submitted: {
    icon: "🟡",
    label: "En revisión",
  },

  correction_required: {
    icon: "🔄",
    label: "Corrección",
  },

  approved: {
    icon: "✅",
    label: "Aprobada",
  },

  rejected: {
    icon: "❌",
    label: "Rechazada",
  },
};


function numberValue(value: number | string | null | undefined) {
  const result = Number(value ?? 0);

  return Number.isFinite(result)
    ? result
    : 0;
}


function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "es-PE",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "";
  }
}


function buildGroup(
  group: GroupRow,
  allWork: StageWork[]
): AtenasGroup {

  const stageWorks = allWork
    .filter(
      work =>
        work.group_id === group.id
    )
    .sort(
      (a, b) =>
        a.stage_id - b.stage_id
    );


  /*
    IMPORTANTE:

    Solo sumamos puntos de etapas APROBADAS.

    Por ejemplo:
    3.5 + 4 + 2 = 9.5 / 20

    progreso = 9.5 × 5 = 47.5 %
  */

  const grade = stageWorks
    .filter(
      work =>
        work.status === "approved"
    )
    .reduce(
      (total, work) =>
        total +
        numberValue(work.score),
      0
    );


  const pendingReviews =
    stageWorks.filter(
      work =>
        work.status === "submitted"
    ).length;


  const corrections =
    stageWorks.filter(
      work =>
        work.status ===
        "correction_required"
    ).length;


  const approvedStages =
    stageWorks.filter(
      work =>
        work.status === "approved"
    ).length;


  const reachedStages =
    stageWorks.filter(
      work =>
        work.status !== "locked"
    );


  const currentStage =
    reachedStages.length
      ? Math.max(
          ...reachedStages.map(
            work =>
              work.stage_id
          )
        )
      : 1;


  return {
    ...group,

    grade:
      Math.round(
        grade * 100
      ) / 100,

    progress:
      Math.round(
        grade * 5 * 10
      ) / 10,

    pendingReviews,

    corrections,

    approvedStages,

    currentStage,

    stageWorks,
  };
}


function GroupCard({
  group,
  stages,
  onOpen,
  onToggleActive,
  changing,
}: {
  group: AtenasGroup;
  stages: StageDefinition[];
  onOpen: () => void;
  onToggleActive: () => void;
  changing: boolean;
}) {

  const colors =
    CARD_COLORS[
      (group.id - 1) %
        CARD_COLORS.length
    ];


  const stage =
    stages.find(
      item =>
        item.id ===
        group.currentStage
    );


  let stageLabel =
    stage?.name ??
    "Etapa 1";


  if (!group.active) {
    stageLabel =
      "Deshabilitado";
  }


  if (
    group.pendingReviews > 0
  ) {
    stageLabel =
      "Pendiente de revisión";
  }


  if (
    group.corrections > 0
  ) {
    stageLabel =
      "Corrección solicitada";
  }


  if (
    group.completion_approved
  ) {
    stageLabel =
      "Proyecto finalizado";
  }


  const title =
    group.project_name?.trim() ||
    `Grupo ${group.id}`;


  const members =
    group.members?.trim() ||
    "Sin integrantes asignados";


  return (
    <article
      className="project-card"
      style={
        {
          "--accent":
            colors.accent,

          "--soft":
            colors.soft,

          opacity:
            group.active
              ? 1
              : 0.68,
        } as React.CSSProperties
      }
    >

      <div className="card-head">

        <div className="project-icon">

          {group.completion_approved
            ? "🏆"
            : group.active
            ? "🤖"
            : "🔒"}

        </div>


        <span className="stage-pill">

          {stageLabel}

        </span>

      </div>


      <div>

        <p className="team-name">

          Grupo {group.id}

        </p>


        <h3>

          {title}

        </h3>


        <p className="members">

          <Users />

          {members}

        </p>

      </div>


      <div className="progress-block">

        <div className="progress-label">

          <span>
            Nota / progreso
          </span>

          <strong>

            {group.grade}/20 ·{" "}
            {group.progress}%

          </strong>

        </div>


        <Progress
          value={group.progress}
          className="project-progress"
        />

      </div>


      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#6b7280",
        }}
      >

        <span>

          ✅ {group.approvedStages}/5

        </span>


        <span>

          🟡 {group.pendingReviews} revisión

        </span>


        <span>

          🔄 {group.corrections} corrección

        </span>

      </div>


      <div className="card-foot">

        <Button
          type="button"
          variant="outline"
          disabled={changing}
          onClick={
            event => {
              event.stopPropagation();
              onToggleActive();
            }
          }
        >

          {group.active
            ? "Deshabilitar"
            : "Habilitar"}

        </Button>


        <button
          onClick={onOpen}
          aria-label={
            `Ver Grupo ${group.id}`
          }
        >

          Ver grupo

          <ChevronRight />

        </button>

      </div>

    </article>
  );
}


export default function HomePage() {

  const [groups, setGroups] =
    useState<AtenasGroup[]>([]);


  const [stages, setStages] =
    useState<StageDefinition[]>([]);


  const [
    activeGroupId,
    setActiveGroupId,
  ] =
    useState<number | null>(null);


  const [query, setQuery] =
    useState("");


  const [filter, setFilter] =
    useState("todos");


  const [
    mobileNav,
    setMobileNav,
  ] =
    useState(false);


  const [
    authReady,
    setAuthReady,
  ] =
    useState(false);


  const [
    teacherName,
    setTeacherName,
  ] =
    useState("Profesor Kevin");


  const [loading, setLoading] =
    useState(true);


  const [
    changingGroup,
    setChangingGroup,
  ] =
    useState<number | null>(null);


  const [notice, setNotice] =
    useState("");


  const activeGroup =
    useMemo(
      () =>
        groups.find(
          group =>
            group.id ===
            activeGroupId
        ) ?? null,
      [
        groups,
        activeGroupId,
      ]
    );


  // ============================================================
  // AUTENTICACIÓN
  // ============================================================

  useEffect(() => {

    let mounted = true;


    async function verifyAccess() {

      try {

        const supabase =
          await getSupabase();


        const {
          data: sessionData,
        } =
          await supabase.auth.getSession();


        const user =
          sessionData.session?.user;


        if (!user) {

          window.location.replace(
            "/login"
          );

          return;
        }


        const {
          data: profile,
          error,
        } =
          await supabase
            .from("profiles")
            .select(
              "display_name, role, active"
            )
            .eq(
              "id",
              user.id
            )
            .single();


        if (
          error ||
          !profile ||
          !profile.active
        ) {

          await supabase.auth.signOut();

          window.location.replace(
            "/login"
          );

          return;
        }


        if (
          profile.role !== "admin"
        ) {

          window.location.replace(
            "/student"
          );

          return;
        }


        if (mounted) {

          setTeacherName(
            profile.display_name ||
            "Profesor Kevin"
          );

          setAuthReady(true);

        }

      } catch (error) {

        console.error(
          error
        );

        window.location.replace(
          "/login"
        );

      }

    }


    verifyAccess();


    return () => {

      mounted = false;

    };

  }, []);


  // ============================================================
  // CARGAR DATOS REALES DE SUPABASE
  // ============================================================

  async function loadDashboard() {

    setLoading(true);


    try {

      const supabase =
        await getSupabase();


      const [
        groupsResult,
        stagesResult,
        workResult,
      ] =
        await Promise.all([

          supabase
            .from("groups")
            .select(
              `
              id,
              members,
              project_name,
              logo_path,
              active,
              completion_approved,
              completion_approved_at,
              diploma_code,
              updated_at
              `
            )
            .order(
              "id",
              {
                ascending: true,
              }
            ),


          supabase
            .from("stages")
            .select(
              `
              id,
              name,
              description,
              milestone_percent
              `
            )
            .order(
              "id",
              {
                ascending: true,
              }
            ),


          supabase
            .from("group_stage_work")
            .select(
              `
              group_id,
              stage_id,
              status,
              score,
              content,
              evidence_url,
              student_comment,
              teacher_comment,
              revision,
              submitted_at,
              reviewed_at
              `
            )
            .order(
              "group_id",
              {
                ascending: true,
              }
            )
            .order(
              "stage_id",
              {
                ascending: true,
              }
            ),

        ]);


      if (
        groupsResult.error
      ) {
        throw groupsResult.error;
      }


      if (
        stagesResult.error
      ) {
        throw stagesResult.error;
      }


      if (
        workResult.error
      ) {
        throw workResult.error;
      }


      const rawGroups =
        (groupsResult.data ??
          []) as GroupRow[];


      const rawStages =
        (stagesResult.data ??
          []) as StageDefinition[];


      const rawWork =
        (workResult.data ??
          []) as StageWork[];


      setStages(
        rawStages
      );


      setGroups(
        rawGroups.map(
          group =>
            buildGroup(
              group,
              rawWork
            )
        )
      );


    } catch (error) {

      console.error(
        "Error cargando panel:",
        error
      );


      setNotice(
        "No se pudieron cargar los grupos desde Supabase."
      );


    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    if (!authReady) {
      return;
    }


    loadDashboard();

  }, [authReady]);


  // ============================================================
  // HABILITAR / DESHABILITAR GRUPO
  // ============================================================

  async function toggleGroup(
    group: AtenasGroup
  ) {

    setChangingGroup(
      group.id
    );


    setNotice("");


    try {

      const supabase =
        await getSupabase();


      const {
        error,
      } =
        await supabase
          .from("groups")
          .update({
            active:
              !group.active,
          })
          .eq(
            "id",
            group.id
          );


      if (error) {
        throw error;
      }


      setNotice(

        !group.active

          ? `Grupo ${group.id} habilitado.`

          : `Grupo ${group.id} deshabilitado.`

      );


      await loadDashboard();


    } catch (error) {

      console.error(
        error
      );


      setNotice(
        "No se pudo cambiar el estado del grupo."
      );


    } finally {

      setChangingGroup(
        null
      );

    }

  }


  // ============================================================
  // CERRAR SESIÓN
  // ============================================================

  async function logout() {

    const supabase =
      await getSupabase();


    await supabase.auth.signOut();


    window.location.replace(
      "/login"
    );

  }


  // ============================================================
  // ESTADÍSTICAS
  // ============================================================

  const activeGroups =
    groups.filter(
      group =>
        group.active
    );


  const activeCount =
    activeGroups.length;


  const pendingTotal =
    groups.reduce(
      (
        total,
        group
      ) =>
        total +
        group.pendingReviews,
      0
    );


  const averageProgress =
    activeGroups.length

      ? Math.round(

          activeGroups.reduce(
            (
              total,
              group
            ) =>
              total +
              group.progress,
            0
          ) /
          activeGroups.length

        )

      : 0;


  // ============================================================
  // FILTRADO
  // ============================================================

  const visibleGroups =
    useMemo(
      () => {

        const normalizedQuery =
          query
            .trim()
            .toLowerCase();


        return groups.filter(
          group => {

            const text =
              `
              ${group.id}
              ${group.members}
              ${group.project_name ?? ""}
              `
                .toLowerCase();


            if (
              normalizedQuery &&
              !text.includes(
                normalizedQuery
              )
            ) {
              return false;
            }


            if (
              filter === "activos"
            ) {
              return group.active;
            }


            if (
              filter === "revision"
            ) {
              return (
                group.pendingReviews > 0 ||
                group.corrections > 0
              );
            }


            if (
              filter === "final"
            ) {
              return (
                group.completion_approved
              );
            }


            return true;

          }
        );

      },
      [
        groups,
        query,
        filter,
      ]
    );


  // ============================================================
  // PANTALLA DE CARGA
  // ============================================================

  if (!authReady) {

    return (

      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, #f5f7ff 0%, #eef9f7 100%)",
          fontFamily:
            "Arial, sans-serif",
        }}
      >

        <div
          style={{
            textAlign: "center",
            color: "#4b5563",
          }}
        >

          <strong
            style={{
              display: "block",
              fontSize: 24,
              color: "#1f2937",
              marginBottom: 10,
            }}
          >

            Atenas IA Lab

          </strong>

          Verificando acceso...

        </div>

      </main>

    );

  }


  // ============================================================
  // PANEL ADMIN
  // ============================================================

  return (

    <main className="app-shell">


      {/* SIDEBAR */}

      <aside
        className={
          mobileNav
            ? "app-sidebar is-open"
            : "app-sidebar"
        }
      >

        <div className="brand">

          <span className="brand-mark">

            <Sparkles />

          </span>


          <div>

            <strong>
              Atenas IA Lab
            </strong>

            <small>
              Inteligencia Artificial II
            </small>

          </div>

        </div>


        <button
          className="close-nav"
          onClick={
            () =>
              setMobileNav(false)
          }
          aria-label="Cerrar menú"
        >

          <X />

        </button>


        <nav
          aria-label="Navegación principal"
        >

          <button className="nav-item active">

            <Home />

            <span>
              Inicio
            </span>

          </button>


          <button className="nav-item">

            <FolderKanban />

            <span>
              Grupos
            </span>

            <span className="nav-count">

              {groups.length}

            </span>

          </button>


          <button className="nav-item">

            <Users />

            <span>
              Estudiantes
            </span>

          </button>


          <button className="nav-item">

            <ListChecks />

            <span>
              Revisiones
            </span>

            {
              pendingTotal > 0 && (

                <span className="nav-count">

                  {pendingTotal}

                </span>

              )
            }

          </button>

        </nav>


        <div className="sidebar-tip">

          <span>
            💡
          </span>

          <strong>
            Sistema de evaluación
          </strong>

          <p>
            5 etapas × 4 puntos =
            20 puntos.
          </p>

        </div>


        <div className="teacher">

          <div className="teacher-avatar">

            KP

          </div>


          <div>

            <strong>

              {teacherName}

            </strong>

            <small>

              Administrador

            </small>

          </div>

        </div>

      </aside>


      {/* CONTENIDO */}

      <section className="app-main">


        <header className="topbar">

          <button
            className="menu-button"
            onClick={
              () =>
                setMobileNav(true)
            }
            aria-label="Abrir menú"
          >

            <Menu />

          </button>


          <label className="search-box">

            <Search />

            <input
              value={query}
              onChange={
                event =>
                  setQuery(
                    event.target.value
                  )
              }
              placeholder="Buscar grupo, proyecto o estudiante..."
            />

          </label>


          <button
            className="notification"
            aria-label="Notificaciones"
          >

            <Bell />

            {
              pendingTotal > 0 && (
                <span />
              )
            }

          </button>


          <Button
            className="primary-action"
            onClick={logout}
          >

            <LogOut />

            Cerrar sesión

          </Button>

        </header>


        <div className="workspace">


          {/* BIENVENIDA */}

          <section className="welcome-row">

            <div>

              <p className="eyebrow">

                Atenas IA Lab · Panel del profesor

              </p>


              <h1>

                ¡Hola, {teacherName}!

                <span>
                  👋
                </span>

              </h1>


              <p>

                Aquí puedes acompañar,
                revisar y evaluar el
                avance real de cada grupo.

              </p>

            </div>


            <div className="class-chip">

              <span>

                Inteligencia Artificial II

              </span>

              <strong>

                {groups.length} grupos registrados ·{" "}
                {activeCount} activos

              </strong>

            </div>

          </section>


          {
            notice && (

              <button
                className="notice"
                onClick={
                  () =>
                    setNotice("")
                }
                aria-label="Cerrar mensaje"
              >

                {notice}

                <X />

              </button>

            )
          }


          {/* RESUMEN */}

          <section
            className="summary-grid"
            aria-label="Resumen general"
          >

            <article>

              <span className="summary-icon purple">

                <FolderKanban />

              </span>


              <div>

                <small>
                  Grupos activos
                </small>

                <strong>
                  {activeCount}
                </strong>

              </div>


              <em>

                de {groups.length} disponibles

              </em>

            </article>


            <article>

              <span className="summary-icon blue">

                <LayoutGrid />

              </span>


              <div>

                <small>
                  Avance promedio
                </small>

                <strong>
                  {averageProgress}%
                </strong>

              </div>


              <em>

                Calculado por nota

              </em>

            </article>


            <article>

              <span className="summary-icon orange">

                <ListChecks />

              </span>


              <div>

                <small>
                  Por revisar
                </small>

                <strong>
                  {pendingTotal}
                </strong>

              </div>


              <em>

                Entregas pendientes

              </em>

            </article>

          </section>


          {/* GRUPOS */}

          <Tabs
            value={filter}
            onValueChange={
              setFilter
            }
            className="project-tabs"
          >

            <div className="section-heading">

              <div>

                <h2>
                  Grupos del curso
                </h2>

                <p>

                  El progreso se calcula
                  automáticamente según
                  las etapas aprobadas.

                </p>

              </div>


              <TabsList className="filter-tabs">

                <TabsTrigger value="todos">
                  Todos
                </TabsTrigger>

                <TabsTrigger value="activos">
                  Activos
                </TabsTrigger>

                <TabsTrigger value="revision">
                  Revisar
                </TabsTrigger>

                <TabsTrigger value="final">
                  Finalizados
                </TabsTrigger>

              </TabsList>

            </div>


            <TabsContent value={filter}>

              {
                loading ? (

                  <div className="empty-state tall">

                    Cargando grupos desde Supabase...

                  </div>

                ) : (

                  <div className="project-grid">

                    {
                      visibleGroups.map(
                        group => (

                          <GroupCard
                            key={
                              group.id
                            }
                            group={
                              group
                            }
                            stages={
                              stages
                            }
                            changing={
                              changingGroup ===
                              group.id
                            }
                            onOpen={
                              () =>
                                setActiveGroupId(
                                  group.id
                                )
                            }
                            onToggleActive={
                              () =>
                                toggleGroup(
                                  group
                                )
                            }
                          />

                        )
                      )
                    }


                    {
                      visibleGroups.length ===
                        0 && (

                        <div className="empty-state">

                          No hay grupos que coincidan con este filtro.

                        </div>

                      )
                    }

                  </div>

                )
              }

            </TabsContent>

          </Tabs>

        </div>

      </section>


      {
        mobileNav && (

          <button
            className="nav-backdrop"
            aria-label="Cerrar menú"
            onClick={
              () =>
                setMobileNav(false)
            }
          />

        )
      }


      {/* DETALLE DEL GRUPO */}

      {
        activeGroup && (

          <div
            className="detail-overlay"
            role="presentation"
            onMouseDown={
              () =>
                setActiveGroupId(null)
            }
          >

            <section
              className="detail-panel"
              role="dialog"
              aria-modal="true"
              aria-label={
                `Detalle del Grupo ${activeGroup.id}`
              }
              onMouseDown={
                event =>
                  event.stopPropagation()
              }
            >

              <button
                className="detail-close"
                onClick={
                  () =>
                    setActiveGroupId(null)
                }
                aria-label="Cerrar"
              >

                <X />

              </button>


              <div
                className="detail-hero"
                style={
                  {
                    "--accent":
                      CARD_COLORS[
                        (activeGroup.id - 1) %
                          CARD_COLORS.length
                      ].accent,

                    "--soft":
                      CARD_COLORS[
                        (activeGroup.id - 1) %
                          CARD_COLORS.length
                      ].soft,
                  } as React.CSSProperties
                }
              >

                <span>

                  {activeGroup.completion_approved
                    ? "🏆"
                    : "🤖"}

                </span>


                <div>

                  <p>

                    Grupo {activeGroup.id}

                  </p>


                  <h2>

                    {
                      activeGroup.project_name ||
                      "Proyecto aún sin nombre"
                    }

                  </h2>


                  <small>

                    {
                      activeGroup.members ||
                      "Integrantes aún no definidos"
                    }

                  </small>

                </div>

              </div>


              <div className="detail-progress">

                <div>

                  <span>

                    Nota y progreso

                  </span>


                  <strong>

                    {activeGroup.grade}/20 ·{" "}
                    {activeGroup.progress}%

                  </strong>

                </div>


                <Progress
                  value={
                    activeGroup.progress
                  }
                />

              </div>


              <div
                style={{
                  marginBottom: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >

                <span className="stage-pill">

                  {
                    activeGroup.active
                      ? "🟢 Grupo activo"
                      : "⚪ Grupo deshabilitado"
                  }

                </span>


                {
                  activeGroup.pendingReviews >
                    0 && (

                    <span className="stage-pill">

                      🟡 {
                        activeGroup.pendingReviews
                      } pendiente(s)

                    </span>

                  )
                }


                {
                  activeGroup.corrections >
                    0 && (

                    <span className="stage-pill">

                      🔄 {
                        activeGroup.corrections
                      } corrección(es)

                    </span>

                  )
                }


                {
                  activeGroup.completion_approved && (

                    <span className="stage-pill">

                      🏆 Culminación aprobada

                    </span>

                  )
                }

              </div>


              <div className="stage-list">

                {
                  stages.map(
                    stage => {

                      const work =
                        activeGroup.stageWorks.find(
                          item =>
                            item.stage_id ===
                            stage.id
                        );


                      const status =
                        work?.status ??
                        "locked";


                      const info =
                        STATUS_INFO[
                          status
                        ];


                      const score =
                        numberValue(
                          work?.score
                        );


                      return (

                        <div
                          className={
                            status === "approved"
                              ? "stage-row done"
                              : "stage-row"
                          }
                          key={
                            stage.id
                          }
                        >

                          <span>

                            {
                              info.icon
                            }

                          </span>


                          <div
                            style={{
                              flex: 1,
                            }}
                          >

                            <strong>

                              Etapa {stage.id} ·{" "}
                              {stage.name}

                            </strong>


                            <small>

                              {info.label} ·{" "}
                              {score}/4 puntos

                            </small>


                            {
                              work?.submitted_at && (

                                <small
                                  style={{
                                    display: "block",
                                    marginTop: 3,
                                  }}
                                >

                                  Enviado:{" "}
                                  {
                                    formatDate(
                                      work.submitted_at
                                    )
                                  }

                                </small>

                              )
                            }


                            {
                              work?.teacher_comment && (

                                <small
                                  style={{
                                    display: "block",
                                    marginTop: 5,
                                  }}
                                >

                                  💬 Profesor:{" "}
                                  {
                                    work.teacher_comment
                                  }

                                </small>

                              )
                            }

                          </div>

                        </div>

                      );

                    }
                  )
                }

              </div>


              <div
                style={{
                  marginTop: 22,
                  display: "grid",
                  gap: 10,
                }}
              >

                {
                  activeGroup.pendingReviews >
                    0 && (

                    <div
                      style={{
                        background:
                          "#fff7e6",
                        borderRadius: 14,
                        padding: 14,
                        color:
                          "#92400e",
                      }}
                    >

                      🟡 Este grupo tiene una entrega esperando tu revisión.

                    </div>

                  )
                }


                {
                  activeGroup.completion_approved && (

                    <div
                      style={{
                        background:
                          "#ecfdf5",
                        borderRadius: 14,
                        padding: 14,
                        color:
                          "#047857",
                      }}
                    >

                      🏆 Proyecto culminado. Diploma habilitado.

                    </div>

                  )
                }

              </div>

            </section>

          </div>

        )
      }

    </main>

  );

}
