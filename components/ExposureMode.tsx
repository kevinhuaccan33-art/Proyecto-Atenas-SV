"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Flag,
  HeartHandshake,
  Lightbulb,
  MonitorPlay,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Users,
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
  backgroundImage?: string;
  tagline?: string;
  projectEmoji?: string;
};

type CanvasContent = Record<string, unknown>;

type ExposureSection = {
  title: string;
  shortTitle: string;
  duration: number;
  label: string;
  text: string;
  help: string;
  icon: ReactNode;
};

const TOTAL_SECONDS = 240;
const INVALID_CANVAS_GROUPS = new Set([14]);

type CuratedGuide = {
  problem: string;
  solution: string;
  ai: string;
  benefit: string;
  limitation: string;
  objective: string;
};

const CURATED_GUIDES: Record<number, CuratedGuide> = {
  1: {
    problem: "En una cafetería, las esperas y las preguntas repetitivas pueden hacer más lenta la atención.",
    solution: "Scafe responde dudas del menú, muestra opciones y ayuda a realizar pedidos de forma más rápida.",
    ai: "La IA entiende preguntas del cliente y recomienda opciones según lo que busca.",
    benefit: "Ayuda a clientes y trabajadores a ahorrar tiempo durante la atención.",
    limitation: "Necesita información actualizada y no reemplaza la atención humana.",
    objective: "Mejorar la experiencia del cliente con una atención más rápida y clara.",
  },
  2: {
    problem: "Muchos videojuegos repiten ideas, personajes o mecánicas ya conocidas.",
    solution: "Innova Game IA ayuda a transformar una idea inicial en propuestas más creativas.",
    ai: "La IA sugiere personajes, escenarios, historias y mecánicas para inspirar nuevas ideas.",
    benefit: "Ayuda a los creadores a explorar alternativas antes de desarrollar su videojuego.",
    limitation: "Las ideas de la IA deben ser revisadas y mejoradas por una persona.",
    objective: "Impulsar la creatividad y la originalidad al diseñar videojuegos.",
  },
  4: {
    problem: "Muchas personas no tienen oportunidades sencillas para aprender y practicar lengua de señas.",
    solution: "ManosLab combina aprendizaje, práctica y pruebas para reforzar las señas.",
    ai: "La IA reconoce señas mediante la cámara y ayuda a comprobar la práctica.",
    benefit: "Permite practicar de forma interactiva desde distintos lugares.",
    limitation: "El reconocimiento puede fallar por iluminación, posición de las manos o pocas muestras.",
    objective: "Facilitar el aprendizaje básico de lengua de señas mediante práctica guiada.",
  },
  5: {
    problem: "Encontrar un objeto perdido puede ser lento cuando los reportes están dispersos.",
    solution: "C&S registra objetos perdidos y encontrados para buscar posibles coincidencias.",
    ai: "La IA reconoce objetos en imágenes y compara características para sugerir coincidencias.",
    benefit: "Puede reducir el tiempo necesario para localizar un objeto perdido.",
    limitation: "Una coincidencia no garantiza que sea el mismo objeto y debe verificarse.",
    objective: "Facilitar la recuperación de objetos mediante reconocimiento y comparación inteligente.",
  },
  6: {
    problem: "Una mala organización del tiempo puede dificultar el estudio y reducir el tiempo libre.",
    solution: "Krono organiza tareas, horarios y momentos de estudio según las prioridades del estudiante.",
    ai: "La IA propone una planificación y puede generar preguntas breves para reforzar temas.",
    benefit: "Ayuda a organizar mejor el estudio y equilibrarlo con otras actividades.",
    limitation: "El horario es una recomendación y debe adaptarse a cambios reales del estudiante.",
    objective: "Mejorar la organización del estudio y el aprovechamiento del tiempo.",
  },
  7: {
    problem: "Algunos adultos mayores pueden olvidar horarios de medicamentos o actividades importantes.",
    solution: "Wise Hearts usa a Ada para recordar rutinas, hidratación, citas y medicamentos ya indicados.",
    ai: "Ada organiza recordatorios y responde dudas básicas usando información previamente registrada.",
    benefit: "Apoya la rutina del adulto mayor y brinda mayor tranquilidad a familiares o cuidadores.",
    limitation: "Ada no diagnostica, receta ni cambia medicamentos o dosis.",
    objective: "Apoyar a los adultos mayores para recordar actividades importantes de su rutina.",
  },
  8: {
    problem: "La contaminación puede afectar ecosistemas, personas y futuras generaciones.",
    solution: "EcoDetect identifica un tipo de contaminación y muestra una recomendación básica de cuidado.",
    ai: "La IA analiza una imagen y la clasifica en una categoría ambiental.",
    benefit: "Ayuda a reconocer problemas ambientales y aprender una acción de cuidado.",
    limitation: "La clasificación puede equivocarse y no reemplaza una evaluación profesional.",
    objective: "Promover el cuidado ambiental mediante identificación y orientación sencilla.",
  },
  9: {
    problem: "La basura mal clasificada aumenta la contaminación y dificulta el reciclaje.",
    solution: "EcoAlerta reconoce residuos y orienta sobre cómo clasificarlos correctamente.",
    ai: "La IA analiza la imagen del residuo y estima a qué categoría pertenece.",
    benefit: "Ayuda a aprender cómo separar residuos y fomenta mejores hábitos ambientales.",
    limitation: "Puede confundirse con objetos parecidos o con imágenes de poca calidad.",
    objective: "Fomentar el reciclaje y reducir errores al clasificar residuos.",
  },
  10: {
    problem: "Un videojuego puede volverse repetitivo si los enemigos siempre reaccionan de la misma forma.",
    solution: "El proyecto crea un juego de Roblox con huevos de dinosaurio, bases, sigilo y defensa.",
    ai: "La lógica inteligente cambia el estado del dragón entre patrullaje, alerta y persecución según lo que hace el jugador.",
    benefit: "Hace que el juego sea más dinámico y obliga al jugador a tomar decisiones estratégicas.",
    limitation: "La experiencia depende de reglas programadas, conexión y funcionamiento correcto del juego.",
    objective: "Crear una experiencia de Roblox más estratégica, dinámica y entretenida.",
  },
  11: {
    problem: "Algunas familias de zonas alejadas pueden tener dificultades para acceder a alimentos.",
    solution: "Más Allá del Camino organiza campañas, registros y difusión para apoyar donaciones.",
    ai: "La IA ayuda a crear frases e ideas breves para carteles y campañas de difusión.",
    benefit: "Facilita la organización y comunicación de iniciativas de ayuda alimentaria.",
    limitation: "La IA no resuelve la logística ni garantiza recursos o donaciones.",
    objective: "Apoyar campañas de ayuda alimentaria para familias que lo necesitan.",
  },
  12: {
    problem: "Cada vez es más difícil estimar si un texto fue escrito por una persona o generado con IA.",
    solution: "LexiScan analiza patrones del texto y muestra una estimación experimental de su origen.",
    ai: "La IA revisa estructura, vocabulario y regularidad para producir una clasificación aproximada.",
    benefit: "Sirve como apoyo para analizar textos y hablar sobre autenticidad digital.",
    limitation: "No puede demostrar con certeza quién escribió un texto y puede equivocarse.",
    objective: "Explorar cómo los patrones lingüísticos pueden ayudar a analizar el posible origen de un texto.",
  },
};

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

