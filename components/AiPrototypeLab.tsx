"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BrainCircuit, Camera, Play, Sparkles } from "lucide-react";

type Props = {
  groupId: number;
  projectName?: string | null;
  prototypeUrl?: string | null;
};

type Sample = {
  x: number[];
  label: string;
};

type Prediction = {
  className: string;
  probability: number;
};

const VISION_GROUPS = new Set([4, 5, 8, 9, 11, 12]);

function distance(a: number[], b: number[]) {
  return Math.sqrt(
    a.reduce((sum, value, index) => {
      const delta = value - (b[index] ?? 0);
      return sum + delta * delta;
    }, 0)
  );
}

function knnPredict(input: number[], samples: Sample[], k = 3) {
  const nearest = samples
    .map((sample) => ({
      ...sample,
      distance: distance(input, sample.x),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(k, samples.length));

  const votes = new Map<string, { count: number; distance: number }>();

  for (const item of nearest) {
    const current = votes.get(item.label) ?? { count: 0, distance: 0 };
    current.count += 1;
    current.distance += item.distance;
    votes.set(item.label, current);
  }

  return [...votes.entries()]
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return a[1].distance - b[1].distance;
    })[0]?.[0] ?? "Sin resultado";
}

function normalizeWords(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function similarity(query: string, text: string) {
  const a = new Set(normalizeWords(query));
  const b = new Set(normalizeWords(text));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  return intersection / Math.sqrt(a.size * b.size);
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("No se pudo cargar la librería de IA."));
    document.head.appendChild(script);
  });
}

