"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

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
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getSupabase } from "@/lib/supabase-browser";

type StageStatus =
  | "locked"
  | "editable"
  | "submitted"
  | "correction_required"
  | "approved"
  | "rejected";

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

type StageWork = {
  group_id: number;
  stage_id: number;
  status: StageStatus;
  score: number | string;
  content: Record<string, any>;
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
  { accent: "#6c56d9", soft: "#eeeafd" },
  { accent: "#2388d9", soft: "#e7f4ff" },
  { accent: "#f39a32", soft: "#fff2df" },
  { accent: "#159b7d", soft: "#e7faf5" },
  { accent: "#e05c77", soft: "#fff0f3" },
];

const STATUS_INFO: Record<
  StageStatus,
  { icon: string; label: string }
> = {
  locked: { icon: "🔒", label: "Bloqueada" },
  editable: { icon: "✏️", label: "Editable" },
  submitted: { icon: "🟡", label: "En revisión" },
  correction_required: {
    icon: "🔄",
    label: "Corrección solicitada",
  },
  approved: { icon: "✅", label: "Aprobada" },
  rejected: { icon: "❌", label: "Rechazada" },
};

function numeric(value: number | string | null | undefined) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function formatDate(value: string | null) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function buildGroup(
  group: GroupRow,
  allWork: StageWork[]
): AtenasGroup {
  const stageWorks = allWork
    .filter((work) => work.group_id === group.id)
    .sort((a, b) => a.stage_id - b.stage_id);

  const grade = stageWorks
    .filter((work) => work.status === "approved")
    .reduce((total, work) => total + numeric(work.score), 0);

  const pendingReviews = stageWorks.filter(
    (work) => work.status === "submitted"
  ).length;

  const corrections = stageWorks.filter(
    (work) => work.status === "correction_required"
  ).length;

  const approvedStages = stageWorks.filter(
    (work) => work.status === "approved"
  ).length;

  const reachedStages = stageWorks.filter(
    (work) => work.status !== "locked"
  );

  const currentStage = reachedStages.length
    ? Math.max(...reachedStages.map((work) => work.stage_id))
    : 1;

  return {
    ...group,
    grade: Math.round(grade * 100) / 100,
    progress: Math.round(grade * 5 * 10) / 10,
    pendingReviews,
    corrections,
    approvedStages,
    currentStage,
    stageWorks,
  };
}

