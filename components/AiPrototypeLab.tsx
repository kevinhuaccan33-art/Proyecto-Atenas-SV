"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  BrainCircuit,
  Camera,
  ChevronRight,
  ImagePlus,
  Maximize2,
  RotateCcw,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

type Props = {
  groupId: number;
  projectName?: string | null;
  prototypeUrl?: string | null;
};

type Prediction = {
  className: string;
  probability: number;
};

type Sample = {
  x: number[];
  label: string;
};

type Theme = {
  fallbackName: string;
  tagline: string;
  emoji: string;
  accent: string;
  accent2: string;
  soft: string;
  background: string;
  image: string;
  decorations: string[];
};

const VISION_GROUPS = new Set([4, 5, 8, 9, 11, 12]);

const THEMES: Record<number, Theme> = {
  1: {
    fallbackName: "SmartCafé IA",
    tagline: "Asistente inteligente de cafetería",
    emoji: "☕",
    accent: "#6d28d9",
    accent2: "#d97706",
    soft: "#f5f3ff",
    background:
      "radial-gradient(circle at 12% 20%,rgba(251,191,36,.38),transparent 25%), radial-gradient(circle at 88% 12%,rgba(109,40,217,.32),transparent 25%), linear-gradient(135deg,#3f2418 0%,#6f422a 44%,#2f1b18 100%)",
    image: "/demo-themes/scafe.png",
    decorations: ["☕", "🥐", "🍞", "🍪"],
  },
  2: {
    fallbackName: "Innova Game IA",
    tagline: "Buscador inteligente de mapas",
    emoji: "🎮",
    accent: "#6d28d9",
    accent2: "#2563eb",
    soft: "#eef2ff",
    background:
      "radial-gradient(circle at 8% 20%,rgba(34,197,94,.48),transparent 24%), radial-gradient(circle at 88% 18%,rgba(59,130,246,.5),transparent 28%), linear-gradient(135deg,#312e81,#2563eb 55%,#60a5fa)",
    image: "/demo-themes/innova.png",
    decorations: ["🗺️", "🏰", "🌲", "🧱"],
  },
  3: {
    fallbackName: "SafeWalk",
    tagline: "Ruta segura y alerta inteligente",
    emoji: "🛡️",
    accent: "#6d28d9",
    accent2: "#16a34a",
    soft: "#f5f3ff",
    background:
      "radial-gradient(circle at 8% 15%,rgba(34,197,94,.28),transparent 24%), radial-gradient(circle at 90% 15%,rgba(109,40,217,.32),transparent 25%), linear-gradient(135deg,#312e81,#5b21b6 45%,#7c3aed)",
    image: "/demo-themes/safewalk.png",
    decorations: ["📍", "🚶", "🚦", "🏙️"],
  },
  4: {
    fallbackName: "SignaIA",
    tagline: "Reconocimiento de lenguaje de señas",
    emoji: "🤟",
    accent: "#7c3aed",
    accent2: "#db2777",
    soft: "#faf5ff",
    background:
      "radial-gradient(circle at 12% 20%,rgba(216,180,254,.5),transparent 28%), radial-gradient(circle at 90% 20%,rgba(244,114,182,.3),transparent 26%), linear-gradient(135deg,#4c1d95,#7e22ce 52%,#a855f7)",
    image: "/demo-themes/manoslab.png",
    decorations: ["🤟", "👋", "👍", "👏"],
  },
  5: {
    fallbackName: "FindIt AI",
    tagline: "Reconocimiento de objetos perdidos",
    emoji: "🔎",
    accent: "#6d28d9",
    accent2: "#2563eb",
    soft: "#f5f3ff",
    background:
      "radial-gradient(circle at 10% 18%,rgba(96,165,250,.3),transparent 25%), radial-gradient(circle at 88% 12%,rgba(192,132,252,.36),transparent 25%), linear-gradient(135deg,#312e81,#5b21b6 52%,#4338ca)",
    image: "/demo-themes/objetos.png",
    decorations: ["🎒", "📚", "🧴", "🔑"],
  },
  6: {
    fallbackName: "StudyQuest IA",
    tagline: "Organizador inteligente del tiempo",
    emoji: "🗓️",
    accent: "#6d28d9",
    accent2: "#0891b2",
    soft: "#f5f3ff",
    background:
      "radial-gradient(circle at 10% 20%,rgba(251,191,36,.28),transparent 24%), radial-gradient(circle at 90% 18%,rgba(59,130,246,.24),transparent 25%), linear-gradient(135deg,#5b21b6,#7c3aed 50%,#9333ea)",
    image: "/demo-themes/krono.png",
    decorations: ["⏰", "📚", "✅", "✏️"],
  },
  7: {
    fallbackName: "SeniorCare",
    tagline: "Apoyo inteligente para adultos mayores",
    emoji: "💜",
    accent: "#7c3aed",
    accent2: "#e11d48",
    soft: "#fff7ed",
    background:
      "radial-gradient(circle at 10% 20%,rgba(251,191,36,.3),transparent 25%), radial-gradient(circle at 90% 16%,rgba(244,114,182,.32),transparent 24%), linear-gradient(135deg,#6d28d9,#a855f7 55%,#ec4899)",
    image: "/demo-themes/seniorcare.png",
    decorations: ["❤️", "⏰", "💊", "📅"],
  },
  8: {
    fallbackName: "PetID AI",
    tagline: "Reconocimiento de mascotas",
    emoji: "🐾",
    accent: "#6d28d9",
    accent2: "#16a34a",
    soft: "#faf5ff",
    background:
      "radial-gradient(circle at 10% 18%,rgba(74,222,128,.32),transparent 25%), radial-gradient(circle at 88% 15%,rgba(192,132,252,.38),transparent 25%), linear-gradient(135deg,#4c1d95,#6d28d9 50%,#7c3aed)",
    image: "/demo-themes/petvision.png",
    decorations: ["🐶", "🐱", "🐰", "🐾"],
  },
  9: {
    fallbackName: "EcoDetect",
    tagline: "Detección ambiental inteligente",
    emoji: "♻️",
    accent: "#15803d",
    accent2: "#6d28d9",
    soft: "#f0fdf4",
    background:
      "radial-gradient(circle at 10% 18%,rgba(34,197,94,.5),transparent 26%), radial-gradient(circle at 90% 20%,rgba(59,130,246,.3),transparent 25%), linear-gradient(135deg,#14532d,#15803d 50%,#0f766e)",
    image: "/demo-themes/ecodetect.png",
    decorations: ["♻️", "🌱", "🗑️", "🌎"],
  },
  10: {
    fallbackName: "Videojuego 2D con IA",
    tagline: "Aventura 2D con decisiones inteligentes",
    emoji: "🕹️",
    accent: "#6d28d9",
    accent2: "#f59e0b",
    soft: "#faf5ff",
    background:
      "radial-gradient(circle at 10% 20%,rgba(34,197,94,.36),transparent 25%), radial-gradient(circle at 90% 15%,rgba(245,158,11,.3),transparent 25%), linear-gradient(135deg,#312e81,#4c1d95 52%,#6d28d9)",
    image: "/demo-themes/pixelquest.png",
    decorations: ["🪙", "⚔️", "🏰", "⭐"],
  },
  11: {
    fallbackName: "FruitVision AI",
    tagline: "Reconocimiento de frutas",
    emoji: "🍎",
    accent: "#16a34a",
    accent2: "#dc2626",
    soft: "#f0fdf4",
    background:
      "radial-gradient(circle at 10% 18%,rgba(248,113,113,.42),transparent 26%), radial-gradient(circle at 90% 16%,rgba(250,204,21,.38),transparent 25%), linear-gradient(135deg,#166534,#16a34a 48%,#65a30d)",
    image: "/demo-themes/frutiai.png",
    decorations: ["🍎", "🍌", "🍊", "🍓"],
  },
  12: {
    fallbackName: "NutriAI",
    tagline: "Clasificación visual de alimentos",
    emoji: "🥗",
    accent: "#16a34a",
    accent2: "#f59e0b",
    soft: "#f0fdf4",
    background:
      "radial-gradient(circle at 10% 18%,rgba(74,222,128,.38),transparent 25%), radial-gradient(circle at 88% 16%,rgba(251,191,36,.32),transparent 25%), linear-gradient(135deg,#14532d,#15803d 50%,#65a30d)",
    image: "/demo-themes/nutriai.png",
    decorations: ["🥗", "🥕", "🍎", "🥦"],
  },
};

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
    .map((sample) => ({ ...sample, distance: distance(input, sample.x) }))
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