function VisionDemo({ groupId, projectName, prototypeUrl }: Props) {
  const [modelUrl, setModelUrl] = useState("");
  const [status, setStatus] = useState("Pega el enlace de tu modelo de Teachable Machine.");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [busy, setBusy] = useState(false);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const webcamRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(`atenas-tm-model-${groupId}`) ?? "";
    const fromStage = String(prototypeUrl ?? "").includes("teachablemachine.withgoogle.com/models/")
      ? String(prototypeUrl)
      : "";
    setModelUrl(fromStage || saved);
  }, [groupId, prototypeUrl]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      try {
        webcamRef.current?.stop?.();
      } catch {
        // nothing
      }
    };
  }, []);

  async function startModel() {
    const raw = modelUrl.trim();
    if (!raw) {
      setStatus("Falta pegar el enlace del modelo exportado de Teachable Machine.");
      return;
    }

    if (!raw.includes("teachablemachine.withgoogle.com/models/")) {
      setStatus("Ese enlace no parece ser un modelo de Teachable Machine.");
      return;
    }

    setBusy(true);
    setStatus("Cargando modelo...");

    try {
      window.localStorage.setItem(`atenas-tm-model-${groupId}`, raw);

      await loadScript(
        "atenas-tfjs",
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"
      );
      await loadScript(
        "atenas-tm-image",
        "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js"
      );

      const tmImage = (window as any).tmImage;
      if (!tmImage) throw new Error("Teachable Machine no se cargó correctamente.");

      const base = raw.endsWith("/") ? raw : `${raw}/`;
      const model = await tmImage.load(`${base}model.json`, `${base}metadata.json`);
      modelRef.current = model;

      const webcam = new tmImage.Webcam(300, 300, true);
      await webcam.setup();
      await webcam.play();
      webcamRef.current = webcam;
      runningRef.current = true;

      if (canvasHostRef.current) {
        canvasHostRef.current.innerHTML = "";
        canvasHostRef.current.appendChild(webcam.canvas);
      }

      setStatus(`Modelo conectado: ${projectName || `Grupo ${groupId}`}.`);

      const loop = async () => {
        if (!runningRef.current || !webcamRef.current || !modelRef.current) return;
        webcamRef.current.update();
        const result = (await modelRef.current.predict(webcamRef.current.canvas)) as Prediction[];
        setPredictions(
          [...result]
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 5)
        );
        window.requestAnimationFrame(loop);
      };

      loop();
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : "No se pudo iniciar el modelo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <strong style={{ display: "block", marginBottom: 6 }}>
          Modelo visual · Teachable Machine
        </strong>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          Pega el enlace que aparece al exportar el modelo. La cámara mostrará la predicción y la confianza en vivo.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={modelUrl}
          onChange={(event) => setModelUrl(event.target.value)}
          placeholder="https://teachablemachine.withgoogle.com/models/.../"
          style={{
            flex: "1 1 360px",
            minHeight: 44,
            border: "1px solid #cbd5e1",
            borderRadius: 11,
            padding: "0 12px",
          }}
        />
        <button
          type="button"
          onClick={startModel}
          disabled={busy}
          style={{
            minHeight: 44,
            border: 0,
            borderRadius: 11,
            padding: "0 16px",
            background: "#4f46e5",
            color: "white",
            fontWeight: 800,
            cursor: busy ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Camera size={18} />
          {busy ? "Cargando..." : "Iniciar cámara"}
        </button>
      </div>

      <small style={{ color: "#64748b" }}>{status}</small>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 16,
        }}
      >
        <div
          ref={canvasHostRef}
          style={{
            minHeight: 260,
            borderRadius: 18,
            background: "#0f172a",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            color: "#cbd5e1",
          }}
        >
          {!webcamRef.current && <span>La cámara aparecerá aquí</span>}
        </div>

        <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
          <strong>Predicciones</strong>
          {predictions.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: 14 }}>
              Inicia la cámara para ver resultados.
            </div>
          ) : (
            predictions.map((prediction) => (
              <div
                key={prediction.className}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 11,
                  background: "white",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{prediction.className}</strong>
                  <span>{Math.round(prediction.probability * 100)}%</span>
                </div>
                <div
                  style={{
                    height: 7,
                    background: "#e2e8f0",
                    borderRadius: 999,
                    marginTop: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(prediction.probability * 100)}%`,
                      background: "#4f46e5",
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SafeWalkDemo() {
  const [hour, setHour] = useState(20);
  const [light, setLight] = useState(1);
  const [people, setPeople] = useState(1);
  const [incidents, setIncidents] = useState(2);
  const [result, setResult] = useState("");

  const samples: Sample[] = [
    { x: [0.58, 1, 1, 0], label: "🟢 Riesgo bajo" },
    { x: [0.63, 0.7, 0.7, 0.2], label: "🟢 Riesgo bajo" },
    { x: [0.79, 0.5, 0.5, 0.4], label: "🟡 Precaución" },
    { x: [0.88, 0.2, 0.2, 0.8], label: "🔴 Riesgo alto" },
    { x: [0.96, 0.1, 0.1, 1], label: "🔴 Riesgo alto" },
    { x: [0.25, 0.3, 0.2, 0.6], label: "🟡 Precaución" },
  ];

  function run() {
    setResult(knnPredict([hour / 24, light / 2, people / 2, incidents / 5], samples));
  }

  return (
    <DataDemoShell
      title="SafeWalk · Clasificación de riesgo"
      explanation="La IA compara las características de una zona con ejemplos previamente clasificados mediante K-NN. Es una demostración educativa, no una garantía de seguridad real."
      result={result}
      onRun={run}
    >
      <NumberField label="Hora (0–23)" value={hour} min={0} max={23} onChange={setHour} />
      <SelectField label="Iluminación" value={light} onChange={setLight} options={[[0, "Baja"], [1, "Media"], [2, "Alta"]]} />
      <SelectField label="Cantidad de personas" value={people} onChange={setPeople} options={[[0, "Pocas"], [1, "Algunas"], [2, "Muchas"]]} />
      <NumberField label="Incidentes registrados" value={incidents} min={0} max={5} onChange={setIncidents} />
    </DataDemoShell>
  );
}

function StudyQuestDemo() {
  const [days, setDays] = useState(2);
  const [difficulty, setDifficulty] = useState(2);
  const [minutes, setMinutes] = useState(90);
  const [importance, setImportance] = useState(3);
  const [result, setResult] = useState("");

  const samples: Sample[] = [
    { x: [0.05, 1, 0.8, 1], label: "🔴 Prioridad alta" },
    { x: [0.1, 0.7, 0.6, 1], label: "🔴 Prioridad alta" },
    { x: [0.35, 0.7, 0.5, 0.7], label: "🟡 Prioridad media" },
    { x: [0.6, 0.3, 0.2, 0.3], label: "🟢 Prioridad baja" },
    { x: [0.25, 0.3, 0.3, 0.7], label: "🟡 Prioridad media" },
    { x: [0.8, 0.3, 0.2, 0.3], label: "🟢 Prioridad baja" },
  ];

  function run() {
    setResult(knnPredict([Math.min(days, 14) / 14, difficulty / 3, Math.min(minutes, 180) / 180, importance / 3], samples));
  }

  return (
    <DataDemoShell
      title="StudyQuest · Priorizador de tareas"
      explanation="El modelo compara una tarea nueva con ejemplos de tareas ya etiquetadas como prioridad alta, media o baja."
      result={result}
      onRun={run}
    >
      <NumberField label="Días restantes" value={days} min={0} max={14} onChange={setDays} />
      <SelectField label="Dificultad" value={difficulty} onChange={setDifficulty} options={[[1, "Baja"], [2, "Media"], [3, "Alta"]]} />
      <NumberField label="Tiempo estimado (min)" value={minutes} min={10} max={180} onChange={setMinutes} />
      <SelectField label="Importancia" value={importance} onChange={setImportance} options={[[1, "Baja"], [2, "Media"], [3, "Alta"]]} />
    </DataDemoShell>
  );
}

function MapForgeDemo() {
  const [style, setStyle] = useState(2);
  const [difficulty, setDifficulty] = useState(2);
  const [players, setPlayers] = useState(4);
  const [result, setResult] = useState("");

  const samples: Sample[] = [
    { x: [0, 0.3, 0.15], label: "🌲 Bosque de exploración" },
    { x: [0, 0.7, 0.25], label: "🏔️ Ruinas y aventura" },
    { x: [0.5, 1, 0.5], label: "⚔️ Arena competitiva" },
    { x: [0.5, 0.7, 0.75], label: "🏟️ Arena por equipos" },
    { x: [1, 0.3, 0.75], label: "🏙️ Ciudad social" },
    { x: [1, 0.5, 1], label: "🎉 Plaza multijugador" },
  ];

  function run() {
    setResult(knnPredict([style / 2, difficulty / 3, players / 8], samples));
  }

  return (
    <DataDemoShell
      title="Innova Game IA · Recomendador de mapas"
      explanation="La IA usa preferencias del jugador para recomendar el mapa más parecido a ejemplos anteriores."
      result={result}
      onRun={run}
    >
      <SelectField label="Estilo de jugador" value={style} onChange={setStyle} options={[[0, "Explorador"], [1, "Competitivo"], [2, "Social"]]} />
      <SelectField label="Dificultad" value={difficulty} onChange={setDifficulty} options={[[1, "Fácil"], [2, "Media"], [3, "Difícil"]]} />
      <NumberField label="Número de jugadores" value={players} min={1} max={8} onChange={setPlayers} />
    </DataDemoShell>
  );
}

function GameDemo() {
  const [distanceValue, setDistanceValue] = useState(35);
  const [health, setHealth] = useState(60);
  const [enemies, setEnemies] = useState(2);
  const [result, setResult] = useState("");

  const samples: Sample[] = [
    { x: [0.1, 0.9, 0.2], label: "⚔️ Atacar" },
    { x: [0.25, 0.8, 0.3], label: "⚔️ Atacar" },
    { x: [0.45, 0.5, 0.5], label: "🛡️ Defender" },
    { x: [0.3, 0.35, 0.7], label: "🛡️ Defender" },
    { x: [0.2, 0.2, 1], label: "🏃 Escapar" },
    { x: [0.7, 0.15, 0.7], label: "🏃 Escapar" },
  ];

  function run() {
    setResult(knnPredict([distanceValue / 100, health / 100, enemies / 5], samples));
  }

  return (
    <DataDemoShell
      title="Videojuego 2D · Decisión del personaje"
      explanation="El clasificador decide una acción según la distancia del enemigo, la vida restante y la cantidad de enemigos."
      result={result}
      onRun={run}
    >
      <NumberField label="Distancia del enemigo" value={distanceValue} min={0} max={100} onChange={setDistanceValue} />
      <NumberField label="Vida del jugador (%)" value={health} min={0} max={100} onChange={setHealth} />
      <NumberField label="Cantidad de enemigos" value={enemies} min={1} max={5} onChange={setEnemies} />
    </DataDemoShell>
  );
}

function AssistantDemo({ senior = false }: { senior?: boolean }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  const knowledge = senior
    ? [
        ["recordatorio pastilla medicamento horario", "Puedo ayudarte a recordar un horario que ya haya sido indicado por un adulto responsable o profesional de salud."],
        ["consulta cita medico doctor", "Puedes registrar la fecha y hora de una consulta para recibir un recordatorio."],
        ["familia contacto emergencia", "Mantén visible un contacto familiar o de emergencia para situaciones importantes."],
        ["corazon dolor diagnostico enfermedad", "Este prototipo no diagnostica problemas de salud. Ante síntomas o una emergencia, se debe contactar a un adulto responsable o profesional de salud."],
      ]
    : [
        ["menu comida desayuno almuerzo productos", "Puedo mostrar las opciones disponibles del menú de la cafetería."],
        ["precio cuesta costo pagar", "Puedo consultar precios y opciones de pago registradas por la cafetería."],
        ["horario abre cierra atencion", "Puedo informar el horario de atención configurado por la cafetería."],
        ["vegetariano alergia ingredientes", "Puedo ayudar a consultar ingredientes u opciones alimentarias registradas."],
        ["pedido ordenar comprar", "Puedo orientar al cliente para elegir un producto y preparar su pedido."],
      ];

  function run() {
    if (!query.trim()) return;
    const ranked = knowledge
      .map(([keywords, response]) => ({
        response,
        score: similarity(query, keywords),
      }))
      .sort((a, b) => b.score - a.score);

    if (!ranked[0] || ranked[0].score < 0.12) {
      setAnswer("No encontré una respuesta clara. Esta es una buena prueba para detectar qué información falta en la base de conocimiento.");
      return;
    }
    setAnswer(ranked[0].response);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <strong style={{ display: "block", marginBottom: 6 }}>
          {senior ? "SeniorAlert · Asistente de recordatorios" : "Scafe · Asistente de atención al cliente"}
        </strong>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
          Esta demo usa similitud de texto para buscar la respuesta más relacionada dentro de una pequeña base de conocimiento.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") run();
          }}
          placeholder={senior ? "Ej. ¿Cuándo debo recordar mi cita?" : "Ej. ¿Qué opciones del menú tienen?"}
          style={{
            flex: "1 1 320px",
            minHeight: 44,
            border: "1px solid #cbd5e1",
            borderRadius: 11,
            padding: "0 12px",
          }}
        />
        <button type="button" onClick={run} style={primaryButtonStyle}>
          <Sparkles size={17} /> Consultar
        </button>
      </div>

      {answer && (
        <div style={{ borderRadius: 16, padding: 16, background: "#eef2ff", color: "#312e81" }}>
          <strong>Respuesta de la IA</strong>
          <p style={{ marginBottom: 0 }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

function GenericDemo({ projectName }: { projectName?: string | null }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  function run() {
    const words = normalizeWords(text);
    if (!words.length) return;
    const label = words.length > 12 ? "Entrada extensa" : words.length > 5 ? "Entrada media" : "Entrada breve";
    setResult(`${label} · ${words.length} palabras útiles detectadas`);
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <strong>{projectName || "Proyecto IA"} · Demo genérica</strong>
      <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
        Este grupo todavía no tiene un motor específico configurado. Puede usar esta prueba básica hasta que se asigne su tipo de IA.
      </p>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="Escribe una entrada de prueba..."
        style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}
      />
      <button type="button" onClick={run} style={{ ...primaryButtonStyle, width: "fit-content" }}>
        <Play size={17} /> Probar
      </button>
      {result && <div style={{ padding: 14, borderRadius: 14, background: "#f1f5f9" }}>{result}</div>}
    </div>
  );
}

function DataDemoShell({
  title,
  explanation,
  result,
  onRun,
  children,
}: {
  title: string;
  explanation: string;
  result: string;
  onRun: () => void;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <strong style={{ display: "block", marginBottom: 6 }}>{title}</strong>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{explanation}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
        {children}
      </div>
      <button type="button" onClick={onRun} style={{ ...primaryButtonStyle, width: "fit-content" }}>
        <BrainCircuit size={17} /> Ejecutar IA
      </button>
      {result && (
        <div style={{ borderRadius: 16, padding: 18, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <small style={{ color: "#047857", fontWeight: 800 }}>RESULTADO</small>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{result}</div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 10, padding: "0 10px" }}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: [number, string][];
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 10, padding: "0 10px", background: "white" }}
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

const primaryButtonStyle: CSSProperties = {
  minHeight: 44,
  border: 0,
  borderRadius: 11,
  padding: "0 16px",
  background: "#4f46e5",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export function AiPrototypeLab({ groupId, projectName, prototypeUrl }: Props) {
  const mode = useMemo(() => {
    if (VISION_GROUPS.has(groupId)) return "vision";
    if (groupId === 1) return "assistant";
    if (groupId === 2) return "maps";
    if (groupId === 3) return "safewalk";
    if (groupId === 6) return "study";
    if (groupId === 7) return "senior";
    if (groupId === 10) return "game";
    return "generic";
  }, [groupId]);

  return (
    <section
      style={{
        background: "linear-gradient(135deg,#ffffff,#f5f3ff)",
        border: "1px solid #ddd6fe",
        borderRadius: 24,
        padding: 24,
        margin: "20px 0",
        boxShadow: "0 14px 35px rgba(79,70,229,.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <small style={{ color: "#6d28d9", fontWeight: 900, letterSpacing: .7 }}>LABORATORIO IA · DEMO EN VIVO</small>
          <h2 style={{ margin: "6px 0 4px" }}>Probar mi IA</h2>
          <p style={{ margin: 0, color: "#64748b" }}>
            Entrada → modelo → resultado. Esta sección sirve para demostrar y explicar el prototipo directamente desde Atenas IA Lab.
          </p>
        </div>
        <span style={{ borderRadius: 999, padding: "8px 12px", background: "#ede9fe", color: "#5b21b6", fontWeight: 800, fontSize: 12 }}>
          GRUPO {groupId}
        </span>
      </div>

      {mode === "vision" && <VisionDemo groupId={groupId} projectName={projectName} prototypeUrl={prototypeUrl} />}
      {mode === "assistant" && <AssistantDemo />}
      {mode === "senior" && <AssistantDemo senior />}
      {mode === "maps" && <MapForgeDemo />}
      {mode === "safewalk" && <SafeWalkDemo />}
      {mode === "study" && <StudyQuestDemo />}
      {mode === "game" && <GameDemo />}
      {mode === "generic" && <GenericDemo projectName={projectName} />}
    </section>
  );
}