function compact(value: unknown, max = 330) {
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
  const guide = CURATED_GUIDES[groupId] ?? null;
  const hasValidCanvas =
    Boolean(canvas) && !INVALID_CANVAS_GROUPS.has(groupId);

  const noInfo = (label: string) =>
    hasValidCanvas
      ? "Guía pendiente de revisión para " + label + "."
      : "Pendiente: completa o actualiza el proyecto para preparar esta guía.";

  return [
    {
      title: "Presentación",
      shortTitle: "Presentación",
      duration: 20,
      label: "Quiénes somos",
      text: projectName
        ? "Somos " + (members || "el Grupo " + groupId) + " y presentamos " + projectName + "."
        : "Grupo " + groupId + ": proyecto pendiente de definir.",
      help: "Solo preséntense y digan el nombre del proyecto. No expliquen todavía todos los detalles.",
      icon: <Users size={30} />,
    },
    {
      title: "El problema",
      shortTitle: "Problema",
      duration: 35,
      label: "Qué queremos resolver",
      text: guide?.problem || noInfo("el problema"),
      help: "Explíquenlo con sus propias palabras y, si pueden, den un ejemplo corto.",
      icon: <Target size={30} />,
    },
    {
      title: "Nuestra solución",
      shortTitle: "Solución",
      duration: 35,
      label: "Qué proponemos",
      text: guide?.solution || noInfo("la solución"),
      help: "Digan qué hace el proyecto en una sola idea. No enumeren todas sus funciones.",
      icon: <Lightbulb size={30} />,
    },
    {
      title: "¿Dónde está la IA?",
      shortTitle: "La IA",
      duration: 35,
      label: "La parte inteligente",
      text: guide?.ai || noInfo("el uso de IA"),
      help: "Expliquen qué recibe la IA y qué resultado produce. Eso debe quedar muy claro.",
      icon: <BrainCircuit size={30} />,
    },
    {
      title: "Demostración",
      shortTitle: "Demo",
      duration: 65,
      label: "Mostrar, no explicar",
      text:
        DEMO_TIPS[groupId] ||
        "Muestra una entrada, el procesamiento y un resultado concreto del prototipo.",
      help: "Hagan una sola prueba preparada. El reloj seguirá corriendo dentro de la demostración.",
      icon: <MonitorPlay size={30} />,
    },
    {
      title: "Beneficio y límite",
      shortTitle: "Impacto",
      duration: 30,
      label: "Impacto real",
      text: guide
        ? "Beneficio: " + guide.benefit + " Límite: " + guide.limitation
        : noInfo("el beneficio y la limitación"),
      help: "Mencionen solo un beneficio y una limitación. Eso demuestra que conocen el alcance real del proyecto.",
      icon: <HeartHandshake size={30} />,
    },
    {
      title: "Cierre",
      shortTitle: "Cierre",
      duration: 20,
      label: "La idea que debe quedar",
      text: guide?.objective || noInfo("el objetivo final"),
      help: "Cierren con esta idea en una frase. No agreguen información nueva.",
      icon: <Flag size={30} />,
    },
  ];
}