function Field({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div>
      <strong>{label}:</strong>
      <p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap" }}>
        {String(value ?? "—")}
      </p>
    </div>
  );
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
    CARD_COLORS[(group.id - 1) % CARD_COLORS.length];

  const stage = stages.find(
    (item) => item.id === group.currentStage
  );

  let stageLabel = stage?.name ?? "Etapa 1";

  if (!group.active) stageLabel = "Deshabilitado";
  if (group.pendingReviews > 0)
    stageLabel = "Pendiente de revisión";
  if (group.corrections > 0)
    stageLabel = "Corrección solicitada";
  if (group.completion_approved)
    stageLabel = "Proyecto finalizado";

  return (
    <article
      className="project-card"
      style={
        {
          "--accent": colors.accent,
          "--soft": colors.soft,
          opacity: group.active ? 1 : 0.66,
        } as CSSProperties
      }
    >
      <div className="card-head">
        <div className="project-icon">
          {group.completion_approved
            ? "🏆"
            : group.pendingReviews > 0
            ? "🟡"
            : group.active
            ? "🤖"
            : "🔒"}
        </div>
        <span className="stage-pill">{stageLabel}</span>
      </div>

      <div>
        <p className="team-name">Grupo {group.id}</p>
        <h3>
          {group.project_name?.trim() || `Grupo ${group.id}`}
        </h3>
        <p className="members">
          <Users />
          {group.members?.trim() || "Sin integrantes asignados"}
        </p>
      </div>

      <div className="progress-block">
        <div className="progress-label">
          <span>Nota / progreso</span>
          <strong>
            {group.grade}/20 · {group.progress}%
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
        <span>✅ {group.approvedStages}/5</span>
        <span>🟡 {group.pendingReviews} revisión</span>
        <span>🔄 {group.corrections} corrección</span>
      </div>

      <div className="card-foot">
        <Button
          type="button"
          variant="outline"
          disabled={changing}
          onClick={(event) => {
            event.stopPropagation();
            onToggleActive();
          }}
        >
          {group.active ? "Deshabilitar" : "Habilitar"}
        </Button>

        <button onClick={onOpen}>
          Ver grupo
          <ChevronRight />
        </button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [groups, setGroups] = useState<AtenasGroup[]>([]);
  const [stages, setStages] = useState<StageDefinition[]>([]);
  const [activeGroupId, setActiveGroupId] =
    useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [mobileNav, setMobileNav] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [teacherName, setTeacherName] =
    useState("Profesor Kevin");
  const [loading, setLoading] = useState(true);
  const [changingGroup, setChangingGroup] =
    useState<number | null>(null);
  const [reviewingStage, setReviewingStage] =
    useState<number | null>(null);
  const [reviewScores, setReviewScores] =
    useState<Record<number, string>>({});
  const [reviewComments, setReviewComments] =
    useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");

  const activeGroup = useMemo(
    () =>
      groups.find((group) => group.id === activeGroupId) ??
      null,
    [groups, activeGroupId]
  );

  useEffect(() => {
    let mounted = true;

    async function verifyAccess() {
      try {
        const supabase = await getSupabase();
        const { data: sessionData } =
          await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          window.location.replace("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("display_name, role, active")
          .eq("id", user.id)
          .single();

        if (error || !profile || !profile.active) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (profile.role !== "admin") {
          window.location.replace("/student");
          return;
        }

        if (mounted) {
          setTeacherName(
            profile.display_name || "Profesor Kevin"
          );
          setAuthReady(true);
        }
      } catch (error) {
        console.error(error);
        window.location.replace("/login");
      }
    }

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadDashboard(showSpinner = false) {
    if (showSpinner) setLoading(true);

    try {
      const supabase = await getSupabase();

      const [groupsResult, stagesResult, workResult] =
        await Promise.all([
          supabase
            .from("groups")
            .select(`
              id,
              members,
              project_name,
              logo_path,
              active,
              completion_approved,
              completion_approved_at,
              diploma_code,
              updated_at
            `)
            .order("id", { ascending: true }),

          supabase
            .from("stages")
            .select(`
              id,
              name,
              description,
              milestone_percent
            `)
            .order("id", { ascending: true }),

          supabase
            .from("group_stage_work")
            .select(`
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
            `)
            .order("group_id", { ascending: true })
            .order("stage_id", { ascending: true }),
        ]);

      if (groupsResult.error) throw groupsResult.error;
      if (stagesResult.error) throw stagesResult.error;
      if (workResult.error) throw workResult.error;

      const rawGroups =
        (groupsResult.data ?? []) as GroupRow[];
      const rawStages =
        (stagesResult.data ?? []) as StageDefinition[];
      const rawWork =
        (workResult.data ?? []) as StageWork[];

      setStages(rawStages);
      setGroups(
        rawGroups.map((group) => buildGroup(group, rawWork))
      );
    } catch (error) {
      console.error("Error cargando panel:", error);
      setNotice(
        "No se pudieron cargar los datos desde Supabase."
      );
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadDashboard(true);
  }, [authReady]);

  async function toggleGroup(group: AtenasGroup) {
    setChangingGroup(group.id);
    setNotice("");

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("groups")
        .update({ active: !group.active })
        .eq("id", group.id);

      if (error) throw error;

      setNotice(
        !group.active
          ? `Grupo ${group.id} habilitado.`
          : `Grupo ${group.id} deshabilitado.`
      );

      await loadDashboard(false);
    } catch (error) {
      console.error(error);
      setNotice(
        "No se pudo cambiar el estado del grupo."
      );
    } finally {
      setChangingGroup(null);
    }
  }

  async function openAsset(path: string) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.storage
        .from("project-assets")
        .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("No se pudo abrir el archivo.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setNotice("No se pudo abrir el archivo.");
    }
  }

  async function reviewStage(
    groupId: number,
    work: StageWork,
    action:
      | "approved"
      | "correction_required"
      | "rejected"
  ) {
    const stageId = work.stage_id;

    const comment = (
      reviewComments[stageId] ??
      work.teacher_comment ??
      ""
    ).trim();

    const score = Number(
      reviewScores[stageId] ?? numeric(work.score)
    );

    if (
      action === "approved" &&
      (!Number.isFinite(score) || score < 0 || score > 4)
    ) {
      setNotice(
        "La nota debe estar entre 0 y 4 puntos."
      );
      return;
    }

    if (
      (action === "correction_required" ||
        action === "rejected") &&
      !comment
    ) {
      setNotice(
        "Escribe un comentario explicando al estudiante qué debe corregir."
      );
      return;
    }

    let confirmation = "";
    if (action === "approved") {
      confirmation = `¿Aprobar esta etapa con ${score}/4 puntos?`;
    } else if (action === "correction_required") {
      confirmation =
        "¿Solicitar corrección? El estudiante podrá editar nuevamente esta etapa.";
    } else {
      confirmation = "¿Rechazar esta entrega?";
    }

    if (!window.confirm(confirmation)) return;

    setReviewingStage(stageId);
    setNotice("");

    try {
      const supabase = await getSupabase();

      const payload: Record<string, any> = {
        status: action,
        teacher_comment: comment,
      };

      if (action === "approved") payload.score = score;
      if (action === "rejected") payload.score = 0;

      const { error } = await supabase
        .from("group_stage_work")
        .update(payload)
        .eq("group_id", groupId)
        .eq("stage_id", stageId);

      if (error) throw error;

      setNotice(
        action === "approved"
          ? `Etapa ${stageId} aprobada con ${score}/4 puntos.`
          : action === "correction_required"
          ? `Se solicitó corrección en la Etapa ${stageId}.`
          : `Etapa ${stageId} rechazada.`
      );

      setReviewScores((current) => {
        const copy = { ...current };
        delete copy[stageId];
        return copy;
      });

      setReviewComments((current) => {
        const copy = { ...current };
        delete copy[stageId];
        return copy;
      });

      await loadDashboard(false);
    } catch (error) {
      console.error("Error evaluando:", error);
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la evaluación."
      );
    } finally {
      setReviewingStage(null);
    }
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  const activeGroups = groups.filter((group) => group.active);
  const activeCount = activeGroups.length;
  const pendingTotal = groups.reduce(
    (total, group) => total + group.pendingReviews,
    0
  );
  const averageProgress = activeGroups.length
    ? Math.round(
        activeGroups.reduce(
          (total, group) => total + group.progress,
          0
        ) / activeGroups.length
      )
    : 0;

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return groups.filter((group) => {
      const text = `${group.id} ${group.members} ${
        group.project_name ?? ""
      }`.toLowerCase();

      if (
        normalizedQuery &&
        !text.includes(normalizedQuery)
      ) {
        return false;
      }

      if (filter === "activos") return group.active;

      if (filter === "revision") {
        return (
          group.pendingReviews > 0 ||
          group.corrections > 0
        );
      }

      if (filter === "final") {
        return group.completion_approved;
      }

      return true;
    });
  }, [groups, query, filter]);

  if (!authReady) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg,#f5f7ff,#eef9f7)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <strong
            style={{
              display: "block",
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            Atenas IA Lab
          </strong>
          Verificando acceso...
        </div>
      </main>
    );
  }

  function renderSubmission(
    stage: StageDefinition,
    work: StageWork
  ) {
    const c = work.content ?? {};

    if (stage.id === 1) {
      return (
        <div
          style={{
            display: "grid",
            gap: 10,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field label="Nombre" value={c.project_name} />
          <Field label="Integrantes" value={c.members} />
          <div>
            <strong>Logo:</strong>{" "}
            {c.logo_path ? "✅ cargado" : "❌ no cargado"}
          </div>
          {c.logo_path && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openAsset(String(c.logo_path))
              }
            >
              Ver logo
            </Button>
          )}
        </div>
      );
    }

    if (stage.id === 2) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field label="Problema" value={c.problem} />
          <Field
            label="Beneficiarios"
            value={c.beneficiaries}
          />
          <Field label="Solución" value={c.solution} />
          <Field label="Objetivo" value={c.objective} />
          <Field label="Uso de IA" value={c.ai_use} />
          <Field
            label="Limitaciones"
            value={c.limitations}
          />
          <Field
            label="Tecnologías"
            value={c.technologies}
          />

          <div>
            <strong>Esquema:</strong>{" "}
            {c.scheme_path ? "✅ cargado" : "❌ no cargado"}
          </div>

          {c.scheme_path && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openAsset(String(c.scheme_path))
              }
            >
              Ver esquema
            </Button>
          )}
        </div>
      );
    }

    if (stage.id === 3) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field
            label="Tipo de recurso"
            value={c.resource_type}
          />
          <Field
            label="Descripción"
            value={c.description}
          />
          <Field
            label="Origen o fuente"
            value={c.source_origin}
          />
          <Field
            label="Organización / clases"
            value={c.organization_classes}
          />
          <Field
            label="Cantidad / tamaño"
            value={c.quantity_size}
          />
          <Field
            label="Método de obtención"
            value={c.collection_method}
          />
          <Field
            label="Preparación / limpieza"
            value={c.preparation}
          />
          <Field
            label="Limitaciones / sesgos"
            value={c.limitations}
          />

          {c.resource_url ? (
            <a
              href={String(c.resource_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Abrir datos / contenido ↗
            </a>
          ) : (
            <div>❌ No se adjuntó enlace al recurso.</div>
          )}
        </div>
      );
    }

    if (stage.id === 4) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field
            label="Tipo de prototipo"
            value={c.prototype_type}
          />
          <Field
            label="Estado actual"
            value={c.current_status}
          />
          <Field
            label="Funciones implementadas"
            value={c.implemented_features}
          />
          <Field
            label="Funcionamiento de la IA"
            value={c.ai_operation}
          />
          <Field
            label="Pasos para probarlo"
            value={c.testing_steps}
          />
          <Field
            label="Trabajo pendiente"
            value={c.pending_work}
          />

          {c.prototype_url && (
            <a
              href={String(c.prototype_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Abrir prototipo ↗
            </a>
          )}

          <div>
            <strong>Evidencia:</strong>{" "}
            {c.evidence_path ? "✅ cargada" : "No adjunta"}
          </div>

          {c.evidence_path && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openAsset(String(c.evidence_path))
              }
            >
              Ver evidencia
            </Button>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <main className="app-shell">
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
            <strong>Atenas IA Lab</strong>
            <small>Inteligencia Artificial II</small>
          </div>
        </div>

        <button
          className="close-nav"
          onClick={() => setMobileNav(false)}
          aria-label="Cerrar menú"
        >
          <X />
        </button>

        <nav>
          <button className="nav-item active">
            <Home />
            <span>Inicio</span>
          </button>

          <button className="nav-item">
            <FolderKanban />
            <span>Grupos</span>
            <span className="nav-count">
              {groups.length}
            </span>
          </button>

          <button className="nav-item">
            <Users />
            <span>Estudiantes</span>
          </button>

          <button className="nav-item">
            <ListChecks />
            <span>Revisiones</span>
            {pendingTotal > 0 && (
              <span className="nav-count">
                {pendingTotal}
              </span>
            )}
          </button>
        </nav>

        <div className="sidebar-tip">
          <span>💡</span>
          <strong>Evaluación</strong>
          <p>
            Cada etapa vale hasta 4 puntos. Total: 20.
          </p>
        </div>

        <div className="teacher">
          <div className="teacher-avatar">KP</div>
          <div>
            <strong>{teacherName}</strong>
            <small>Administrador</small>
          </div>
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>

          <label className="search-box">
            <Search />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar grupo, proyecto o estudiante..."
            />
          </label>

          <button
            className="notification"
            aria-label="Notificaciones"
          >
            <Bell />
            {pendingTotal > 0 && <span />}
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
          <section className="welcome-row">
            <div>
              <p className="eyebrow">
                Atenas IA Lab · Panel del profesor
              </p>
              <h1>¡Hola, {teacherName}! 👋</h1>
              <p>
                Revisa, califica y acompaña el avance de cada
                proyecto.
              </p>
            </div>

            <div className="class-chip">
              <span>Inteligencia Artificial II</span>
              <strong>
                {groups.length} grupos · {activeCount} activos
              </strong>
            </div>
          </section>

          {notice && (
            <button
              className="notice"
              onClick={() => setNotice("")}
            >
              {notice}
              <X />
            </button>
          )}

          <section className="summary-grid">
            <article>
              <span className="summary-icon purple">
                <FolderKanban />
              </span>
              <div>
                <small>Grupos activos</small>
                <strong>{activeCount}</strong>
              </div>
              <em>de {groups.length}</em>
            </article>

            <article>
              <span className="summary-icon blue">
                <LayoutGrid />
              </span>
              <div>
                <small>Avance promedio</small>
                <strong>{averageProgress}%</strong>
              </div>
              <em>Calculado por nota</em>
            </article>

            <article>
              <span className="summary-icon orange">
                <ListChecks />
              </span>
              <div>
                <small>Entregas por revisar</small>
                <strong>{pendingTotal}</strong>
              </div>
              <em>Requieren atención</em>
            </article>
          </section>

          <Tabs
            value={filter}
            onValueChange={setFilter}
            className="project-tabs"
          >
            <div className="section-heading">
              <div>
                <h2>Grupos del curso</h2>
                <p>
                  Abre un grupo para revisar sus cinco etapas.
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
                  {pendingTotal > 0
                    ? ` (${pendingTotal})`
                    : ""}
                </TabsTrigger>
                <TabsTrigger value="final">
                  Finalizados
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {loading ? (
            <div className="empty-state tall">
              Cargando grupos...
            </div>
          ) : (
            <div className="project-grid">
              {visibleGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  stages={stages}
                  changing={
                    changingGroup === group.id
                  }
                  onOpen={() =>
                    setActiveGroupId(group.id)
                  }
                  onToggleActive={() =>
                    toggleGroup(group)
                  }
                />
              ))}

              {visibleGroups.length === 0 && (
                <div className="empty-state">
                  No hay grupos en este filtro.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {mobileNav && (
        <button
          className="nav-backdrop"
          onClick={() => setMobileNav(false)}
          aria-label="Cerrar menú"
        />
      )}

      {activeGroup && (
        <div
          className="detail-overlay"
          onMouseDown={() =>
            setActiveGroupId(null)
          }
        >
          <section
            className="detail-panel"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="detail-close"
              onClick={() =>
                setActiveGroupId(null)
              }
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
                } as CSSProperties
              }
            >
              <span>
                {activeGroup.pendingReviews > 0
                  ? "🟡"
                  : activeGroup.completion_approved
                  ? "🏆"
                  : "🤖"}
              </span>

              <div>
                <p>Grupo {activeGroup.id}</p>
                <h2>
                  {activeGroup.project_name ||
                    "Proyecto aún sin nombre"}
                </h2>
                <small>
                  {activeGroup.members ||
                    "Integrantes sin definir"}
                </small>
              </div>
            </div>

            <div className="detail-progress">
              <div>
                <span>Nota y progreso</span>
                <strong>
                  {activeGroup.grade}/20 ·{" "}
                  {activeGroup.progress}%
                </strong>
              </div>
              <Progress
                value={activeGroup.progress}
              />
            </div>

            <div className="stage-list">
              {stages.map((stage) => {
                const work =
                  activeGroup.stageWorks.find(
                    (item) =>
                      item.stage_id === stage.id
                  );

                if (!work) return null;

                const info =
                  STATUS_INFO[work.status];

                return (
                  <div
                    key={stage.id}
                    style={{
                      display: "grid",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      className={
                        work.status === "approved"
                          ? "stage-row done"
                          : "stage-row"
                      }
                    >
                      <span>{info.icon}</span>

                      <div style={{ flex: 1 }}>
                        <strong>
                          Etapa {stage.id} · {stage.name}
                        </strong>
                        <small>
                          {info.label} ·{" "}
                          {numeric(work.score)}/4 puntos
                        </small>

                        {work.submitted_at && (
                          <small
                            style={{
                              display: "block",
                              marginTop: 4,
                            }}
                          >
                            Enviado:{" "}
                            {formatDate(
                              work.submitted_at
                            )}
                          </small>
                        )}

                        {work.student_comment && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: 10,
                              background: "#f8fafc",
                              borderRadius: 10,
                              fontSize: 13,
                            }}
                          >
                            <strong>
                              💬 Estudiante:
                            </strong>{" "}
                            {work.student_comment}
                          </div>
                        )}

                        {work.teacher_comment &&
                          work.status !== "submitted" && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: 10,
                                background: "#f3f4f6",
                                borderRadius: 10,
                                fontSize: 13,
                              }}
                            >
                              <strong>
                                👨‍🏫 Profesor:
                              </strong>{" "}
                              {work.teacher_comment}
                            </div>
                          )}
                      </div>
                    </div>

                    {work.status === "submitted" && (
                      <div
                        style={{
                          border:
                            "1px solid #f2d38c",
                          background: "#fffbeb",
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            marginBottom: 5,
                            color: "#92400e",
                          }}
                        >
                          🟡 Entrega esperando revisión
                        </strong>

                        <p
                          style={{
                            fontSize: 13,
                            color: "#6b7280",
                            margin: "0 0 15px",
                          }}
                        >
                          Evalúa esta etapa. Si la apruebas, la
                          siguiente se desbloqueará automáticamente.
                        </p>

                        {renderSubmission(stage, work)}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(120px,160px) 1fr",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <label
                            style={{
                              display: "grid",
                              gap: 6,
                            }}
                          >
                            <strong>Nota /4</strong>
                            <input
                              type="number"
                              min="0"
                              max="4"
                              step="0.1"
                              value={
                                reviewScores[
                                  stage.id
                                ] ??
                                String(
                                  numeric(
                                    work.score
                                  )
                                )
                              }
                              onChange={(event) =>
                                setReviewScores(
                                  (current) => ({
                                    ...current,
                                    [stage.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              style={{
                                minHeight: 43,
                                border:
                                  "1px solid #d1d5db",
                                borderRadius: 10,
                                padding: "0 11px",
                              }}
                            />
                          </label>

                          <label
                            style={{
                              display: "grid",
                              gap: 6,
                            }}
                          >
                            <strong>Comentario</strong>
                            <textarea
                              rows={3}
                              value={
                                reviewComments[
                                  stage.id
                                ] ??
                                work.teacher_comment ??
                                ""
                              }
                              onChange={(event) =>
                                setReviewComments(
                                  (current) => ({
                                    ...current,
                                    [stage.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Felicitaciones, observaciones o correcciones..."
                              style={{
                                border:
                                  "1px solid #d1d5db",
                                borderRadius: 10,
                                padding: 11,
                                resize: "vertical",
                              }}
                            />
                          </label>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              reviewingStage === stage.id
                            }
                            onClick={() =>
                              reviewStage(
                                activeGroup.id,
                                work,
                                "correction_required"
                              )
                            }
                          >
                            🔄 Pedir corrección
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              reviewingStage === stage.id
                            }
                            onClick={() =>
                              reviewStage(
                                activeGroup.id,
                                work,
                                "rejected"
                              )
                            }
                            style={{
                              color: "#b91c1c",
                            }}
                          >
                            ❌ Rechazar
                          </Button>

                          <Button
                            type="button"
                            disabled={
                              reviewingStage === stage.id
                            }
                            onClick={() =>
                              reviewStage(
                                activeGroup.id,
                                work,
                                "approved"
                              )
                            }
                          >
                            ✅ Aprobar etapa
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {activeGroup.completion_approved && (
              <div
                style={{
                  marginTop: 20,
                  padding: 18,
                  borderRadius: 16,
                  textAlign: "center",
                  background: "#ecfdf5",
                  color: "#047857",
                }}
              >
                🏆 Proyecto culminado oficialmente.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