function extractTeachableUrl(source: string) {
  const text = String(source ?? "");
  const match = text.match(
    /https:\/\/teachablemachine\.withgoogle\.com\/models\/[A-Za-z0-9_-]+\/?(?:model\.json)?/i
  );
  if (!match) return "";
  return match[0].replace(/model\.json$/i, "").replace(/\/$/, "") + "/";
}

function sortPredictions(result: Prediction[]) {
  return [...result].sort((a, b) => b.probability - a.probability).slice(0, 5);
}

const primaryButton: CSSProperties = {
  minHeight: 48,
  border: 0,
  borderRadius: 14,
  padding: "0 20px",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  boxShadow: "0 12px 26px rgba(30,41,59,.16)",
};

const fieldStyle: CSSProperties = {
  width: "100%",
  minHeight: 48,
  border: "1px solid rgba(148,163,184,.55)",
  borderRadius: 14,
  padding: "0 14px",
  background: "rgba(255,255,255,.94)",
  color: "#172033",
  fontSize: 15,
  outline: "none",
};

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 20,
        background: "rgba(255,255,255,.92)",
        border: "1px solid rgba(255,255,255,.55)",
        boxShadow: "0 18px 50px rgba(15,23,42,.16)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ResultBadge({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: 18,
        background: `${accent}12`,
        border: `1px solid ${accent}35`,
      }}
    >
      {children}
    </div>
  );
}