function TimerCard({
  mm,
  ss,
  tone,
  compactMode = false,
}: {
  mm: string;
  ss: string;
  tone: { bg: string; fg: string; border: string; label: string };
  compactMode?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: compactMode ? 17 : 24,
        padding: compactMode ? "12px 14px" : "18px 16px",
        background: tone.bg,
        color: tone.fg,
        border: "1px solid " + tone.border,
        textAlign: "center",
        boxShadow: compactMode ? "none" : "0 14px 34px rgba(15,23,42,.08)",
      }}
    >
      <small
        style={{
          display: "block",
          fontWeight: 950,
          letterSpacing: .9,
          marginBottom: 5,
          fontSize: compactMode ? 10 : 11,
        }}
      >
        TIEMPO RESTANTE
      </small>
      <strong
        style={{
          display: "block",
          fontSize: compactMode ? 34 : 48,
          lineHeight: 1,
          letterSpacing: -1.5,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {mm}:{ss}
      </strong>
      <small
        style={{
          display: "inline-flex",
          marginTop: 9,
          padding: "5px 10px",
          borderRadius: 999,
          background: "rgba(255,255,255,.68)",
          fontWeight: 900,
        }}
      >
        {tone.label}
      </small>
    </div>
  );
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
  backgroundImage = "",
  tagline = "",
  projectEmoji = "✨",
}: ExposureModeProps) {
  const [canvas, setCanvas] = useState<CanvasContent | null>(null);
  const [members, setMembers] = useState("");
  const [resolvedName, setResolvedName] = useState(projectName?.trim() || "");
  const [logoUrl, setLogoUrl] = useState("");
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
            .select("project_name,members,logo_path")
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

        const rawLogo = String(groupResult.data?.logo_path || "").trim();
        if (rawLogo) {
          if (/^https?:\/\//i.test(rawLogo)) {
            setLogoUrl(rawLogo);
          } else {
            const { data } = await supabase.storage
              .from("project-assets")
              .createSignedUrl(rawLogo, 3600);
            if (alive) setLogoUrl(data?.signedUrl || "");
          }
        } else {
          setLogoUrl("");
        }

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
        if (alive) {
          setCanvas(null);
          setLogoUrl("");
        }
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
        // El tiempo oficial terminó aunque el guardado externo falle.
      });
    }
  }, [open, elapsed, onFinished]);

  useEffect(() => {
    if (!open || minimized) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open, minimized]);

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

  if (minimized) {
    return (
      <div
        style={{
          position: "fixed",
          top: 84,
          right: 18,
          zIndex: 100700,
          width: "min(310px,calc(100vw - 36px))",
          borderRadius: 24,
          padding: 13,
          background: "rgba(255,255,255,.96)",
          border: "1px solid rgba(255,255,255,.8)",
          boxShadow: "0 22px 60px rgba(15,23,42,.24)",
          backdropFilter: "blur(18px)",
          fontFamily:
            'Inter, Aptos, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <TimerCard mm={mm} ss={ss} tone={timerTone} compactMode />
        <button
          type="button"
          onClick={onRestore}
          style={{
            width: "100%",
            minHeight: 42,
            marginTop: 9,
            border: 0,
            borderRadius: 13,
            background: "linear-gradient(135deg," + accent + "," + accent2 + ")",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ← Volver a la presentación
        </button>
        <small
          style={{
            display: "block",
            marginTop: 8,
            textAlign: "center",
            color: "#64748b",
            lineHeight: 1.35,
          }}
        >
          El reloj sigue corriendo mientras muestran la IA.
        </small>
      </div>
    );
  }

  const currentNumber = currentIndex + 1;
  const heroBg = backgroundImage
    ? `linear-gradient(90deg,rgba(15,23,42,.90),rgba(15,23,42,.66) 48%,rgba(15,23,42,.20)),url("${backgroundImage}") center/cover`
    : `linear-gradient(135deg,${accent},${accent2})`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100500,
        background:
          "radial-gradient(circle at 10% 0%, " +
          accent +
          "16, transparent 34%), linear-gradient(180deg,#f8fafc,#f3f4f8)",
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
          zIndex: 20,
          minHeight: 68,
          padding: "9px clamp(16px,3vw,34px)",
          background: "rgba(255,255,255,.94)",
          borderBottom: "1px solid rgba(226,232,240,.9)",
          backdropFilter: "blur(18px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 950,
              fontSize: 19,
              background: "linear-gradient(135deg," + accent + "," + accent2 + ")",
              boxShadow: "0 8px 20px " + accent + "2d",
            }}
          >
            A
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block", fontSize: 16, color: "#111827" }}>
              Atenas IA Lab
            </strong>
            <small style={{ color: "#64748b" }}>
              Grupo {groupId} · {officialMode ? "Exposición oficial" : "Modo práctica"}
            </small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              minWidth: 110,
              borderRadius: 14,
              padding: "8px 12px",
              background: timerTone.bg,
              color: timerTone.fg,
              border: "1px solid " + timerTone.border,
              textAlign: "center",
            }}
          >
            <strong style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
              {mm}:{ss}
            </strong>
            <small style={{ display: "block", fontSize: 9, fontWeight: 900 }}>
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
              minHeight: 42,
              border: 0,
              borderRadius: 13,
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
                  : .6,
            }}
          >
            {officialMode && hasStarted ? (
              <>
                <Timer size={16} /> En curso
              </>
            ) : (
              <>
                {running ? <Pause size={16} /> : <Play size={16} />}{" "}
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
                width: 42,
                height: 42,
                border: "1px solid #dbe2ea",
                borderRadius: 13,
                background: "white",
                display: "grid",
                placeItems: "center",
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
              width: 42,
              height: 42,
              border: 0,
              borderRadius: 13,
              background: "#111827",
              color: "white",
              display: "grid",
              placeItems: "center",
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
            height: 5,
            borderRadius: 999,
            overflow: "hidden",
            background: "#e5e7eb",
          }}
        >
          <div
            style={{
              height: "100%",
              width: progress + "%",
              background: "linear-gradient(90deg," + accent + "," + accent2 + ")",
              transition: "width .25s ease",
            }}
          />
        </div>
      </header>

      <main
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "24px clamp(16px,3vw,34px) 40px",
        }}
      >
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
            minHeight: 210,
            borderRadius: 28,
            overflow: "hidden",
            background: heroBg,
            color: "white",
            position: "relative",
            boxShadow: "0 18px 50px rgba(15,23,42,.12)",
          }}
        >
          <div
            style={{
              minHeight: 210,
              padding: "clamp(24px,4vw,44px)",
              display: "flex",
              alignItems: "center",
              gap: 24,
              position: "relative",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: 92,
                height: 92,
                flex: "0 0 auto",
                borderRadius: 24,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,.94)",
                border: "1px solid rgba(255,255,255,.75)",
                boxShadow: "0 14px 35px rgba(15,23,42,.18)",
                overflow: "hidden",
                color: accent,
                fontSize: 42,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={"Logo de " + (resolvedName || "proyecto")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    padding: 8,
                  }}
                />
              ) : (
                projectEmoji
              )}
            </div>

            <div style={{ minWidth: 0, maxWidth: 920 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: 999,
                  padding: "6px 10px",
                  background: "rgba(255,255,255,.14)",
                  border: "1px solid rgba(255,255,255,.22)",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: .8,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={14} /> MODO EXPOSICIÓN · GRUPO {groupId}
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(32px,4.3vw,60px)",
                  lineHeight: .98,
                  letterSpacing: -1.8,
                  textShadow: "0 2px 16px rgba(15,23,42,.22)",
                }}
              >
                {resolvedName || "Proyecto sin nombre"}
              </h1>
              <p
                style={{
                  margin: "11px 0 0",
                  color: "rgba(255,255,255,.86)",
                  fontSize: "clamp(14px,1.5vw,18px)",
                  fontWeight: 650,
                }}
              >
                {tagline || "Proyecto de Inteligencia Artificial"}
              </p>
            </div>
          </div>
        </section>

        <div
          style={{
            marginTop: 14,
            borderRadius: 18,
            padding: "12px 15px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            color: "#475569",
            boxShadow: "0 8px 24px rgba(15,23,42,.05)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>🎤</span>
          <div>
            <strong style={{ color: accent }}>Guía breve para exponer</strong>
            <small style={{ display: "block", marginTop: 2, lineHeight: 1.4 }}>
              Esta pantalla es una guía breve. No la lean completa: expliquen cada idea con sus propias palabras.
            </small>
          </div>
        </div>

        <section
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(285px,340px)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 15 }}>
            <section
              style={{
                minHeight: 410,
                borderRadius: 28,
                padding: "clamp(26px,4vw,46px)",
                background: "rgba(255,255,255,.96)",
                border: "1px solid rgba(226,232,240,.96)",
                boxShadow: "0 18px 50px rgba(15,23,42,.08)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: 240,
                  height: 240,
                  right: -95,
                  top: -100,
                  borderRadius: "50%",
                  background: accent + "0d",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 18,
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      background: "linear-gradient(135deg," + accent + "," + accent2 + ")",
                      boxShadow: "0 12px 28px " + accent + "2a",
                    }}
                  >
                    {current.icon}
                  </div>
                  <div>
                    <small
                      style={{
                        display: "block",
                        color: accent,
                        fontWeight: 950,
                        letterSpacing: .9,
                      }}
                    >
                      {String(currentNumber).padStart(2, "0")} · {loading ? "CARGANDO…" : current.label.toUpperCase()}
                    </small>
                    <h2
                      style={{
                        margin: "4px 0 0",
                        fontSize: "clamp(30px,3.6vw,48px)",
                        lineHeight: 1.04,
                        color: "#111827",
                        letterSpacing: -1.2,
                      }}
                    >
                      {current.title}
                    </h2>
                  </div>
                </div>

                <div
                  style={{
                    maxWidth: 930,
                    fontSize: "clamp(17px,1.7vw,22px)",
                    lineHeight: 1.55,
                    color: "#334155",
                    fontWeight: 600,
                  }}
                >
                  {current.text}
                </div>

                <div
                  style={{
                    marginTop: 26,
                    borderRadius: 18,
                    padding: "15px 16px",
                    background: "linear-gradient(135deg," + accent + "0b,#ffffff)",
                    border: "1px solid " + accent + "1f",
                    color: "#475569",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: accent }}>💡 Ayuda para exponer:</strong>{" "}
                  {current.help}
                </div>

                {onOpenDemo && (
                  <button
                    type="button"
                    onClick={onOpenDemo}
                    style={{
                      marginTop: 17,
                      minHeight: 48,
                      border: 0,
                      borderRadius: 14,
                      padding: "0 18px",
                      background: "linear-gradient(135deg," + accent + "," + accent2 + ")",
                      color: "white",
                      fontWeight: 950,
                      cursor: "pointer",
                      boxShadow: "0 10px 24px " + accent + "30",
                    }}
                  >
                    <MonitorPlay size={18} /> Abrir demostración
                    {hasStarted ? " · el reloj continúa" : ""}
                  </button>
                )}
              </div>
            </section>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={currentIndex === 0 || (officialMode && hasStarted)}
                onClick={() => {
                  if (officialMode && hasStarted) return;
                  setRunning(false);
                  setElapsed(starts[Math.max(0, currentIndex - 1)]);
                }}
                style={{
                  minHeight: 44,
                  borderRadius: 13,
                  border: "1px solid #dbe2ea",
                  padding: "0 15px",
                  background: "white",
                  color: "#334155",
                  fontWeight: 850,
                  cursor:
                    currentIndex === 0 || (officialMode && hasStarted)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    currentIndex === 0 || (officialMode && hasStarted)
                      ? .48
                      : 1,
                }}
              >
                <ArrowLeft size={17} /> Anterior
              </button>

              <div
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 750,
                }}
              >
                Máximo 4:00 min
              </div>

              <button
                type="button"
                disabled={
                  currentIndex === sections.length - 1 ||
                  (officialMode && hasStarted)
                }
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
                  minHeight: 44,
                  borderRadius: 13,
                  border: 0,
                  padding: "0 16px",
                  background: accent,
                  color: "white",
                  fontWeight: 900,
                  cursor:
                    currentIndex === sections.length - 1 ||
                    (officialMode && hasStarted)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    currentIndex === sections.length - 1 ||
                    (officialMode && hasStarted)
                      ? .5
                      : 1,
                }}
              >
                Siguiente <ArrowRight size={17} />
              </button>
            </div>
          </div>

          <aside
            style={{
              position: "sticky",
              top: 94,
              display: "grid",
              gap: 13,
            }}
          >
            <TimerCard mm={mm} ss={ss} tone={timerTone} />

            <div
              style={{
                borderRadius: 24,
                padding: 15,
                background: "rgba(255,255,255,.96)",
                border: "1px solid #e2e8f0",
                boxShadow: "0 14px 38px rgba(15,23,42,.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "4px 4px 12px",
                }}
              >
                <strong style={{ fontSize: 14 }}>Estructura</strong>
                <small style={{ color: "#94a3b8", fontWeight: 850 }}>4:00</small>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {sections.map((section, index) => {
                  const active = index === currentIndex;
                  const completed = index < currentIndex;
                  return (
                    <button
                      key={section.title}
                      type="button"
                      onClick={() => {
                        if (officialMode && hasStarted) return;
                        setRunning(false);
                        setElapsed(starts[index]);
                      }}
                      style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "32px 1fr auto",
                        alignItems: "center",
                        gap: 9,
                        minHeight: 46,
                        padding: "6px 8px",
                        borderRadius: 13,
                        border: active
                          ? "1px solid " + accent + "35"
                          : "1px solid transparent",
                        background: active ? accent + "0c" : "transparent",
                        color: active ? accent : "#475569",
                        textAlign: "left",
                        cursor:
                          officialMode && hasStarted ? "default" : "pointer",
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 10,
                          display: "grid",
                          placeItems: "center",
                          background: active
                            ? accent
                            : completed
                            ? "#ecfdf5"
                            : "#f1f5f9",
                          color: active
                            ? "white"
                            : completed
                            ? "#047857"
                            : "#64748b",
                          fontWeight: 950,
                          fontSize: 12,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: 12,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {section.shortTitle}
                        </strong>
                      </span>
                      <small
                        style={{
                          color: active ? accent : "#94a3b8",
                          fontWeight: 850,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {section.duration}s
                      </small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                padding: 13,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                fontSize: 11,
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: "#334155" }}>
                {officialMode ? "Exposición oficial" : "Práctica"}
              </strong>
              <br />
              {officialMode
                ? "Una vez iniciado, el tiempo continúa aunque abras la demostración."
                : "Puedes navegar, pausar y reiniciar libremente mientras practicas."}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
