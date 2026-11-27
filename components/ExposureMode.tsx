"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

type ExposureModeProps = {
  open: boolean;
  onClose: () => void;
  groupId: number;
  projectName?: string | null;
  accent: string;
  accent2: string;
  canStart?: boolean;
  disabledMessage?: string;
  onFinished?: () => void | Promise<void>;
  minimized?: boolean;
  onOpenDemo?: () => void;
  onRestore?: () => void;
};

type CanvasContent = Record<string, unknown>;

type ExposureSection = {
  title: string;
  duration: number;
  label: string;
  text: string;
  help: string;
};

const TOTAL_SECONDS = 240;
const INVALID_CANVAS_GROUPS = new Set([14]);

const DEMO_TIPS: Record<number, string> = {
  1: "Haz una consulta real, realiza un pedido y muestra el contador de preparación.",
  2: "Escribe una idea sencilla de videojuego y muestra cómo la herramienta propone personaje, escenario, mecánica y un giro creativo.",
  3: "Activa el mapa, muestra una ruta y explica los colores verde, amarillo y rojo. Si el Canvas aún está vacío, presenta solo la demostración.",
  4: "Muestra una lección breve, luego usa la cámara para reconocer una seña y termina con la práctica.",
  5: "Reconoce un objeto con la cámara y después muestra una coincidencia entre un reporte perdido y uno encontrado.",
  6: "Ingresa tareas y tiempo disponible, genera el horario y luego muestra un mini cuestionario.",
  7: "Presenta a Ada y muestra una rutina ficticia de recordatorios. Aclara que no diagnostica ni cambia dosis.",
  8: "Muestra una imagen de contaminación, clasifícala y explica la recomendación de cuidado.",
  9: "Reconoce un residuo y enseña en qué categoría debe depositarse.",
  10: "Cambia distancia, sigilo y visibilidad para mostrar Patrullaje, Alerta y Persecución del dragón guardián.",
  11: "Muestra una campaña de ayuda alimentaria: zona, familias, recursos y una frase de difusión.",
  12: "Pega un texto y muestra el análisis experimental de patrones. Aclara que no prueba con certeza quién escribió el texto.",
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function compact(value: unknown, max = 360) {
  const clean = textValue(value).replace(/\s+/g, " ");
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

function emptyText(label: string) {
  return "Pendiente: completa " + label + " en el Canvas para que esta ayuda aparezca automáticamente.";
}

function buildSections(
  groupId: number,
  projectName: string,
  members: string,
  canvas: CanvasContent | null
): ExposureSection[] {
  const validCanvas = canvas && !INVALID_CANVAS_GROUPS.has(groupId);
  const problem = validCanvas ? compact(canvas.problem) : "";
  const solution = validCanvas ? compact(canvas.solution) : "";
  const aiUse = validCanvas ? compact(canvas.ai_use) : "";
  const beneficiaries = validCanvas ? compact(canvas.beneficiaries, 260) : "";
  const limitations = validCanvas ? compact(canvas.limitations, 260) : "";
  const objective = validCanvas ? compact(canvas.objective, 260) : "";

  return [
    {
      title: "1. Presentación",
      duration: 20,
      label: "Quiénes somos",
      text: projectName
        ? "Somos " + (members || "el Grupo " + groupId) + " y nuestro proyecto se llama " + projectName + "."
        : "Grupo " + groupId + ": define el nombre del proyecto en la Etapa 1.",
      help: "Di el nombre del proyecto y quiénes integran el equipo. No expliques todavía todos los detalles.",
    },
    {
      title: "2. Problema",
      duration: 35,
      label: "¿Qué queremos resolver?",
      text: problem || emptyText("el problema"),
      help: "Explícalo con una situación concreta. Evita leer todo el párrafo del Canvas.",
    },
    {
      title: "3. Nuestra solución",
      duration: 35,
      label: "¿Qué proponemos?",
      text: solution || emptyText("la solución"),
      help: "Resume qué hace su proyecto y qué recibe el usuario como resultado.",
    },
    {
      title: "4. ¿Dónde está la IA?",
      duration: 35,
      label: "La parte inteligente",
      text: aiUse || emptyText("el uso de IA"),
      help: "Nombra claramente qué analiza, reconoce, recomienda, organiza o genera la IA.",
    },
    {
      title: "5. Demostración",
      duration: 65,
      label: "Mostrar, no explicar demasiado",
      text: DEMO_TIPS[groupId] || "Muestra una entrada, el procesamiento y un resultado concreto del prototipo.",
      help: "Haz solo una prueba preparada. Si algo falla, explica en una frase qué debía ocurrir y continúa.",
    },
    {
      title: "6. Beneficio y límite",
      duration: 30,
      label: "Impacto real",
      text:
        (beneficiaries ? "Beneficia a: " + beneficiaries : emptyText("los beneficiarios")) +
        (limitations ? " Límite importante: " + limitations : ""),
      help: "Menciona a quién ayuda y una limitación real. Esto demuestra que entienden su proyecto.",
    },
    {
      title: "7. Cierre",
      duration: 20,
      label: "Idea final",
      text: objective
        ? "Nuestro objetivo es: " + objective
        : "Cierra con una frase que recuerde el objetivo principal del proyecto.",
      help: "Termina mirando al público. Una frase corta vale más que leer otro párrafo.",
    },
  ];
}

export function ExposureMode({
  open,
  onClose,
  groupId,
  projectName,
  accent,
  accent2,
  canStart = true,
  disabledMessage = "",
  onFinished,
  minimized = false,
  onOpenDemo,
  onRestore,
}: ExposureModeProps) {
  const [canvas, setCanvas] = useState<CanvasContent | null>(null);
  const [members, setMembers] = useState("");
  const [resolvedName, setResolvedName] = useState(projectName?.trim() || "");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const finishReportedRef = useRef(false);
  const officialMode = Boolean(onFinished);
  const hasStarted = elapsed > 0 || running;

  useEffect(() => {
    if (!open) return;
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const supabase = await getSupabase();
        const [groupResult, canvasResult] = await Promise.all([
          supabase
            .from("groups")
            .select("project_name,members")
            .eq("id", groupId)
            .single(),
          supabase
            .from("group_stage_work")
            .select("content,status")
            .eq("group_id", groupId)
            .eq("stage_id", 2)
            .single(),
        ]);

        if (!alive) return;

        setResolvedName(
          String(groupResult.data?.project_name || projectName || "").trim()
        );
        setMembers(String(groupResult.data?.members || "").trim());

        const raw = canvasResult.data?.content;
        const hasData =
          raw &&
          typeof raw === "object" &&
          Object.values(raw as Record<string, unknown>).some(
            (value) => typeof value === "string" && value.trim().length > 0
          );

        setCanvas(
          hasData && !INVALID_CANVAS_GROUPS.has(groupId)
            ? (raw as CanvasContent)
            : null
        );
      } catch {
        if (alive) setCanvas(null);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [open, groupId, projectName]);

  useEffect(() => {
    if (!open || !running) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => {
        if (value >= TOTAL_SECONDS) {
          setRunning(false);
          return TOTAL_SECONDS;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, running]);

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setElapsed(0);
      finishReportedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (
      open &&
      elapsed >= TOTAL_SECONDS &&
      !finishReportedRef.current
    ) {
      finishReportedRef.current = true;
      Promise.resolve(onFinished?.()).catch(() => {
        // La exposición terminó aunque el guardado externo falle.
      });
    }
  }, [open, elapsed, onFinished]);

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);

  const sections = useMemo(
    () => buildSections(groupId, resolvedName, members, canvas),
    [groupId, resolvedName, members, canvas]
  );

  const starts = useMemo(() => {
    let cursor = 0;
    return sections.map((section) => {
      const value = cursor;
      cursor += section.duration;
      return value;
    });
  }, [sections]);

  let currentIndex = sections.length - 1;
  for (let index = 0; index < sections.length; index += 1) {
    const end = starts[index] + sections[index].duration;
    if (elapsed < end) {
      currentIndex = index;
      break;
    }
  }

  const current = sections[currentIndex];
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = Math.min(100, (elapsed / TOTAL_SECONDS) * 100);
  const timerTone =
    remaining <= 30
      ? { bg: "#fff1f2", fg: "#be123c", border: "#fecdd3", label: "Cierre" }
      : remaining <= 60
      ? { bg: "#fffbeb", fg: "#b45309", border: "#fde68a", label: "Último minuto" }
      : { bg: "#ecfdf5", fg: "#047857", border: "#bbf7d0", label: "Buen ritmo" };

  if (!open) return null;


  if (open && minimized) {
    return (
      <div
        style={{
          position: "fixed",
          top: 86,
          right: 18,
          zIndex: 100700,
          width: "min(310px,calc(100vw - 36px))",
          borderRadius: 22,
          padding: 14,
          background: "rgba(255,255,255,.97)",
          border: "1px solid " + timerTone.border,
          boxShadow: "0 18px 50px rgba(15,23,42,.22)",
          backdropFilter: "blur(16px)",
          fontFamily:
            'Inter, Aptos, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          style={{
            borderRadius: 17,
            padding: "12px 14px",
            background: timerTone.bg,
            color: timerTone.fg,
            border: "1px solid " + timerTone.border,
            textAlign: "center",
          }}
        >
          <small style={{ display: "block", fontWeight: 950, letterSpacing: .7 }}>
            {officialMode ? "EXPOSICIÓN OFICIAL" : "MODO PRÁCTICA"}
          </small>
          <strong
            style={{
              display: "block",
              marginTop: 3,
              fontSize: 36,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mm}:{ss}
          </strong>
          <small style={{ display: "block", marginTop: 6, fontWeight: 900 }}>
            {timerTone.label}
          </small>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onRestore}
            style={{
              flex: 1,
              minHeight: 42,
              border: 0,
              borderRadius: 12,
              background: "linear-gradient(135deg," + accent + "," + accent2 + ")",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ← Volver a la guía
          </button>
          {!officialMode && (
            <button
              type="button"
              onClick={() => setRunning((value) => !value)}
              style={{
                minHeight: 42,
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                padding: "0 12px",
                background: "white",
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              {running ? "Pausar" : "Seguir"}
            </button>
          )}
        </div>

        <small
          style={{
            display: "block",
            marginTop: 9,
            color: "#64748b",
            lineHeight: 1.35,
          }}
        >
          El reloj sigue corriendo mientras muestras el prototipo.
        </small>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100500,
        background: "#f4f6fb",
        color: "#172033",
        overflow: "auto",
        fontFamily:
          'Inter, Aptos, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          minHeight: 72,
          padding: "10px clamp(16px,3vw,34px)",
          background: "rgba(255,255,255,.97)",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong style={{ display: "block", fontSize: 18 }}>
            🎤 {officialMode ? "Exposición oficial" : "Modo práctica"}
          </strong>
          <small style={{ color: "#64748b" }}>
            Grupo {groupId} · {resolvedName || "Proyecto sin nombre"}
          </small>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div
            style={{
              borderRadius: 14,
              padding: "9px 14px",
              background: timerTone.bg,
              color: timerTone.fg,
              border: "1px solid " + timerTone.border,
              fontWeight: 950,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Timer size={17} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {mm}:{ss}
            <small style={{ display: "block", marginTop: 2, fontSize: 10, letterSpacing: .4 }}>
              {timerTone.label}
            </small>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!canStart) return;
              if (officialMode && hasStarted) return;
              setRunning((value) => !value);
            }}
            disabled={!canStart || (officialMode && hasStarted)}
            style={{
              border: 0,
              borderRadius: 13,
              minHeight: 42,
              padding: "0 14px",
              background: "linear-gradient(135deg," + accent + "," + accent2 + ")",
              color: "white",
              fontWeight: 900,
              cursor:
                canStart && !(officialMode && hasStarted)
                  ? "pointer"
                  : "not-allowed",
              opacity:
                canStart && !(officialMode && hasStarted)
                  ? 1
                  : .55,
            }}
            title={!canStart ? disabledMessage : undefined}
          >
            {officialMode && hasStarted ? (
              <>
                <Timer size={17} /> En curso
              </>
            ) : (
              <>
                {running ? <Pause size={17} /> : <Play size={17} />}{" "}
                {running ? "Pausar" : elapsed ? "Continuar" : "Iniciar"}
              </>
            )}
          </button>
          {!officialMode && (
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setElapsed(0);
            }}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 13,
              width: 42,
              height: 42,
              background: "white",
              cursor: "pointer",
            }}
            aria-label="Reiniciar"
          >
            <RotateCcw size={17} />
          </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (officialMode && hasStarted) {
                onOpenDemo?.();
                return;
              }
              onClose();
            }}
            style={{
              border: 0,
              borderRadius: 13,
              width: 42,
              height: 42,
              background: "#111827",
              color: "white",
              cursor: "pointer",
            }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            flexBasis: "100%",
            height: 7,
            borderRadius: 999,
            background: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: progress + "%",
              height: "100%",
              background: "linear-gradient(90deg," + accent + "," + accent2 + ")",
              transition: "width .3s ease",
            }}
          />
        </div>
      </header>

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "28px clamp(16px,3vw,34px) 50px" }}>
        {!canStart && disabledMessage && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 16,
              padding: 14,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              fontWeight: 800,
            }}
          >
            🔒 {disabledMessage}
          </div>
        )}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(230px,.34fr) minmax(0,1fr)",
            gap: 22,
            alignItems: "start",
          }}
        >
          <aside
            style={{
              borderRadius: 24,
              background: "white",
              border: "1px solid #e2e8f0",
              padding: 14,
              boxShadow: "0 14px 40px rgba(15,23,42,.07)",
              position: "sticky",
              top: 98,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                padding: "16px 12px",
                marginBottom: 12,
                textAlign: "center",
                background: timerTone.bg,
                color: timerTone.fg,
                border: "1px solid " + timerTone.border,
              }}
            >
              <small
                style={{
                  display: "block",
                  fontWeight: 950,
                  letterSpacing: .8,
                  marginBottom: 4,
                }}
              >
                TIEMPO RESTANTE
              </small>
              <strong
                style={{
                  display: "block",
                  fontSize: 38,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {mm}:{ss}
              </strong>
              <small
                style={{
                  display: "block",
                  marginTop: 6,
                  fontWeight: 900,
                }}
              >
                {timerTone.label}
              </small>
            </div>

            <strong style={{ display: "block", padding: "6px 8px 12px" }}>
              Estructura · máximo 4 min
            </strong>
            <div style={{ display: "grid", gap: 7 }}>
              {sections.map((section, index) => (
                <button
                  key={section.title}
                  type="button"
                  onClick={() => {
                    if (officialMode && hasStarted) return;
                    setRunning(false);
                    setElapsed(starts[index]);
                  }}
                  style={{
                    border: index === currentIndex ? "1px solid " + accent + "55" : "1px solid transparent",
                    background: index === currentIndex ? accent + "10" : "transparent",
                    color: index === currentIndex ? accent : "#475569",
                    borderRadius: 14,
                    padding: "11px 12px",
                    textAlign: "left",
                    cursor:
                      officialMode && hasStarted
                        ? "default"
                        : "pointer",
                    fontWeight: index === currentIndex ? 900 : 700,
                  }}
                >
                  {section.title}
                  <small style={{ display: "block", marginTop: 3, opacity: .72 }}>
                    {section.duration} s
                  </small>
                </button>
              ))}
            </div>
          </aside>

          <div style={{ display: "grid", gap: 18 }}>
            <section
              style={{
                borderRadius: 30,
                padding: "clamp(24px,4vw,48px)",
                background: "linear-gradient(135deg,#ffffff," + accent + "0b)",
                border: "1px solid " + accent + "25",
                boxShadow: "0 22px 65px rgba(15,23,42,.09)",
              }}
            >
              <small style={{ color: accent, fontWeight: 950, letterSpacing: .8 }}>
                {loading ? "CARGANDO CANVAS…" : current.label.toUpperCase()}
              </small>
              <h1 style={{ margin: "8px 0 16px", fontSize: "clamp(30px,4vw,52px)", lineHeight: 1.05 }}>
                {current.title}
              </h1>
              <div
                style={{
                  fontSize: "clamp(18px,2vw,25px)",
                  lineHeight: 1.55,
                  color: "#25314a",
                  maxWidth: 980,
                  whiteSpace: "pre-wrap",
                }}
              >
                {current.text}
              </div>

              <div
                style={{
                  marginTop: 24,
                  borderRadius: 18,
                  padding: 16,
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
                  lineHeight: 1.5,
                }}
              >
                <strong>💡 Ayuda para exponer:</strong> {current.help}
              </div>

              {onOpenDemo && (
                <button
                  type="button"
                  onClick={onOpenDemo}
                  style={{
                    marginTop: 16,
                    minHeight: 48,
                    border: 0,
                    borderRadius: 14,
                    padding: "0 18px",
                    background:
                      "linear-gradient(135deg," + accent + "," + accent2 + ")",
                    color: "white",
                    fontWeight: 950,
                    cursor: "pointer",
                    boxShadow: "0 10px 24px " + accent + "30",
                  }}
                >
                  ▶ Abrir demostración · el reloj continuará
                </button>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24 }}>
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => {
                    if (officialMode && hasStarted) return;
                    setRunning(false);
                    setElapsed(starts[Math.max(0, currentIndex - 1)]);
                  }}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 14,
                    minHeight: 44,
                    padding: "0 16px",
                    background: "white",
                    cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                    opacity: currentIndex === 0 ? .45 : 1,
                    fontWeight: 850,
                  }}
                >
                  <ChevronLeft size={17} /> Anterior
                </button>

                <button
                  type="button"
                  disabled={currentIndex === sections.length - 1}
                  onClick={() => {
                    if (officialMode && hasStarted) return;
                    setRunning(false);
                    setElapsed(
                      currentIndex < sections.length - 1
                        ? starts[currentIndex + 1]
                        : TOTAL_SECONDS
                    );
                  }}
                  style={{
                    border: 0,
                    borderRadius: 14,
                    minHeight: 44,
                    padding: "0 17px",
                    background: accent,
                    color: "white",
                    cursor: currentIndex === sections.length - 1 ? "not-allowed" : "pointer",
                    opacity: currentIndex === sections.length - 1 ? .55 : 1,
                    fontWeight: 900,
                  }}
                >
                  Siguiente <ChevronRight size={17} />
                </button>
              </div>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 12,
              }}
            >
              {[
                ["Habla, no leas", "Usa esta guía como recordatorio, no como discurso completo."],
                ["Una sola demo", "Prepara una prueba que funcione y evita cambiar de ejemplo durante la exposición."],
                ["Cierre claro", "Termina diciendo qué aporta el proyecto y cuál es su principal límite."],
              ].map(([title, description]) => (
                <div
                  key={title}
                  style={{
                    borderRadius: 18,
                    padding: 16,
                    background: "white",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <strong>{title}</strong>
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>
                    {description}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
