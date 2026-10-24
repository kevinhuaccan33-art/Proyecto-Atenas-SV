"use client";

import { useEffect, useMemo, useState } from "react";
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
  active: boolean;
  completion_approved: boolean;
};

type Stage = {
  id: number;
  name: string;
  milestone_percent: number;
};

type StageWork = {
  group_id: number;
  stage_id: number;
  status: StageStatus;
  score: number | string;
};

const STATUS: Record<StageStatus, { icon: string; label: string }> = {
  locked: { icon: "🔒", label: "Bloqueada" },
  editable: { icon: "✏️", label: "En trabajo" },
  submitted: { icon: "🟡", label: "En revisión" },
  correction_required: { icon: "🔄", label: "Corrección" },
  approved: { icon: "✅", label: "Aprobada" },
  rejected: { icon: "❌", label: "Rechazada" },
};

function numeric(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export default function ViewerPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Dirección");
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [work, setWork] = useState<StageWork[]>([]);
  const [message, setMessage] = useState("");
  const [openGroup, setOpenGroup] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      try {
        const supabase = await getSupabase();
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;

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

        if (profile.role === "admin") {
          window.location.replace("/");
          return;
        }

        if (profile.role === "student") {
          window.location.replace("/student");
          return;
        }

        if (profile.role !== "viewer") {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (mounted) {
          setName(profile.display_name || "Dirección");
          setReady(true);
        }
      } catch {
        window.location.replace("/login");
      }
    }

    verify();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      setLoading(true);
      setMessage("");

      try {
        const supabase = await getSupabase();

        const [groupsResult, stagesResult, workResult] = await Promise.all([
          supabase
            .from("groups")
            .select("id,members,project_name,active,completion_approved")
            .order("id", { ascending: true }),

          supabase
            .from("stages")
            .select("id,name,milestone_percent")
            .order("id", { ascending: true }),

          supabase
            .from("group_stage_work")
            .select("group_id,stage_id,status,score")
            .order("group_id", { ascending: true })
            .order("stage_id", { ascending: true }),
        ]);

        if (groupsResult.error) throw groupsResult.error;
        if (stagesResult.error) throw stagesResult.error;
        if (workResult.error) throw workResult.error;

        setGroups((groupsResult.data ?? []) as GroupRow[]);
        setStages((stagesResult.data ?? []) as Stage[]);
        setWork((workResult.data ?? []) as StageWork[]);
      } catch (error) {
        console.error(error);
        setMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el seguimiento."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [ready]);

  const summary = useMemo(() => {
    return groups.map((group) => {
      const groupWork = work.filter(
        (item) => Number(item.group_id) === group.id
      );

      const grade = groupWork
        .filter((item) => item.status === "approved")
        .reduce((total, item) => total + numeric(item.score), 0);

      const roundedGrade = Math.round(grade * 100) / 100;
      const progress = Math.min(
        100,
        Math.round(roundedGrade * 5 * 10) / 10
      );

      return {
        ...group,
        grade: roundedGrade,
        progress,
        approved: groupWork.filter((item) => item.status === "approved")
          .length,
        pending: groupWork.filter((item) => item.status === "submitted")
          .length,
        correction: groupWork.filter(
          (item) => item.status === "correction_required"
        ).length,
        stageWork: groupWork,
      };
    });
  }, [groups, work]);

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!ready || loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "Arial, sans-serif",
          background: "#f5f7fb",
          color: "#374151",
        }}
      >
        Cargando seguimiento...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "18px 24px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1250,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                color: "#6c56d9",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 0.5,
              }}
            >
              ATENAS SV
            </div>

            <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>
              Atenas IA Lab · Seguimiento
            </h1>

            <div style={{ marginTop: 4, color: "#6b7280", fontSize: 14 }}>
              Vista de solo lectura · {name}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 10,
              background: "white",
              padding: "9px 14px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <section
        style={{
          maxWidth: 1250,
          margin: "0 auto",
          padding: "28px 24px 50px",
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>
            Proyectos de Inteligencia Artificial II
          </h2>

          <p style={{ margin: "7px 0 0", color: "#6b7280" }}>
            Puedes consultar el avance de los grupos, pero no editar notas,
            trabajos ni configuraciones.
          </p>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 18,
              padding: 14,
              borderRadius: 12,
              background: "#fff1f2",
              color: "#be123c",
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))",
            gap: 16,
          }}
        >
          {summary.map((group) => {
            const isOpen = openGroup === group.id;

            return (
              <article
                key={group.id}
                style={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 18,
                  boxShadow: "0 7px 24px rgba(31,41,55,.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#6c56d9",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      GRUPO {group.id}
                    </div>

                    <h3 style={{ margin: "5px 0 5px", fontSize: 19 }}>
                      {group.project_name?.trim() || `Grupo ${group.id}`}
                    </h3>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "5px 9px",
                      fontSize: 12,
                      fontWeight: 700,
                      background: group.completion_approved
                        ? "#dcfce7"
                        : group.active
                        ? "#eef2ff"
                        : "#f3f4f6",
                      color: group.completion_approved
                        ? "#166534"
                        : group.active
                        ? "#5145cd"
                        : "#6b7280",
                    }}
                  >
                    {group.completion_approved
                      ? "Finalizado"
                      : group.active
                      ? "Activo"
                      : "Inactivo"}
                  </span>
                </div>

                <p
                  style={{
                    minHeight: 40,
                    margin: "0 0 16px",
                    color: "#6b7280",
                    lineHeight: 1.4,
                  }}
                >
                  {group.members?.trim() || "Sin integrantes asignados"}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 7,
                    fontSize: 13,
                  }}
                >
                  <span>Nota / progreso</span>
                  <strong>
                    {group.grade}/20 · {group.progress}%
                  </strong>
                </div>

                <div
                  style={{
                    height: 9,
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "#e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: `${group.progress}%`,
                      height: "100%",
                      background: "#6c56d9",
                      transition: "width .2s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 12,
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  <span>✅ {group.approved}/5</span>
                  <span>🟡 {group.pending} revisión</span>
                  <span>🔄 {group.correction} corrección</span>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenGroup(isOpen ? null : group.id)}
                  style={{
                    width: "100%",
                    marginTop: 15,
                    border: "1px solid #d8d3ff",
                    background: "#f8f7ff",
                    color: "#5544c7",
                    borderRadius: 10,
                    padding: "9px 12px",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  {isOpen ? "Ocultar etapas" : "Ver etapas"}
                </button>

                {isOpen && (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {stages.map((stage) => {
                      const item = group.stageWork.find(
                        (current) => Number(current.stage_id) === stage.id
                      );

                      const status = STATUS[item?.status ?? "locked"];

                      return (
                        <div
                          key={stage.id}
                          style={{
                            border: "1px solid #ececf2",
                            borderRadius: 10,
                            padding: "9px 10px",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            fontSize: 13,
                          }}
                        >
                          <span>
                            <strong>{stage.id}.</strong> {stage.name}
                          </span>

                          <span style={{ whiteSpace: "nowrap" }}>
                            {status.icon} {status.label}
                            {item?.status === "approved"
                              ? ` · ${numeric(item.score)}/4`
                              : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