function VisionDemo({ groupId, projectName, prototypeUrl, theme }: Props & { theme: Theme }) {
  const initialFromStage = extractTeachableUrl(String(prototypeUrl ?? ""));
  const [modelSource, setModelSource] = useState("");
  const [modelUrl, setModelUrl] = useState(initialFromStage);
  const [status, setStatus] = useState(
    initialFromStage
      ? "Modelo encontrado en la Etapa 4. Puedes probarlo."
      : "Configura el modelo una sola vez pegando el enlace o código de Teachable Machine."
  );
  const [showSetup, setShowSetup] = useState(!initialFromStage);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [busy, setBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [mode, setMode] = useState<"idle" | "camera" | "image">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const predictionTimerRef = useRef<number | null>(null);
  const modelRef = useRef<any>(null);
  const runningRef = useRef(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const groupHints: Record<number, string[]> = {
    4: ["Hola", "Gracias", "Por favor", "Ninguna"],
    5: ["Botella", "Mochila", "Cuaderno", "Otro"],
    8: ["Perro", "Gato", "Conejo"],
    9: ["Plástico", "Papel", "Lata", "Orgánico"],
    11: ["Manzana", "Plátano", "Naranja"],
    12: ["Fruta", "Verdura", "Snack", "Otro"],
  };

  useEffect(() => {
    const saved = window.localStorage.getItem(`atenas-tm-model-${groupId}`) ?? "";
    const ignoreStageModel = window.localStorage.getItem(`atenas-tm-ignore-stage-${groupId}`) === "1";
    const fromStage = ignoreStageModel ? "" : extractTeachableUrl(String(prototypeUrl ?? ""));
    const parsed = fromStage || extractTeachableUrl(saved);

    if (parsed) {
      setModelUrl(parsed);
      setModelSource(parsed);
      setShowSetup(false);
      setStatus("Modelo configurado. Puedes usar cámara o importar una imagen.");
    } else {
      setModelUrl("");
      setModelSource("");
      setShowSetup(true);
      setStatus("Configura el modelo pegando el enlace que entrega Teachable Machine.");
    }
  }, [groupId, prototypeUrl]);

  useEffect(() => {
    return () => {
      runningRef.current = false;

      if (predictionTimerRef.current !== null) {
        window.clearTimeout(predictionTimerRef.current);
        predictionTimerRef.current = null;
      }

      try {
        streamRef.current?.getTracks().forEach((track) => track.stop());
      } catch {
        // no-op
      }
      streamRef.current = null;

      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.srcObject = null;
        } catch {
          // no-op
        }
      }

      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function ensureModel(urlOverride?: string) {
    if (modelRef.current) return modelRef.current;

    const parsed = extractTeachableUrl(urlOverride || modelUrl || modelSource);
    if (!parsed) {
      setShowSetup(true);
      throw new Error("Primero pega el enlace o código que entrega Teachable Machine.");
    }

    setBusy(true);
    setStatus("Cargando modelo visual...");

    try {
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

      const model = await tmImage.load(`${parsed}model.json`, `${parsed}metadata.json`);
      modelRef.current = model;
      setModelUrl(parsed);
      window.localStorage.setItem(`atenas-tm-model-${groupId}`, parsed);
      setStatus(`Modelo conectado: ${projectName || theme.fallbackName}.`);
      return model;
    } finally {
      setBusy(false);
    }
  }

  async function saveModel() {
    const parsed = extractTeachableUrl(modelSource);
    if (!parsed) {
      setStatus("No encontré un enlace válido de Teachable Machine dentro del texto pegado.");
      return;
    }

    try {
      modelRef.current = null;
      window.localStorage.removeItem(`atenas-tm-ignore-stage-${groupId}`);
      window.localStorage.setItem(`atenas-tm-model-${groupId}`, parsed);
      setModelUrl(parsed);
      await ensureModel(parsed);
      setShowSetup(false);
      setStatus("✅ Modelo guardado en este navegador y listo para probar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo conectar el modelo.");
    }
  }

  function changeModel() {
    stopCamera();
    modelRef.current = null;
    setPredictions([]);
    setImagePreview("");
    setMode("idle");
    setModelSource(modelUrl || "");
    setShowSetup(true);
    setStatus("Pega un nuevo enlace de Teachable Machine y pulsa Guardar y conectar.");
  }

  function disconnectModel() {
    stopCamera();
    modelRef.current = null;
    window.localStorage.removeItem(`atenas-tm-model-${groupId}`);
    window.localStorage.setItem(`atenas-tm-ignore-stage-${groupId}`, "1");
    setModelUrl("");
    setModelSource("");
    setPredictions([]);
    setImagePreview("");
    setMode("idle");
    setShowSetup(true);
    setStatus("Modelo desconectado. Puedes pegar otro enlace cuando quieras.");
  }

  function stopCamera() {
    runningRef.current = false;

    if (predictionTimerRef.current !== null) {
      window.clearTimeout(predictionTimerRef.current);
      predictionTimerRef.current = null;
    }

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {
      // no-op
    }
    streamRef.current = null;

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {
        // no-op
      }
    }
  }

  async function startCamera() {
    setPredictions([]);
    setImagePreview("");
    stopCamera();

    try {
      const model = await ensureModel();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Este navegador no permite usar la cámara.");
      }

      setStatus("Solicitando permiso para usar la cámara...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      runningRef.current = true;
      setMode("camera");

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      const video = videoRef.current;
      if (!video) {
        stopCamera();
        throw new Error("No se pudo preparar la vista de cámara.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();

      setStatus("✅ Cámara activa. Analizando imagen...");

      const predictLoop = async () => {
        if (!runningRef.current || !videoRef.current) return;

        try {
          if (
            videoRef.current.readyState >= 2 &&
            videoRef.current.videoWidth > 0 &&
            videoRef.current.videoHeight > 0
          ) {
            const result = (await model.predict(videoRef.current)) as Prediction[];
            if (runningRef.current) {
              setPredictions(sortPredictions(result));
            }
          }
        } catch (error) {
          console.error("Error de predicción en cámara:", error);
          if (runningRef.current) {
            setStatus(
              error instanceof Error
                ? `La cámara sigue activa, pero la IA no pudo analizar este cuadro: ${error.message}`
                : "La cámara sigue activa, pero ocurrió un error al analizar la imagen."
            );
          }
        }

        if (runningRef.current) {
          predictionTimerRef.current = window.setTimeout(predictLoop, 300);
        }
      };

      predictionTimerRef.current = window.setTimeout(predictLoop, 250);
    } catch (error) {
      stopCamera();
      setMode("idle");
      setStatus(
        error instanceof Error
          ? `No se pudo iniciar la cámara: ${error.message}`
          : "No se pudo iniciar la cámara."
      );
    }
  }

  async function predictFile(file: File) {
    stopCamera();
    setPredictions([]);
    setMode("image");

    try {
      const model = await ensureModel();
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      const image = new Image();
      image.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
      });

      const result = (await model.predict(image)) as Prediction[];
      setPredictions(sortPredictions(result));
      setStatus("Imagen analizada correctamente.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo analizar la imagen.");
    }
  }

  const top = predictions[0];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <strong style={{ display: "block", fontSize: 20 }}>Reconocimiento visual con IA</strong>
          <span style={{ color: "#64748b", fontSize: 14 }}>
            Modelo entrenado por el grupo · cámara o imagen importada.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSetup((value) => !value)}
          style={{
            ...primaryButton,
            minHeight: 42,
            background: "#f1f5f9",
            color: "#334155",
            boxShadow: "none",
            border: "1px solid #cbd5e1",
          }}
        >
          <Settings size={17} /> Configurar modelo
        </button>
      </div>

      {showSetup && (
        <Panel style={{ background: "rgba(248,250,252,.98)", boxShadow: "none" }}>
          <strong>Pega el enlace o código de Teachable Machine</strong>
          <p style={{ color: "#64748b", fontSize: 13, margin: "6px 0 12px" }}>
            Puedes pegar solo la URL o el bloque de código exportado. Atenas extrae únicamente la URL del modelo; no ejecuta código pegado.
          </p>
          <textarea
            value={modelSource}
            onChange={(event) => setModelSource(event.target.value)}
            rows={4}
            placeholder={'Ej.: const URL = "https://teachablemachine.withgoogle.com/models/ABC123/";'}
            style={{
              width: "100%",
              border: "1px solid #cbd5e1",
              borderRadius: 14,
              padding: 12,
              resize: "vertical",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={saveModel}
              disabled={busy}
              style={{ ...primaryButton, background: theme.accent }}
            >
              <BrainCircuit size={17} /> {busy ? "Conectando..." : "Guardar y conectar"}
            </button>
            {modelUrl && (
              <span style={{ alignSelf: "center", color: "#047857", fontWeight: 800, fontSize: 13 }}>
                ✅ Modelo configurado
              </span>
            )}
          </div>
        </Panel>
      )}

      {modelUrl && !showSetup && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#047857", fontWeight: 900, fontSize: 13 }}>✅ Modelo conectado</span>
          <button
            type="button"
            onClick={changeModel}
            style={{
              border: `1px solid ${theme.accent}45`,
              background: "white",
              color: theme.accent,
              borderRadius: 12,
              padding: "8px 12px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            ⚙️ Cambiar modelo
          </button>
          <button
            type="button"
            onClick={disconnectModel}
            style={{
              border: "1px solid #fecaca",
              background: "#fff7f7",
              color: "#b91c1c",
              borderRadius: 12,
              padding: "8px 12px",
              fontWeight: 850,
              cursor: "pointer",
            }}
          >
            Desconectar modelo
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={startCamera}
          disabled={busy}
          style={{ ...primaryButton, background: theme.accent }}
        >
          <Camera size={18} /> Usar cámara
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          style={{
            ...primaryButton,
            background: "white",
            color: theme.accent,
            border: `1px solid ${theme.accent}55`,
          }}
        >
          <ImagePlus size={18} /> Importar imagen
        </button>
        <input
          ref={fileRef}
          hidden
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) predictFile(file);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <small style={{ color: "#64748b" }}>{status}</small>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            minHeight: 330,
            borderRadius: 24,
            overflow: "hidden",
            background: `linear-gradient(145deg,${theme.accent}25,#0f172a)`,
            display: "grid",
            placeItems: "center",
            color: "white",
            position: "relative",
          }}
        >
          {mode === "camera" && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                minHeight: 330,
                objectFit: "cover",
                background: "#0f172a",
                transform: "scaleX(-1)",
              }}
            />
          )}
          {mode === "image" && imagePreview && (
            <img
              src={imagePreview}
              alt="Imagen importada para clasificación"
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#0f172a" }}
            />
          )}
          {mode === "idle" && (
            <div style={{ textAlign: "center", padding: 28 }}>
              <Upload size={48} style={{ marginBottom: 10, opacity: .9 }} />
              <strong style={{ display: "block", fontSize: 19 }}>Cámara o imagen</strong>
              <span style={{ opacity: .78, fontSize: 13 }}>Selecciona una forma de probar el modelo.</span>
            </div>
          )}
        </div>

        <Panel style={{ boxShadow: "none", border: `1px solid ${theme.accent}25` }}>
          <small style={{ color: theme.accent, fontWeight: 900 }}>RESULTADO DE LA IA</small>
          {top ? (
            <>
              <div style={{ fontSize: 34, fontWeight: 950, marginTop: 8, color: "#111827" }}>
                {top.className}
              </div>
              <div style={{ fontSize: 20, marginTop: 4, color: "#475569" }}>
                Confianza: <strong style={{ color: theme.accent }}>{(top.probability * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ height: 12, borderRadius: 999, background: "#e2e8f0", margin: "14px 0 18px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${top.probability * 100}%`, background: theme.accent }} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {predictions.slice(0, 4).map((prediction) => (
                  <div
                    key={prediction.className}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "9px 10px",
                      borderRadius: 12,
                      background: "#f8fafc",
                    }}
                  >
                    <span>{prediction.className}</span>
                    <strong>{Math.round(prediction.probability * 100)}%</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "#64748b", marginTop: 12 }}>
              Cuando pruebes una foto o la cámara, aquí aparecerá la clase detectada y su confianza.
            </div>
          )}

          <div style={{ marginTop: 18, display: "flex", gap: 7, flexWrap: "wrap" }}>
            {(groupHints[groupId] ?? []).map((item) => (
              <span key={item} style={{ borderRadius: 999, padding: "6px 9px", background: theme.soft, fontSize: 12, fontWeight: 800 }}>
                {item}
              </span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}


function ScafeDemo({ theme }: { theme: Theme }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("Pregunta por el menú, precios, combos u ofertas.");

  const knowledge = [
    ["cafe cafés espresso americano capuccino bebida", "Tenemos espresso, americano y cappuccino. Para la demo, el cappuccino es la recomendación más popular."],
    ["pan panes panaderia croissant medialuna", "Sí. Tenemos pan artesanal y croissant del día."],
    ["cafe pan combo desayuno merienda", "Sí. El combo Café + Pan incluye una bebida caliente y una pieza de panadería."],
    ["precio cuesta costo combo", "En esta demostración el combo Café + Pan tiene un precio referencial de S/ 8.50."],
    ["oferta promocion descuento", "Oferta de demostración: 2 cafés seleccionados por el precio de 1 en horario promocional."],
    ["vegetariano ingredientes alergia", "Puedo consultar opciones e ingredientes registrados. Para alergias reales siempre debe verificarse directamente con la cafetería."],
  ];

  function run(value = query) {
    const text = value.trim();
    if (!text) return;
    setQuery(text);
    const ranked = knowledge
      .map(([keywords, response]) => ({ response, score: similarity(text, keywords) }))
      .sort((a, b) => b.score - a.score);
    setAnswer(
      ranked[0] && ranked[0].score >= .1
        ? ranked[0].response
        : "No encontré una coincidencia clara. Esta pregunta indica qué información podríamos añadir a la base de conocimiento."
    );
  }

  const chips = ["¿Qué cafés tienen?", "¿Hay café con pan?", "¿Qué combos hay?", "¿Tienen ofertas?"];
  const products = [
    { icon: "☕", title: "Café", text: "Espresso, americano y cappuccino", meta: "Más pedido", price: "Desde S/ 4.50", pos: "78% 45%", color: "#7c3aed" },
    { icon: "🥐", title: "Panadería", text: "Pan artesanal y croissants del día", meta: "Recién horneado", price: "Desde S/ 3.50", pos: "88% 44%", color: "#d97706" },
    { icon: "🥪", title: "Combos", text: "Bebida + pan o merienda rápida", meta: "Recomendado", price: "Desde S/ 8.50", pos: "92% 72%", color: "#2563eb" },
    { icon: "✨", title: "Ofertas", text: "Promociones preparadas para la demo", meta: "Horario promo", price: "2 × 1", pos: "64% 22%", color: "#db2777" },
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && run()}
            placeholder="Ej.: ¿Tienen café con pan?"
            style={{ ...fieldStyle, flex: "1 1 420px", minHeight: 56, fontSize: 16 }}
          />
          <button type="button" onClick={() => run()} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, minHeight: 56 }}>
            <Sparkles size={18} /> Consultar
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => run(chip)}
              style={{ border: `1px solid ${theme.accent}20`, borderRadius: 999, padding: "9px 13px", background: "#fff", color: theme.accent, cursor: "pointer", fontWeight: 850, boxShadow: "0 5px 16px rgba(15,23,42,.05)" }}
            >
              {chip}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14, borderRadius: 20, padding: 18, background: `linear-gradient(135deg,${theme.accent}12,${theme.accent2}0e)`, border: `1px solid ${theme.accent}22`, display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start" }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, color: "white", fontSize: 24, boxShadow: `0 12px 28px ${theme.accent}30` }}>🤖</div>
          <div>
            <strong style={{ color: theme.accent, fontSize: 13, letterSpacing: .5 }}>RESPUESTA DEL ASISTENTE</strong>
            <div style={{ marginTop: 5, fontSize: 18, lineHeight: 1.5, color: "#1f2937" }}>{answer}</div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
        {products.map((item) => (
          <div key={item.title} style={{ borderRadius: 24, overflow: "hidden", background: "#fff", border: "1px solid rgba(148,163,184,.16)", boxShadow: "0 16px 42px rgba(15,23,42,.09)", minHeight: 270 }}>
            <div style={{ height: 125, position: "relative", backgroundImage: `linear-gradient(180deg,rgba(15,23,42,.06),rgba(15,23,42,.42)),url(${theme.image})`, backgroundSize: "cover", backgroundPosition: item.pos }}>
              <div style={{ position: "absolute", left: 14, top: 14, width: 46, height: 46, borderRadius: 15, display: "grid", placeItems: "center", background: "rgba(255,255,255,.92)", fontSize: 25, boxShadow: "0 8px 24px rgba(15,23,42,.14)" }}>{item.icon}</div>
              <span style={{ position: "absolute", right: 12, bottom: 12, borderRadius: 999, padding: "6px 10px", background: "rgba(255,255,255,.92)", color: item.color, fontWeight: 900, fontSize: 11 }}>{item.meta}</span>
            </div>
            <div style={{ padding: 17 }}>
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 }}>
                <strong style={{ fontSize: 19, color: "#111827" }}>{item.title}</strong>
                <span style={{ fontSize: 12, fontWeight: 900, color: item.color }}>{item.price}</span>
              </div>
              <p style={{ margin: "8px 0 0", color: "#64748b", lineHeight: 1.45, fontSize: 13 }}>{item.text}</p>
              <div style={{ marginTop: 14, height: 5, borderRadius: 999, background: "#eef2ff", overflow: "hidden" }}><div style={{ width: item.title === "Combos" ? "94%" : item.title === "Café" ? "88%" : "76%", height: "100%", background: `linear-gradient(90deg,${item.color},${theme.accent2})` }} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function MapForgeDemo({ theme }: { theme: Theme }) {
  const [style, setStyle] = useState("aventura");
  const [difficulty, setDifficulty] = useState("media");
  const [players, setPlayers] = useState(3);
  const [result, setResult] = useState("Aventura del Castillo");

  const maps = [
    { name: "Aventura del Castillo", style: "aventura", difficulty: "media", difficultyLabel: "Media", players: 3, icon: "🏰", text: "Explora un castillo, supera retos y descubre zonas secretas.", themeLabel: "Aventura", popularity: "9.6K", pos: "78% 28%", tint: "#7c3aed" },
    { name: "Mundo Creativo", style: "construccion", difficulty: "facil", difficultyLabel: "Fácil", players: 4, icon: "🧱", text: "Construye libremente en equipo y diseña tu propio mundo.", themeLabel: "Construcción", popularity: "12.4K", pos: "48% 70%", tint: "#2563eb" },
    { name: "Islas de Supervivencia", style: "supervivencia", difficulty: "dificil", difficultyLabel: "Difícil", players: 2, icon: "🏝️", text: "Consigue recursos, crea refugios y sobrevive en islas flotantes.", themeLabel: "Supervivencia", popularity: "8.1K", pos: "86% 48%", tint: "#16a34a" },
    { name: "Bosque de Exploración", style: "exploracion", difficulty: "facil", difficultyLabel: "Fácil", players: 2, icon: "🌲", text: "Descubre caminos ocultos, portales y zonas especiales.", themeLabel: "Exploración", popularity: "7.9K", pos: "14% 24%", tint: "#0891b2" },
  ];

  function scoreMap(item: (typeof maps)[number]) {
    return (
      (item.style === style ? 3 : 0) +
      (item.difficulty === difficulty ? 2 : 0) +
      Math.max(0, 2 - Math.abs(item.players - players) * .5)
    );
  }

  function run() {
    const ranked = maps
      .map((item) => ({ ...item, score: scoreMap(item) }))
      .sort((a, b) => b.score - a.score);
    setResult(ranked[0].name);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#f8f7ff)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <label>
            <strong style={{ fontSize: 13 }}>Estilo de juego</strong>
            <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }}>
              <option value="aventura">⚔️ Aventura</option>
              <option value="construccion">🧱 Construcción</option>
              <option value="supervivencia">🛡️ Supervivencia</option>
              <option value="exploracion">🧭 Exploración</option>
            </select>
          </label>
          <label>
            <strong style={{ fontSize: 13 }}>Dificultad</strong>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }}>
              <option value="facil">Fácil</option>
              <option value="media">Media</option>
              <option value="dificil">Difícil</option>
            </select>
          </label>
          <label>
            <strong style={{ fontSize: 13 }}>Jugadores</strong>
            <input type="number" min={1} max={8} value={players} onChange={(e) => setPlayers(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 6 }} />
          </label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
          <div style={{ color: "#64748b", fontSize: 13 }}>La IA compara estilo, dificultad y número de jugadores para ordenar las opciones.</div>
          <button type="button" onClick={run} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})` }}>
            <BrainCircuit size={18} /> Recomendar mapa
          </button>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {maps.map((map) => {
          const selected = result === map.name;
          const score = scoreMap(map);
          const match = Math.min(99, Math.max(54, Math.round((score / 7) * 100)));
          return (
            <div
              key={map.name}
              style={{
                borderRadius: 25,
                overflow: "hidden",
                background: "#fff",
                border: selected ? `2px solid ${theme.accent}88` : "1px solid rgba(148,163,184,.16)",
                boxShadow: selected ? `0 24px 60px ${theme.accent}25` : "0 16px 40px rgba(15,23,42,.08)",
                transform: selected ? "translateY(-3px)" : "none",
                transition: "all .22s ease",
              }}
            >
              <div style={{ height: 160, position: "relative", backgroundImage: `linear-gradient(180deg,rgba(15,23,42,.02),rgba(15,23,42,.62)),url(${theme.image})`, backgroundSize: "cover", backgroundPosition: map.pos }}>
                <div style={{ position: "absolute", inset: "auto 14px 13px 14px", display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 9px", background: "rgba(15,23,42,.62)", color: "white", fontSize: 11, fontWeight: 850, backdropFilter: "blur(8px)" }}>{map.icon} {map.themeLabel}</span>
                  </div>
                  {selected && <span style={{ borderRadius: 999, padding: "7px 10px", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "white", fontSize: 11, fontWeight: 950, boxShadow: "0 8px 22px rgba(249,115,22,.28)" }}>✨ TOP IA</span>}
                </div>
              </div>
              <div style={{ padding: 17 }}>
                <strong style={{ display: "block", fontSize: 20, color: "#111827", letterSpacing: -.25 }}>{map.name}</strong>
                <p style={{ margin: "7px 0 13px", color: "#64748b", fontSize: 13, lineHeight: 1.45, minHeight: 38 }}>{map.text}</p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ borderRadius: 999, padding: "6px 9px", background: `${map.tint}12`, color: map.tint, fontWeight: 850, fontSize: 11 }}>🎯 {map.difficultyLabel}</span>
                  <span style={{ borderRadius: 999, padding: "6px 9px", background: "#f1f5f9", color: "#475569", fontWeight: 850, fontSize: 11 }}>👥 {map.players} jugadores</span>
                  <span style={{ borderRadius: 999, padding: "6px 9px", background: "#fff7ed", color: "#c2410c", fontWeight: 850, fontSize: 11 }}>🔥 {map.popularity}</span>
                </div>
                <div style={{ marginTop: 15, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: "#eef2ff", overflow: "hidden" }}><div style={{ width: `${match}%`, height: "100%", background: `linear-gradient(90deg,${map.tint},${theme.accent})` }} /></div>
                  <strong style={{ minWidth: 45, textAlign: "right", color: selected ? theme.accent : "#475569", fontSize: 12 }}>{match}%</strong>
                </div>
                <div style={{ marginTop: 7, fontSize: 11, color: selected ? theme.accent : "#94a3b8", fontWeight: selected ? 900 : 700 }}>{selected ? "Recomendación principal según tus preferencias" : "Coincidencia estimada con la búsqueda"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const safeScenarios = {
  school: { name: "Salida del colegio", hour: 18, light: 2, people: 2, incidents: 1 },
  park: { name: "Parque de noche", hour: 21, light: 0, people: 0, incidents: 4 },
  avenue: { name: "Avenida iluminada", hour: 17, light: 2, people: 2, incidents: 0 },
  residential: { name: "Calle residencial", hour: 20, light: 1, people: 1, incidents: 2 },
};

function SafeWalkDemo({ theme }: { theme: Theme }) {
  const [scenario, setScenario] = useState<keyof typeof safeScenarios>("school");
  const [hour, setHour] = useState(18);
  const [light, setLight] = useState(2);
  const [people, setPeople] = useState(2);
  const [incidents, setIncidents] = useState(1);
  const [result, setResult] = useState({ label: "Riesgo bajo", color: "#16a34a", confidence: 88, note: "Ruta recomendada para la simulación." });
  const [locationQuery, setLocationQuery] = useState("Atenas SV, Los Olivos, Lima");
  const [mapQuery, setMapQuery] = useState("Atenas SV, Los Olivos, Lima");
  const [geoStatus, setGeoStatus] = useState("");
  const [customMap, setCustomMap] = useState("");
  const [showMapSetup, setShowMapSetup] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("atenas-safewalk-map") ?? "";
    if (saved) setCustomMap(saved);
  }, []);

  const samples: Sample[] = [
    { x: [.60, 1, 1, .05], label: "bajo" },
    { x: [.72, 1, .8, .1], label: "bajo" },
    { x: [.82, .5, .5, .4], label: "medio" },
    { x: [.90, 0, 0, .8], label: "alto" },
    { x: [.96, 0, .2, 1], label: "alto" },
    { x: [.35, .5, .2, .6], label: "medio" },
  ];

  function chooseScenario(value: keyof typeof safeScenarios) {
    setScenario(value);
    const next = safeScenarios[value];
    setHour(next.hour);
    setLight(next.light);
    setPeople(next.people);
    setIncidents(next.incidents);
  }

  function run() {
    const label = knnPredict([hour / 24, light / 2, people / 2, incidents / 5], samples, 3);
    const score = Math.min(100, Math.round((hour >= 20 ? 22 : 7) + (2 - light) * 18 + (2 - people) * 13 + incidents * 10));
    if (label === "alto") {
      setResult({ label: "Riesgo alto", color: "#dc2626", confidence: Math.max(82, score), note: "La simulación recomienda evitar esta opción y elegir una ruta alternativa." });
    } else if (label === "medio") {
      setResult({ label: "Precaución", color: "#d97706", confidence: Math.max(76, score), note: "La simulación detecta factores de riesgo moderado. Conviene usar una ruta más visible." });
    } else {
      setResult({ label: "Riesgo bajo", color: "#16a34a", confidence: Math.max(82, 100 - score / 2), note: "Dentro de los datos simulados, esta es la alternativa recomendada." });
    }
  }

  function searchLocation() {
    const next = locationQuery.trim();
    if (next) setMapQuery(next);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("Este navegador no ofrece geolocalización.");
      return;
    }
    setGeoStatus("Buscando ubicación...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude},${position.coords.longitude}`;
        setLocationQuery(coords);
        setMapQuery(coords);
        setGeoStatus("Ubicación cargada en el mapa.");
      },
      () => setGeoStatus("No se pudo obtener la ubicación. Revisa el permiso del navegador."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function extractMapSrc(value: string) {
    const text = value.trim();
    const iframe = text.match(/src=["']([^"']+)["']/i)?.[1];
    const candidate = iframe || text;
    return candidate.startsWith("https://www.google.com/maps") || candidate.startsWith("https://www.google.com/maps/d/")
      ? candidate
      : "";
  }

  function saveCustomMap() {
    const src = extractMapSrc(customMap);
    if (!src) {
      setGeoStatus("Pega una URL o iframe válido de Google Maps / My Maps.");
      return;
    }
    setCustomMap(src);
    window.localStorage.setItem("atenas-safewalk-map", src);
    setShowMapSetup(false);
    setGeoStatus("Mapa personalizado guardado.");
  }

  const standardMap = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;
  const mapSrc = customMap && extractMapSrc(customMap) ? extractMapSrc(customMap) : standardMap;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "rgba(255,255,255,.94)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(230px,1.4fr) auto auto", gap: 10, alignItems: "end" }}>
          <label>
            <strong style={{ fontSize: 13 }}>Ubicación para mostrar en Google Maps</strong>
            <input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchLocation()} style={{ ...fieldStyle, marginTop: 6 }} placeholder="Ej. Atenas SV, Los Olivos, Lima" />
          </label>
          <button type="button" onClick={searchLocation} style={{ ...primaryButton, background: theme.accent }}>📍 Mostrar mapa</button>
          <button type="button" onClick={useMyLocation} style={{ ...primaryButton, background: "white", color: theme.accent, border: `1px solid ${theme.accent}55` }}>◎ Mi ubicación</button>
        </div>
        {geoStatus && <small style={{ display: "block", marginTop: 8, color: "#64748b" }}>{geoStatus}</small>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" onClick={() => setShowMapSetup((v) => !v)} style={{ border: 0, background: "transparent", color: theme.accent, fontWeight: 800, cursor: "pointer" }}>⚙️ Usar un Google My Maps personalizado</button>
        </div>
        {showMapSetup && (
          <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: "#f8fafc" }}>
            <small style={{ color: "#64748b" }}>Opcional: pega la URL o el iframe que Google My Maps te da en “Insertar en mi sitio”.</small>
            <textarea value={customMap} onChange={(e) => setCustomMap(e.target.value)} rows={3} style={{ width: "100%", marginTop: 8, border: "1px solid #cbd5e1", borderRadius: 12, padding: 10 }} placeholder={'<iframe src="https://www.google.com/maps/d/embed?mid=..."></iframe>'} />
            <button type="button" onClick={saveCustomMap} style={{ ...primaryButton, background: theme.accent, marginTop: 8 }}>Guardar mapa</button>
          </div>
        )}
      </Panel>

      <Panel style={{ background: "rgba(255,255,255,.94)" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ flex: "1 1 230px" }}>
            <strong style={{ fontSize: 13 }}>Escenario de demostración</strong>
            <select value={scenario} onChange={(e) => chooseScenario(e.target.value as keyof typeof safeScenarios)} style={{ ...fieldStyle, marginTop: 6 }}>
              {Object.entries(safeScenarios).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent }}><BrainCircuit size={18} /> Analizar situación</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 14 }}>
          <NumberBox label="Hora" value={hour} min={0} max={23} onChange={setHour} />
          <SelectBox label="Iluminación" value={light} onChange={setLight} options={[[0,"Baja"],[1,"Media"],[2,"Alta"]]} />
          <SelectBox label="Personas" value={people} onChange={setPeople} options={[[0,"Pocas"],[1,"Algunas"],[2,"Muchas"]]} />
          <NumberBox label="Incidentes" value={incidents} min={0} max={5} onChange={setIncidents} />
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(260px,.65fr)", gap: 16 }}>
        <Panel style={{ padding: 10, overflow: "hidden", background: "rgba(255,255,255,.96)" }}>
          <iframe
            title="Mapa SafeWalk"
            src={mapSrc}
            width="100%"
            height="430"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0, borderRadius: 18, display: "block" }}
          />
        </Panel>
        <Panel style={{ background: "rgba(255,255,255,.96)" }}>
          <small style={{ color: result.color, fontWeight: 900 }}>SIMULACIÓN EDUCATIVA</small>
          <div style={{ fontSize: 32, fontWeight: 950, color: result.color, marginTop: 7 }}>{result.label}</div>
          <div style={{ marginTop: 8, color: "#475569" }}>Confianza simulada: <strong>{Math.round(result.confidence)}%</strong></div>
          <p style={{ color: "#475569", lineHeight: 1.5 }}>{result.note}</p>
          <div style={{ borderRadius: 14, padding: 12, background: "#f8fafc", fontSize: 12, color: "#64748b" }}>
            El mapa es real; la clasificación de riesgo es una simulación educativa preparada para explicar cómo trabajaría la IA. No representa seguridad real.
          </div>
        </Panel>
      </div>
    </div>
  );
}


function StudyQuestDemo({ theme }: { theme: Theme }) {
  const [tasks, setTasks] = useState("Estudiar Matemáticas 1 hora, hacer la tarea de Historia, repasar Ciencias, entregar el proyecto a las 6:00 p. m.");
  const [plan, setPlan] = useState<string[]>([]);

  function run() {
    const parts = tasks.split(/[,;\n]+/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
    const times = ["08:00", "09:15", "10:30", "12:00", "16:00", "18:00"];
    setPlan(parts.map((item, index) => `${times[index] ?? `${8 + index}:00`} · ${item}`));
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#faf8ff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: 15, display: "grid", placeItems: "center", background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, color: "white", fontSize: 22 }}>🧠</div>
          <div><strong style={{ fontSize: 19 }}>Organizador inteligente</strong><div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Escribe las tareas y la IA las convierte en una agenda visual.</div></div>
        </div>
        <textarea value={tasks} onChange={(e) => setTasks(e.target.value)} rows={4} style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, marginTop: 4, fontSize: 15, resize: "vertical", background: "#fff" }} />
        <button type="button" onClick={run} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, marginTop: 12 }}>
          <BrainCircuit size={18} /> Organizar con IA
        </button>
      </Panel>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #eef2f7", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div><strong style={{ fontSize: 21 }}>🗓️ Agenda sugerida</strong><div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>Ordenada por bloques para una demostración rápida.</div></div>
          <span style={{ borderRadius: 999, padding: "7px 10px", background: theme.soft, color: theme.accent, fontWeight: 900, fontSize: 11 }}>{plan.length || 0} bloques</span>
        </div>
        {plan.length === 0 ? (
          <div style={{ padding: 24, color: "#64748b" }}>Pulsa “Organizar con IA” para crear una demostración de horario.</div>
        ) : (
          <div style={{ padding: 18, display: "grid", gap: 10 }}>
            {plan.map((item, index) => {
              const [time, ...rest] = item.split(" · ");
              const priority = index < 2 ? "Alta" : index < 4 ? "Media" : "Normal";
              const color = index < 2 ? "#dc2626" : index < 4 ? "#d97706" : "#2563eb";
              return (
                <div key={`${item}-${index}`} style={{ display: "grid", gridTemplateColumns: "86px 1fr auto", gap: 13, alignItems: "center", padding: 14, borderRadius: 18, background: index % 2 ? "#f8fafc" : "#fff", border: "1px solid #eef2f7" }}>
                  <div style={{ borderRadius: 14, padding: "10px 8px", textAlign: "center", background: `linear-gradient(135deg,${theme.accent}14,${theme.accent2}12)`, color: theme.accent, fontWeight: 950, fontSize: 15 }}>{time}</div>
                  <div><strong style={{ display: "block", color: "#111827", lineHeight: 1.35 }}>{rest.join(" · ")}</strong><span style={{ color: "#94a3b8", fontSize: 11 }}>Bloque {index + 1} · planificación sugerida</span></div>
                  <span style={{ borderRadius: 999, padding: "6px 9px", background: `${color}12`, color, fontSize: 10, fontWeight: 950 }}>{priority}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}


function SeniorCareDemo({ theme }: { theme: Theme }) {
  const [time, setTime] = useState("08:00");
  const [reminder, setReminder] = useState("Tomar el medicamento indicado");
  const [result, setResult] = useState("");

  function run() {
    setResult(`Recordatorio programado para las ${time}: ${reminder}.`);
  }

  const cards = [
    { icon: "💊", label: "Medicamento", value: `${time}`, note: reminder, color: "#0f766e" },
    { icon: "❤️", label: "Bienestar", value: "Rutina", note: "Registrar pulso o actividad como demostración", color: "#e11d48" },
    { icon: "💧", label: "Hidratación", value: "Cada 2 h", note: "Recordatorio de agua configurado como ejemplo", color: "#0284c7" },
  ];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#fff8fb)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,.5fr) minmax(240px,1.4fr) auto", gap: 12, alignItems: "end" }}>
          <label><strong style={{ fontSize: 13 }}>Hora</strong><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <label><strong style={{ fontSize: 13 }}>Recordatorio</strong><input value={reminder} onChange={(e) => setReminder(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <button type="button" onClick={run} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})` }}><Sparkles size={18} /> Crear recordatorio</button>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
        {cards.map((card) => (
          <div key={card.label} style={{ borderRadius: 22, padding: 17, background: "#fff", border: "1px solid rgba(148,163,184,.16)", boxShadow: "0 14px 36px rgba(15,23,42,.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: `${card.color}12`, fontSize: 23 }}>{card.icon}</div>
              <div><small style={{ color: "#64748b", fontWeight: 800 }}>{card.label}</small><strong style={{ display: "block", fontSize: 19, color: card.color, marginTop: 2 }}>{card.value}</strong></div>
            </div>
            <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.45, minHeight: 38 }}>{card.note}</p>
            <div style={{ height: 6, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}><div style={{ height: "100%", width: card.label === "Medicamento" ? "92%" : "74%", background: `linear-gradient(90deg,${card.color},${theme.accent})` }} /></div>
          </div>
        ))}
      </div>

      <Panel style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 14, alignItems: "start", background: `linear-gradient(135deg,${theme.accent}0d,#ffffff)` }}>
        <div style={{ width: 54, height: 54, borderRadius: 18, display: "grid", placeItems: "center", background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, color: "white", fontSize: 25 }}>💜</div>
        <div>
          <small style={{ color: theme.accent, fontWeight: 950, letterSpacing: .5 }}>RESULTADO DEL ASISTENTE</small>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "#1f2937" }}>{result || "Configura un recordatorio y pulsa Crear recordatorio."}</div>
          <div style={{ marginTop: 10, borderRadius: 14, padding: 11, background: "#fff7ed", fontSize: 12, color: "#9a3412" }}>Prototipo educativo: organiza recordatorios. No diagnostica ni decide tratamientos o dosis.</div>
        </div>
      </Panel>
    </div>
  );
}


function MiniGameDemo({ theme }: { theme: Theme }) {
  const [position, setPosition] = useState(14);
  const [health, setHealth] = useState(82);
  const [energy, setEnergy] = useState(76);
  const [coins, setCoins] = useState(0);
  const enemyPosition = 72;
  const coinPositions = [32, 51, 88];

  const distanceToEnemy = Math.abs(enemyPosition - position);
  const suggestion = health < 35
    ? "🏃 Retroceder y recuperar vida"
    : distanceToEnemy < 18 && energy > 40
    ? "⚔️ Atacar al enemigo"
    : energy < 30
    ? "💤 Descansar y recuperar energía"
    : "➡️ Avanzar y recoger monedas";

  function move(delta: number) {
    setPosition((value) => Math.max(4, Math.min(94, value + delta)));
    setEnergy((value) => Math.max(0, value - 4));
  }

  function collect() {
    const nearCoin = coinPositions.some((coin) => Math.abs(coin - position) < 8);
    if (nearCoin) setCoins((value) => value + 1);
  }

  function attack() {
    if (distanceToEnemy < 20) {
      setEnergy((value) => Math.max(0, value - 12));
      setCoins((value) => value + 1);
    } else {
      setEnergy((value) => Math.max(0, value - 5));
    }
  }

  function rest() {
    setEnergy((value) => Math.min(100, value + 20));
    setHealth((value) => Math.min(100, value + 8));
  }

  function reset() {
    setPosition(14);
    setHealth(82);
    setEnergy(76);
    setCoins(0);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ borderRadius: 26, overflow: "hidden", position: "relative", minHeight: 350, backgroundImage: `linear-gradient(180deg,rgba(15,23,42,.05),rgba(15,23,42,.58)),url(${theme.image})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 22px 58px rgba(15,23,42,.18)" }}>
        <div style={{ position: "absolute", left: 18, right: 18, top: 18, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(15,23,42,.72)", color: "white", fontWeight: 900, fontSize: 11 }}>❤️ VIDA {health}%</span>
            <span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(15,23,42,.72)", color: "white", fontWeight: 900, fontSize: 11 }}>⚡ ENERGÍA {energy}%</span>
            <span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(15,23,42,.72)", color: "white", fontWeight: 900, fontSize: 11 }}>🪙 {coins}</span>
          </div>
          <span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(255,255,255,.9)", color: theme.accent, fontWeight: 950, fontSize: 11 }}>🏰 META</span>
        </div>
        <div style={{ position: "absolute", left: `${position}%`, bottom: 58, width: 54, height: 54, borderRadius: 18, display: "grid", placeItems: "center", background: "rgba(255,255,255,.92)", boxShadow: "0 15px 30px rgba(15,23,42,.28)", fontSize: 31, transform: "translateX(-50%)", transition: "left .2s ease" }}>🧙</div>
        <div style={{ position: "absolute", left: `${enemyPosition}%`, bottom: 62, width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: "rgba(127,29,29,.88)", boxShadow: "0 12px 26px rgba(127,29,29,.32)", fontSize: 27, transform: "translateX(-50%)" }}>👾</div>
        {coinPositions.map((coin) => <div key={coin} style={{ position: "absolute", left: `${coin}%`, bottom: 66, fontSize: 24, transform: "translateX(-50%)", filter: "drop-shadow(0 6px 6px rgba(15,23,42,.25))" }}>🪙</div>)}
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, height: 16, borderRadius: 999, background: "rgba(255,255,255,.22)", backdropFilter: "blur(6px)", overflow: "hidden" }}><div style={{ width: `${position}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg,${theme.accent},${theme.accent2})`, transition: "width .2s ease" }} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,.7fr)", gap: 14 }}>
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <Stat label="Vida" value={health} color="#e11d48" />
            <Stat label="Energía" value={energy} color="#f59e0b" />
            <Stat label="Monedas" value={Math.min(100, coins * 25)} color="#7c3aed" text={String(coins)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <GameButton onClick={() => move(-10)}>⬅️ Atrás</GameButton>
            <GameButton onClick={() => move(10)}>➡️ Avanzar</GameButton>
            <GameButton onClick={collect}>🪙 Recoger</GameButton>
            <GameButton onClick={attack}>⚔️ Atacar</GameButton>
            <GameButton onClick={rest}>💤 Descansar</GameButton>
            <GameButton onClick={reset}><RotateCcw size={15} /> Reiniciar</GameButton>
          </div>
        </Panel>

        <Panel style={{ background: `linear-gradient(135deg,${theme.accent}10,#ffffff)` }}>
          <small style={{ color: theme.accent, fontWeight: 950, letterSpacing: .5 }}>RECOMENDACIÓN DE LA IA</small>
          <div style={{ fontSize: 23, fontWeight: 950, marginTop: 8, lineHeight: 1.2 }}>{suggestion}</div>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>La recomendación cambia según vida, energía y distancia al enemigo. El estudiante juega y ve cómo cambia la decisión.</p>
          <div style={{ borderRadius: 15, padding: 11, background: "#f8fafc", fontSize: 11, color: "#475569" }}>Distancia al enemigo: <strong>{Math.round(distanceToEnemy)}%</strong> · Posición: <strong>{position}%</strong></div>
        </Panel>
      </div>
    </div>
  );
}


function GenericDemo({ projectName, theme }: { projectName?: string | null; theme: Theme }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  function run() {
    const useful = normalizeWords(text);
    if (!useful.length) return;
    setResult(`La demostración detectó ${useful.length} palabras útiles y clasificó la entrada como ${useful.length > 8 ? "detallada" : useful.length > 4 ? "media" : "breve"}.`);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#f8f7ff)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: 17, display: "grid", placeItems: "center", background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, color: "white" }}><BrainCircuit size={24} /></div>
          <div><strong style={{ fontSize: 20 }}>{projectName || theme.fallbackName}</strong><div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>Demostración del flujo entrada → análisis → resultado.</div></div>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Escribe una entrada para analizar..." style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, marginTop: 14, fontSize: 15, background: "#fff" }} />
        <button type="button" onClick={run} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, marginTop: 12 }}><BrainCircuit size={18} /> Analizar</button>
      </Panel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        {[
          ["1", "Entrada", text ? "Información ingresada" : "Esperando información"],
          ["2", "Análisis", result ? "Procesamiento completado" : "Preparado para analizar"],
          ["3", "Resultado", result || "Aquí aparecerá la salida de la demostración"],
        ].map(([n,t,d]) => (
          <div key={t} style={{ borderRadius: 20, padding: 16, background: "#fff", border: "1px solid #eef2f7", boxShadow: "0 12px 30px rgba(15,23,42,.06)" }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, display: "grid", placeItems: "center", background: theme.soft, color: theme.accent, fontWeight: 950 }}>{n}</span>
            <strong style={{ display: "block", marginTop: 10 }}>{t}</strong>
            <span style={{ display: "block", marginTop: 5, color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberBox({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label><strong style={{ fontSize: 12 }}>{label}</strong><input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ ...fieldStyle, minHeight: 42, marginTop: 5 }} /></label>;
}

function SelectBox({ label, value, options, onChange }: { label: string; value: number; options: [number,string][]; onChange: (value: number) => void }) {
  return <label><strong style={{ fontSize: 12 }}>{label}</strong><select value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ ...fieldStyle, minHeight: 42, marginTop: 5 }}>{options.map(([v,t]) => <option key={v} value={v}>{t}</option>)}</select></label>;
}

function Stat({ label, value, color, text }: { label: string; value: number; color: string; text?: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, fontWeight: 800 }}><span>{label}</span><span>{text ?? `${value}%`}</span></div>
      <div style={{ height: 9, background: "#e2e8f0", borderRadius: 999, overflow: "hidden", marginTop: 6 }}><div style={{ height: "100%", width: `${Math.max(0,Math.min(100,value))}%`, background: color }} /></div>
    </div>
  );
}

function GameButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} style={{ border: "1px solid #cbd5e1", borderRadius: 12, background: "white", padding: "9px 11px", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>{children}</button>;
}

function Experience({ groupId, projectName, prototypeUrl, theme }: Props & { theme: Theme }) {
  if (VISION_GROUPS.has(groupId)) return <VisionDemo groupId={groupId} projectName={projectName} prototypeUrl={prototypeUrl} theme={theme} />;
  if (groupId === 1) return <ScafeDemo theme={theme} />;
  if (groupId === 2) return <MapForgeDemo theme={theme} />;
  if (groupId === 3) return <SafeWalkDemo theme={theme} />;
  if (groupId === 6) return <StudyQuestDemo theme={theme} />;
  if (groupId === 7) return <SeniorCareDemo theme={theme} />;
  if (groupId === 10) return <MiniGameDemo theme={theme} />;
  return <GenericDemo projectName={projectName} theme={theme} />;
}

export function AiPrototypeLab({ groupId, projectName, prototypeUrl }: Props) {
  const theme = THEMES[groupId] ?? {
    fallbackName: `Grupo ${groupId}`,
    tagline: "Proyecto de Inteligencia Artificial",
    emoji: "🤖",
    accent: "#6d28d9",
    accent2: "#2563eb",
    soft: "#f5f3ff",
    background: "linear-gradient(135deg,#312e81,#6d28d9,#2563eb)",
    image: "/demo-themes/generic.png",
    decorations: ["🤖", "✨", "🧠", "⚙️"],
  };

  const [open, setOpen] = useState(false);
  const displayName = projectName?.trim() || theme.fallbackName;
  const heroRight = [4, 8, 11, 12].includes(groupId);
  const uiFont = 'Inter, Aptos, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);

  async function browserFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch {
      // La superposición ya ocupa toda la ventana aunque el navegador no permita fullscreen.
    }
  }

  return (
    <>
      <section
        style={{
          margin: "22px 0",
          borderRadius: 28,
          overflow: "hidden",
          background: "#ffffff",
          border: "1px solid rgba(148,163,184,.18)",
          boxShadow: "0 20px 55px rgba(15,23,42,.10)",
          fontFamily: uiFont,
        }}
      >
        <div
          style={{
            minHeight: 238,
            position: "relative",
            display: "grid",
            gridTemplateColumns: "minmax(0,1.05fr) minmax(280px,.95fr)",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              padding: "34px clamp(24px,4vw,48px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
              position: "relative",
              zIndex: 2,
              background: "linear-gradient(100deg,#ffffff 0%,rgba(255,255,255,.98) 78%,rgba(255,255,255,.76) 100%)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: theme.accent, fontWeight: 900, fontSize: 13, letterSpacing: .8 }}>
              <BrainCircuit size={18} /> LABORATORIO IA · DEMO EN VIVO
            </div>
            <h2 style={{ margin: 0, color: "#111827", fontSize: "clamp(28px,3vw,42px)", letterSpacing: -1.2, lineHeight: 1.04 }}>
              {displayName}
            </h2>
            <p style={{ margin: 0, color: "#475569", fontSize: 17, fontWeight: 750 }}>{theme.tagline}</p>
            <p style={{ margin: "2px 0 12px", color: "#64748b", lineHeight: 1.6, maxWidth: 650 }}>
              Abre una interfaz de exposición preparada para demostrar entrada → IA → resultado de forma clara y visual.
            </p>
            <div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                style={{
                  ...primaryButton,
                  minHeight: 55,
                  borderRadius: 16,
                  padding: "0 24px",
                  background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`,
                  boxShadow: `0 15px 30px ${theme.accent}33`,
                  fontFamily: uiFont,
                }}
              >
                <Sparkles size={20} /> Probar mi proyecto IA <ChevronRight size={19} />
              </button>
            </div>
          </div>

          <div style={{ minHeight: 238, position: "relative", overflow: "hidden", background: theme.soft }}>
            <img
              src={theme.image}
              alt=""
              aria-hidden="true"
              style={{ width: "100%", height: "100%", position: "absolute", inset: 0, objectFit: "cover", objectPosition: "center", filter: "saturate(1.03) contrast(1.02)" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(255,255,255,.42),transparent 38%)" }} />
            <div style={{ position: "absolute", right: 18, bottom: 16, background: "rgba(255,255,255,.90)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.65)", borderRadius: 999, padding: "9px 14px", color: theme.accent, fontWeight: 900, boxShadow: "0 8px 24px rgba(15,23,42,.12)" }}>
              Grupo {groupId}
            </div>
          </div>
        </div>
      </section>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            overflow: "auto",
            background: "#f4f6fb",
            color: "#172033",
            fontFamily: uiFont,
          }}
        >
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              height: 68,
              padding: "0 clamp(16px,3vw,34px)",
              background: "rgba(255,255,255,.96)",
              borderBottom: "1px solid rgba(226,232,240,.9)",
              backdropFilter: "blur(18px)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", color: "white", background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, boxShadow: `0 8px 22px ${theme.accent}2d` }}>
                <BrainCircuit size={23} />
              </div>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: "block", color: "#111827", fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Atenas IA Lab</strong>
                <small style={{ color: "#64748b" }}>Grupo {groupId} · Demo de exposición</small>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={browserFullscreen} style={{ border: "1px solid #dbe2ea", borderRadius: 13, background: "white", width: 44, height: 44, display: "grid", placeItems: "center", cursor: "pointer", color: "#334155" }} aria-label="Pantalla completa"><Maximize2 size={18} /></button>
              <button type="button" onClick={() => setOpen(false)} style={{ border: 0, borderRadius: 13, background: "#111827", color: "white", width: 44, height: 44, display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="Cerrar"><X size={20} /></button>
            </div>
          </header>

          <section
            style={{
              minHeight: "clamp(300px,38vw,500px)",
              position: "relative",
              overflow: "hidden",
              background: theme.soft,
            }}
          >
            <img
              src={theme.image}
              alt=""
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "saturate(1.03) contrast(1.02)" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: heroRight
                  ? "linear-gradient(270deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.92) 34%,rgba(255,255,255,.25) 67%,rgba(255,255,255,0) 100%)"
                  : "linear-gradient(90deg,rgba(255,255,255,.98) 0%,rgba(255,255,255,.92) 34%,rgba(255,255,255,.25) 67%,rgba(255,255,255,0) 100%)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                maxWidth: 1380,
                margin: "0 auto",
                minHeight: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: heroRight ? "flex-end" : "flex-start",
                padding: "clamp(28px,5vw,70px) clamp(22px,5vw,72px)",
              }}
            >
              <div style={{ width: "min(590px,100%)", textAlign: heroRight ? "right" : "left" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 13px", background: `${theme.accent}12`, color: theme.accent, fontSize: 12, fontWeight: 900, letterSpacing: .7, marginBottom: 14 }}>
                  <Sparkles size={15} /> PROYECTO DE INTELIGENCIA ARTIFICIAL
                </div>
                <h1 style={{ margin: 0, color: "#0f172a", fontSize: "clamp(40px,5.4vw,74px)", letterSpacing: -2.2, lineHeight: .98, fontWeight: 900 }}>
                  {displayName}
                </h1>
                <div style={{ marginTop: 14, color: theme.accent, fontSize: "clamp(19px,2.2vw,29px)", fontWeight: 850, letterSpacing: -.4 }}>{theme.tagline}</div>
                <p style={{ margin: heroRight ? "14px 0 0 auto" : "14px 0 0", maxWidth: 560, color: "#475569", fontSize: 16, lineHeight: 1.65 }}>
                  Demostración sencilla para explicar qué información entra, cómo la procesa el modelo y qué resultado produce la IA.
                </p>
              </div>
            </div>
          </section>

          <main style={{ position: "relative", zIndex: 2, maxWidth: 1380, margin: "0 auto", padding: "clamp(26px,4vw,48px) clamp(16px,3vw,34px) 64px" }}>
            <div
              style={{
                background: "rgba(255,255,255,.82)",
                border: "1px solid rgba(226,232,240,.92)",
                borderRadius: 30,
                padding: "clamp(14px,2vw,24px)",
                boxShadow: "0 24px 70px rgba(15,23,42,.10)",
                backdropFilter: "blur(16px)",
              }}
            >
              <Experience groupId={groupId} projectName={projectName} prototypeUrl={prototypeUrl} theme={theme} />
            </div>
          </main>
        </div>
      )}
    </>
  );
}
