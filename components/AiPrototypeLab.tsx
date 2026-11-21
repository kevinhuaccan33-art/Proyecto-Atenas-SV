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
import { getSupabase } from "@/lib/supabase-browser";

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


type AiClientStatus = {
  enabled: boolean;
  globalEnabled?: boolean;
  groupEnabled?: boolean;
  dailyLimit: number;
  used: number;
  remaining: number;
  cooldownSeconds: number;
  retryAfter: number;
};

function useAtenasAI(groupId: number) {
  const [status, setStatus] = useState<AiClientStatus>({
    enabled: false,
    dailyLimit: 10,
    used: 0,
    remaining: 10,
    cooldownSeconds: 8,
    retryAfter: 0,
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("Cargando límite diario...");
  const [retryAfter, setRetryAfter] = useState(0);

  async function authToken() {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function refresh() {
    try {
      const token = await authToken();
      if (!token) throw new Error("Sesión no disponible.");
      const response = await fetch(`/api/ai?groupId=${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo consultar el límite diario.");
      const next = data.status as AiClientStatus;
      setStatus(next);
      setRetryAfter(Number(next.retryAfter ?? 0));
      if (!next.globalEnabled) setNotice("La inteligencia artificial está desactivada por el profesor.");
      else if (!next.groupEnabled) setNotice("La inteligencia artificial está desactivada para este proyecto.");
      else if (next.remaining <= 0) setNotice("Se alcanzó el límite diario de uso.");
      else setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo consultar el estado.");
    }
  }

  useEffect(() => {
    refresh();
  }, [groupId]);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => {
      setRetryAfter((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter > 0]);

  async function ask(message: string, context: Record<string, unknown> = {}) {
    if (busy) return null;
    if (retryAfter > 0) {
      setNotice(`Espera ${retryAfter} s antes de volver a consultar.`);
      return null;
    }

    setBusy(true);
    setNotice("");
    try {
      const token = await authToken();
      if (!token) throw new Error("Sesión no disponible.");
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId, message, context }),
      });
      const data = await response.json();

      if (data.status) {
        setStatus((current) => ({ ...current, ...data.status }));
        setRetryAfter(Number(data.status.retryAfter ?? 0));
      }

      if (!response.ok) {
        throw new Error(data.error || "No se pudo realizar la consulta.");
      }

      setNotice("");
      return String(data.text ?? "");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo realizar la consulta.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const canUse =
    status.enabled &&
    status.remaining > 0 &&
    retryAfter <= 0 &&
    !busy;

  return { status, busy, notice, retryAfter, canUse, ask, refresh };
}

function AiUseBar({
  ai,
  accent,
}: {
  ai: ReturnType<typeof useAtenasAI>;
  accent: string;
}) {
  const { status, busy, notice, retryAfter } = ai;
  const limit = Math.max(0, status.dailyLimit || 0);
  const used = Math.max(0, status.used || 0);
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;

  return (
    <div
      style={{
        borderRadius: 16,
        padding: "10px 12px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        display: "grid",
        gap: 7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 12 }}>
        <span style={{ color: "#64748b", fontWeight: 800 }}>Límite diario de uso</span>
        <strong style={{ color: status.enabled ? accent : "#64748b" }}>
          {used} / {limit}
          {retryAfter > 0 ? ` · espera ${retryAfter}s` : busy ? " · pensando..." : ""}
        </strong>
      </div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", background: percent >= 90 ? "#dc2626" : accent }} />
      </div>
      {notice && <small style={{ color: notice.includes("desactivada") || notice.includes("límite") ? "#b45309" : "#64748b" }}>{notice}</small>}
    </div>
  );
}

function loadLeaflet() {
  return new Promise<any>((resolve, reject) => {
    const existing = (window as any).L;
    if (existing) {
      resolve(existing);
      return;
    }

    if (!document.querySelector('link[data-atenas-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.atenasLeaflet = "true";
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector('script[data-atenas-leaflet="true"]') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve((window as any).L), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar el mapa interactivo.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.dataset.atenasLeaflet = "true";
    script.onload = () => resolve((window as any).L);
    script.onerror = () => reject(new Error("No se pudo cargar el mapa interactivo."));
    document.head.appendChild(script);
  });
}

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const radius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const first = toRad(aLat);
  const second = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(first) * Math.cos(second) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
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
  const ai = useAtenasAI(1);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("Pregunta por el menú, precios, combos u ofertas.");
  const [order, setOrder] = useState<null | {
    number: string;
    items: Array<{ name: string; price: number; icon: string }>;
    total: number;
    readyAt: number;
  }>(null);
  const [remaining, setRemaining] = useState(0);

  const menu = [
    { name: "Espresso", price: 6, prep: 90, icon: "☕", aliases: ["espresso"] },
    { name: "Americano", price: 7, prep: 120, icon: "☕", aliases: ["americano"] },
    { name: "Cappuccino", price: 8.5, prep: 180, icon: "☕", aliases: ["cappuccino", "capuccino"] },
    { name: "Croissant", price: 4.5, prep: 90, icon: "🥐", aliases: ["croissant", "medialuna"] },
    { name: "Pan artesanal", price: 3.5, prep: 75, icon: "🍞", aliases: ["pan artesanal", "pan"] },
    { name: "Sandwich", price: 9, prep: 210, icon: "🥪", aliases: ["sandwich", "sándwich"] },
    { name: "Combo Café + Pan", price: 10.5, prep: 210, icon: "✨", aliases: ["combo cafe pan", "combo café pan", "combo"] },
  ];

  const cards = [
    { icon: "☕", title: "Café", text: "Espresso, americano y cappuccino", meta: "3 opciones", price: "Desde S/ 6", color: "#7c3aed", pos: "16% 42%" },
    { icon: "🥐", title: "Panadería", text: "Pan artesanal y croissant del día", meta: "Recién hecho", price: "Desde S/ 3,50", color: "#d97706", pos: "12% 72%" },
    { icon: "🥪", title: "Combos", text: "Café + pan y meriendas rápidas", meta: "Más pedido", price: "S/ 10,50", color: "#2563eb", pos: "72% 70%" },
    { icon: "🏷️", title: "Ofertas", text: "Promociones escolares de demostración", meta: "Hoy", price: "Consultar", color: "#db2777", pos: "82% 34%" },
  ];

  function localAnswer(value: string) {
    const text = value.toLowerCase();
    if (text.includes("oferta") || text.includes("promoc")) return "Hoy hay promociones de demostración. Puedo ayudarte a elegir una opción del menú.";
    if (text.includes("combo")) return "El combo Café + Pan cuesta S/ 10,50 e incluye una bebida caliente y una pieza de panadería.";
    if (text.includes("precio") || text.includes("cuesta")) return "Los cafés parten desde S/ 6,00 y el combo Café + Pan cuesta S/ 10,50.";
    if (text.includes("pan")) return "Tenemos pan artesanal y croissant del día.";
    return "Tenemos espresso, americano, cappuccino, pan artesanal, croissant, sandwich y el combo Café + Pan.";
  }

  function detectItems(value: string) {
    const normalized = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const found: typeof menu = [];
    for (const item of menu) {
      if (item.aliases.some((alias) => normalized.includes(alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
        found.push(item);
      }
    }

    if (!found.length && normalized.includes("cafe")) {
      found.push(menu[2]);
    }

    if (normalized.includes("cafe con pan") && !found.some((item) => item.name === "Pan artesanal")) {
      found.push(menu[4]);
    }

    return found.filter((item, index, all) => all.findIndex((other) => other.name === item.name) === index);
  }

  function createOrder(items: typeof menu) {
    if (!items.length) return;
    const preparation = Math.max(...items.map((item) => item.prep)) + Math.max(0, items.length - 1) * 30;
    const readyAt = Date.now() + preparation * 1000;
    const number = String(Math.floor(10 + Math.random() * 89)).padStart(2, "0");
    setOrder({
      number,
      items: items.map(({ name, price, icon }) => ({ name, price, icon })),
      total: items.reduce((sum, item) => sum + item.price, 0),
      readyAt,
    });
    setRemaining(preparation);
  }

  useEffect(() => {
    if (!order) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((order.readyAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [order?.readyAt]);

  async function run(value = query) {
    const text = value.trim();
    if (!text) return;
    setQuery(text);

    const detected = detectItems(text);
    if (detected.length && /(quiero|pedido|pedir|comprar|dame|un |una |combo|cafe|café|croissant|pan|sandwich)/i.test(text)) {
      createOrder(detected);
    }

    setAnswer(localAnswer(text));
    const response = await ai.ask(text, {
      menu: menu.map(({ name, price }) => ({ name, price })),
      pedidoDetectado: detected.map((item) => item.name),
    });
    if (response) setAnswer(response);
  }

  const chips = ["Quiero un cappuccino", "Quiero café con pan", "¿Qué combos hay?", "¿Tienen ofertas?"];
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#faf8ff)" }}>
        <div style={{ display: "grid", gap: 12 }}>
          <AiUseBar ai={ai} accent={theme.accent} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && run()}
              placeholder="Ej.: Quiero un cappuccino y un croissant"
              style={{ ...fieldStyle, flex: "1 1 420px", minHeight: 56, fontSize: 16 }}
            />
            <button
              type="button"
              onClick={() => run()}
              disabled={ai.busy}
              style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, minHeight: 56, opacity: ai.busy ? .65 : 1 }}
            >
              <Sparkles size={18} /> {ai.busy ? "Pensando..." : "Consultar"}
            </button>
          </div>
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

      {order && (
        <Panel style={{ background: remaining > 0 ? "linear-gradient(135deg,#fff7ed,#ffffff)" : "linear-gradient(135deg,#ecfdf5,#ffffff)", border: remaining > 0 ? "1px solid #fed7aa" : "1px solid #bbf7d0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 18, alignItems: "center" }}>
            <div>
              <small style={{ fontWeight: 950, color: remaining > 0 ? "#c2410c" : "#047857" }}>PEDIDO #{order.number}</small>
              <div style={{ marginTop: 7, display: "grid", gap: 6 }}>
                {order.items.map((item) => (
                  <div key={item.name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span>{item.icon} {item.name}</span>
                    <strong>S/ {item.price.toFixed(2).replace(".", ",")}</strong>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                <strong>Total</strong>
                <strong style={{ color: theme.accent }}>S/ {order.total.toFixed(2).replace(".", ",")}</strong>
              </div>
            </div>
            <div style={{ minWidth: 180, borderRadius: 22, padding: 18, textAlign: "center", background: remaining > 0 ? "#fff" : "#dcfce7", boxShadow: "0 10px 30px rgba(15,23,42,.07)" }}>
              <small style={{ color: "#64748b", fontWeight: 850 }}>TIEMPO ESTIMADO</small>
              <div style={{ marginTop: 5, fontSize: 37, fontWeight: 950, color: remaining > 0 ? "#c2410c" : "#15803d", fontVariantNumeric: "tabular-nums" }}>
                {remaining > 0 ? `${minutes}:${seconds}` : "LISTO"}
              </div>
              <div style={{ fontSize: 12, color: remaining > 0 ? "#9a3412" : "#166534", fontWeight: 800 }}>
                {remaining > 0 ? "Preparando tu pedido" : "✅ Pedido listo para recoger"}
              </div>
            </div>
          </div>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16 }}>
        {cards.map((item) => (
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapForgeDemo({ theme }: { theme: Theme }) {
  const ai = useAtenasAI(2);
  const [style, setStyle] = useState("aventura");
  const [difficulty, setDifficulty] = useState("media");
  const [players, setPlayers] = useState(3);
  const [result, setResult] = useState("Aventura del Castillo");
  const [explanation, setExplanation] = useState("Selecciona tus preferencias y pide una recomendación.");

  const maps = [
    { name: "Aventura del Castillo", style: "aventura", difficulty: "media", difficultyLabel: "Media", players: 3, icon: "🏰", text: "Explora un castillo, supera retos y descubre zonas secretas.", themeLabel: "Aventura", popularity: "9.6K", pos: "78% 28%", tint: "#7c3aed" },
    { name: "Mundo Creativo", style: "construccion", difficulty: "facil", difficultyLabel: "Fácil", players: 4, icon: "🧱", text: "Construye libremente en equipo y diseña tu propio mundo.", themeLabel: "Construcción", popularity: "12.4K", pos: "48% 70%", tint: "#2563eb" },
    { name: "Islas de Supervivencia", style: "supervivencia", difficulty: "dificil", difficultyLabel: "Difícil", players: 2, icon: "🏝️", text: "Consigue recursos, crea refugios y sobrevive en islas flotantes.", themeLabel: "Supervivencia", popularity: "8.1K", pos: "86% 48%", tint: "#16a34a" },
    { name: "Bosque de Exploración", style: "exploracion", difficulty: "facil", difficultyLabel: "Fácil", players: 2, icon: "🌲", text: "Descubre caminos ocultos, portales y zonas especiales.", themeLabel: "Exploración", popularity: "7.9K", pos: "14% 24%", tint: "#0891b2" },
  ];

  function scoreMap(item: (typeof maps)[number]) {
    return (item.style === style ? 3 : 0) + (item.difficulty === difficulty ? 2 : 0) + Math.max(0, 2 - Math.abs(item.players - players) * .5);
  }

  async function run() {
    const ranked = maps.map((item) => ({ ...item, score: scoreMap(item) })).sort((a, b) => b.score - a.score);
    setResult(ranked[0].name);
    setExplanation(`${ranked[0].name} es la mejor coincidencia local para las preferencias seleccionadas.`);
    const text = await ai.ask(
      `Recomienda un mapa para estilo ${style}, dificultad ${difficulty} y ${players} jugadores.`,
      { style, difficulty, players, recomendacionLocal: ranked[0].name }
    );
    if (text) setExplanation(text);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#f8f7ff)" }}>
        <AiUseBar ai={ai} accent={theme.accent} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 14 }}>
          <label><strong style={{ fontSize: 13 }}>Estilo de juego</strong><select value={style} onChange={(e) => setStyle(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }}><option value="aventura">⚔️ Aventura</option><option value="construccion">🧱 Construcción</option><option value="supervivencia">🛡️ Supervivencia</option><option value="exploracion">🧭 Exploración</option></select></label>
          <label><strong style={{ fontSize: 13 }}>Dificultad</strong><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }}><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select></label>
          <label><strong style={{ fontSize: 13 }}>Jugadores</strong><input type="number" min={1} max={8} value={players} onChange={(e) => setPlayers(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 6 }} /></label>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
          <a href="https://create.roblox.com/dashboard/creations" target="_blank" rel="noreferrer" style={{ textDecoration: "none", border: "1px solid #cbd5e1", borderRadius: 14, minHeight: 46, padding: "0 16px", display: "inline-flex", alignItems: "center", color: "#334155", background: "white", fontWeight: 850 }}>🎮 Abrir Roblox Creator / Studio</a>
          <button type="button" onClick={run} disabled={ai.busy} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, opacity: ai.busy ? .65 : 1 }}><BrainCircuit size={18} /> {ai.busy ? "Analizando..." : "Recomendar mapa"}</button>
        </div>
        <div style={{ marginTop: 12, borderRadius: 15, padding: 12, background: theme.soft, color: "#475569", fontSize: 13 }}><strong style={{ color: theme.accent }}>Explicación:</strong> {explanation}</div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
        {maps.map((map) => {
          const selected = result === map.name;
          const score = scoreMap(map);
          const match = Math.min(99, Math.max(54, Math.round((score / 7) * 100)));
          return (
            <div key={map.name} style={{ borderRadius: 25, overflow: "hidden", background: "#fff", border: selected ? `2px solid ${theme.accent}88` : "1px solid rgba(148,163,184,.16)", boxShadow: selected ? `0 24px 60px ${theme.accent}25` : "0 16px 40px rgba(15,23,42,.08)", transform: selected ? "translateY(-3px)" : "none", transition: "all .22s ease" }}>
              <div style={{ height: 160, position: "relative", backgroundImage: `linear-gradient(180deg,rgba(15,23,42,.02),rgba(15,23,42,.62)),url(${theme.image})`, backgroundSize: "cover", backgroundPosition: map.pos }}>
                <div style={{ position: "absolute", inset: "auto 14px 13px 14px", display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}><span style={{ borderRadius: 999, padding: "6px 9px", background: "rgba(15,23,42,.62)", color: "white", fontSize: 11, fontWeight: 850 }}>{map.icon} {map.themeLabel}</span>{selected && <span style={{ borderRadius: 999, padding: "7px 10px", background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "white", fontSize: 11, fontWeight: 950 }}>✨ TOP IA</span>}</div>
              </div>
              <div style={{ padding: 17 }}>
                <strong style={{ display: "block", fontSize: 20 }}>{map.name}</strong>
                <p style={{ margin: "7px 0 13px", color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>{map.text}</p>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}><span style={{ borderRadius: 999, padding: "6px 9px", background: `${map.tint}12`, color: map.tint, fontWeight: 850, fontSize: 11 }}>🎯 {map.difficultyLabel}</span><span style={{ borderRadius: 999, padding: "6px 9px", background: "#f1f5f9", fontWeight: 850, fontSize: 11 }}>👥 {map.players}</span><span style={{ borderRadius: 999, padding: "6px 9px", background: "#fff7ed", color: "#c2410c", fontWeight: 850, fontSize: 11 }}>🔥 {map.popularity}</span></div>
                <div style={{ marginTop: 15, display: "flex", alignItems: "center", gap: 10 }}><div style={{ flex: 1, height: 8, borderRadius: 999, background: "#eef2ff", overflow: "hidden" }}><div style={{ width: `${match}%`, height: "100%", background: `linear-gradient(90deg,${map.tint},${theme.accent})` }} /></div><strong style={{ fontSize: 12 }}>{match}%</strong></div>
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
  type RouteColor = "green" | "yellow" | "red";
  type Segment = { id: string; color: RouteColor; points: [number, number][] };

  const ai = useAtenasAI(3);
  const [scenario, setScenario] = useState<keyof typeof safeScenarios>("school");
  const [hour, setHour] = useState(18);
  const [light, setLight] = useState(2);
  const [people, setPeople] = useState(2);
  const [incidents, setIncidents] = useState(1);
  const [result, setResult] = useState({ label: "Riesgo bajo", color: "#16a34a", confidence: 88, note: "Ruta recomendada para la simulación." });
  const [segments, setSegments] = useState<Segment[]>([]);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [routeColor, setRouteColor] = useState<RouteColor>("green");
  const [drawing, setDrawing] = useState(false);
  const [geoStatus, setGeoStatus] = useState("Activa tu ubicación para saber en qué tramo estás.");
  const [currentLocation, setCurrentLocation] = useState<null | { lat: number; lng: number; accuracy: number; at: string }>(null);
  const [aiExplanation, setAiExplanation] = useState("La explicación inteligente aparecerá cuando pulses “Explicar tramo con IA”.");
  const [saveStatus, setSaveStatus] = useState("");

  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const routeLayersRef = useRef<any[]>([]);
  const locationMarkerRef = useRef<any>(null);
  const drawingRef = useRef(false);
  const routeColorRef = useRef<RouteColor>("green");
  const watchIdRef = useRef<number | null>(null);

  const colorHex: Record<RouteColor, string> = {
    green: "#16a34a",
    yellow: "#eab308",
    red: "#dc2626",
  };
  const colorLabel: Record<RouteColor, string> = {
    green: "Bajo riesgo",
    yellow: "Precaución",
    red: "Mayor precaución",
  };

  useEffect(() => { drawingRef.current = drawing; }, [drawing]);
  useEffect(() => { routeColorRef.current = routeColor; }, [routeColor]);

  function chooseScenario(value: keyof typeof safeScenarios) {
    setScenario(value);
    const next = safeScenarios[value];
    setHour(next.hour);
    setLight(next.light);
    setPeople(next.people);
    setIncidents(next.incidents);
  }

  function run() {
    const samples: Sample[] = [
      { x: [.60, 1, 1, .05], label: "bajo" },
      { x: [.72, 1, .8, .1], label: "bajo" },
      { x: [.82, .5, .5, .4], label: "medio" },
      { x: [.90, 0, 0, .8], label: "alto" },
      { x: [.96, 0, .2, 1], label: "alto" },
      { x: [.35, .5, .2, .6], label: "medio" },
    ];
    const label = knnPredict([hour / 24, light / 2, people / 2, incidents / 5], samples, 3);
    const score = Math.min(100, Math.round((hour >= 20 ? 22 : 7) + (2 - light) * 18 + (2 - people) * 13 + incidents * 10));
    if (label === "alto") setResult({ label: "Riesgo alto", color: "#dc2626", confidence: Math.max(82, score), note: "La simulación recomienda elegir una alternativa más visible." });
    else if (label === "medio") setResult({ label: "Precaución", color: "#d97706", confidence: Math.max(76, score), note: "La simulación detecta factores de riesgo moderado." });
    else setResult({ label: "Riesgo bajo", color: "#16a34a", confidence: Math.max(82, 100 - score / 2), note: "Dentro de los datos simulados, esta alternativa tiene mejores condiciones." });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from("ai_project_data")
          .select("data")
          .eq("group_id", 3)
          .maybeSingle();
        if (!cancelled && !error && data?.data?.safeWalkSegments && Array.isArray(data.data.safeWalkSegments)) {
          setSegments(data.data.safeWalkSegments as Segment[]);
          return;
        }
      } catch {
        // fallback local
      }
      try {
        const local = window.localStorage.getItem("atenas-safewalk-segments");
        if (!cancelled && local) setSegments(JSON.parse(local));
      } catch {
        // sin rutas guardadas
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveRoutes(next: Segment[]) {
    setSegments(next);
    window.localStorage.setItem("atenas-safewalk-segments", JSON.stringify(next));
    setSaveStatus("Guardando rutas...");
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("ai_project_data")
        .upsert({ group_id: 3, data: { safeWalkSegments: next }, updated_at: new Date().toISOString() }, { onConflict: "group_id" });
      setSaveStatus(error ? "Guardado localmente en este navegador." : "✅ Rutas guardadas para el Grupo 3.");
    } catch {
      setSaveStatus("Guardado localmente en este navegador.");
    }
  }

  useEffect(() => {
    let active = true;
    let map: any = null;
    (async () => {
      try {
        const L = await loadLeaflet();
        if (!active || !mapHostRef.current || mapRef.current) return;
        map = L.map(mapHostRef.current, { zoomControl: true }).setView([-11.99, -77.07], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        map.on("click", (event: any) => {
          if (!drawingRef.current) return;
          setDraftPoints((current) => [...current, [event.latlng.lat, event.latlng.lng]]);
        });
        mapRef.current = map;
        window.setTimeout(() => map.invalidateSize(), 100);
      } catch (error) {
        setGeoStatus(error instanceof Error ? error.message : "No se pudo cargar el mapa.");
      }
    })();
    return () => {
      active = false;
      if (watchIdRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
      try { map?.remove(); } catch {}
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;
    routeLayersRef.current.forEach((layer) => {
      try { map.removeLayer(layer); } catch {}
    });
    routeLayersRef.current = [];

    for (const segment of segments) {
      if (segment.points.length < 2) continue;
      const layer = L.polyline(segment.points, {
        color: colorHex[segment.color],
        weight: 8,
        opacity: .9,
      }).addTo(map);
      layer.bindTooltip(colorLabel[segment.color]);
      routeLayersRef.current.push(layer);
    }

    if (draftPoints.length) {
      const draft = L.polyline(draftPoints, {
        color: colorHex[routeColor],
        weight: 6,
        opacity: .75,
        dashArray: "10 8",
      }).addTo(map);
      routeLayersRef.current.push(draft);
      for (const point of draftPoints) {
        routeLayersRef.current.push(L.circleMarker(point, { radius: 5, color: colorHex[routeColor], fillOpacity: 1 }).addTo(map));
      }
    }
  }, [segments, draftPoints, routeColor]);

  function finishSegment() {
    if (draftPoints.length < 2) {
      setGeoStatus("Marca al menos dos puntos en el mapa.");
      return;
    }
    const next: Segment[] = [...segments, { id: crypto.randomUUID(), color: routeColor, points: draftPoints }];
    setDraftPoints([]);
    setDrawing(false);
    saveRoutes(next);
  }

  function clearRoutes() {
    setDraftPoints([]);
    setDrawing(false);
    saveRoutes([]);
  }

  function startTracking() {
    if (!navigator.geolocation) {
      setGeoStatus("Este navegador no ofrece geolocalización.");
      return;
    }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    setGeoStatus("Buscando ubicación...");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          at: new Date().toISOString(),
        };
        setCurrentLocation(next);
        setGeoStatus("✅ Ubicación activa.");
        const map = mapRef.current;
        const L = (window as any).L;
        if (map && L) {
          map.setView([next.lat, next.lng], Math.max(map.getZoom(), 16));
          if (locationMarkerRef.current) locationMarkerRef.current.setLatLng([next.lat, next.lng]);
          else locationMarkerRef.current = L.circleMarker([next.lat, next.lng], { radius: 10, color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 1, weight: 4 }).addTo(map).bindTooltip("Tu ubicación");
        }
      },
      () => setGeoStatus("No se pudo obtener tu ubicación. Revisa el permiso del navegador."),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 }
    );
  }

  function pointToSegmentDistance(point: { lat: number; lng: number }, a: [number, number], b: [number, number]) {
    const latScale = 111320;
    const lngScale = 111320 * Math.cos((point.lat * Math.PI) / 180);
    const px = 0;
    const py = 0;
    const ax = (a[1] - point.lng) * lngScale;
    const ay = (a[0] - point.lat) * latScale;
    const bx = (b[1] - point.lng) * lngScale;
    const by = (b[0] - point.lat) * latScale;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const parameter = len2 === 0 ? 0 : Math.max(0, Math.min(1, -((ax * dx + ay * dy) / len2)));
    const cx = ax + parameter * dx;
    const cy = ay + parameter * dy;
    return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
  }

  const nearest = useMemo(() => {
    if (!currentLocation || !segments.length) return null;
    let best: { segment: Segment; distance: number } | null = null;
    for (const segment of segments) {
      for (let index = 0; index < segment.points.length - 1; index++) {
        const d = pointToSegmentDistance(currentLocation, segment.points[index], segment.points[index + 1]);
        if (!best || d < best.distance) best = { segment, distance: d };
      }
    }
    return best;
  }, [currentLocation, segments]);

  const currentSegment = nearest && nearest.distance <= Math.max(45, currentLocation?.accuracy ?? 0) ? nearest.segment : null;

  async function explainCurrent() {
    const currentColor = currentSegment?.color ?? null;
    const text = await ai.ask(
      `Explica el tramo actual de SafeWalk. Clasificación: ${currentColor ? colorLabel[currentColor] : "fuera de una ruta marcada"}.`,
      {
        color: currentColor,
        hour,
        light,
        people,
        incidents,
        coordinates: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng, accuracy: currentLocation.accuracy } : null,
        distanceToMarkedRouteMeters: nearest ? Math.round(nearest.distance) : null,
      }
    );
    if (text) setAiExplanation(text);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#f7fbff)" }}>
        <AiUseBar ai={ai} accent={theme.accent} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
          <strong style={{ marginRight: 4 }}>Dibujar ruta:</strong>
          {(["green","yellow","red"] as RouteColor[]).map((color) => (
            <button key={color} onClick={() => setRouteColor(color)} style={{ border: routeColor === color ? `2px solid ${colorHex[color]}` : "1px solid #cbd5e1", borderRadius: 999, padding: "8px 12px", background: routeColor === color ? `${colorHex[color]}18` : "white", color: colorHex[color], fontWeight: 900, cursor: "pointer" }}>{color === "green" ? "🟢 Bajo" : color === "yellow" ? "🟡 Precaución" : "🔴 Mayor precaución"}</button>
          ))}
          <button onClick={() => { setDrawing(!drawing); setGeoStatus(!drawing ? "Modo dibujo activo: haz clic sobre el mapa para marcar la ruta." : "Modo dibujo detenido."); }} style={{ border: 0, borderRadius: 13, padding: "9px 13px", background: drawing ? "#111827" : theme.accent, color: "white", fontWeight: 900, cursor: "pointer" }}>{drawing ? "Detener dibujo" : "✏️ Dibujar"}</button>
          <button onClick={finishSegment} disabled={draftPoints.length < 2} style={{ border: "1px solid #cbd5e1", borderRadius: 13, padding: "9px 13px", background: "white", fontWeight: 850, cursor: "pointer", opacity: draftPoints.length < 2 ? .5 : 1 }}>Guardar tramo</button>
          <button onClick={() => setDraftPoints((points) => points.slice(0, -1))} disabled={!draftPoints.length} style={{ border: "1px solid #cbd5e1", borderRadius: 13, padding: "9px 13px", background: "white", fontWeight: 850, cursor: "pointer" }}>↶ Punto</button>
          <button onClick={clearRoutes} style={{ border: "1px solid #fecaca", borderRadius: 13, padding: "9px 13px", background: "#fff7f7", color: "#b91c1c", fontWeight: 850, cursor: "pointer" }}>Borrar rutas</button>
        </div>
        <small style={{ display: "block", marginTop: 9, color: "#64748b" }}>{saveStatus || geoStatus}</small>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(280px,.65fr)", gap: 16 }}>
        <Panel style={{ padding: 10, overflow: "hidden" }}>
          <div ref={mapHostRef} style={{ width: "100%", height: 500, borderRadius: 18, overflow: "hidden", background: "#e2e8f0" }} />
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#64748b" }}>
            <span>Mapa interactivo · OpenStreetMap</span>
            <span>Haz clic sobre el mapa mientras “Dibujar” esté activo.</span>
          </div>
        </Panel>

        <div style={{ display: "grid", gap: 14 }}>
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <strong>📍 Mi ubicación</strong>
              <button onClick={startTracking} style={{ border: 0, borderRadius: 12, padding: "8px 11px", background: "#2563eb", color: "white", fontWeight: 900, cursor: "pointer" }}>Activar ubicación</button>
            </div>
            {currentLocation ? (
              <div style={{ marginTop: 12, display: "grid", gap: 8, fontSize: 13 }}>
                <div><span style={{ color: "#64748b" }}>Latitud:</span> <strong>{currentLocation.lat.toFixed(6)}</strong></div>
                <div><span style={{ color: "#64748b" }}>Longitud:</span> <strong>{currentLocation.lng.toFixed(6)}</strong></div>
                <div><span style={{ color: "#64748b" }}>Precisión:</span> <strong>±{Math.round(currentLocation.accuracy)} m</strong></div>
                <div><span style={{ color: "#64748b" }}>Hora:</span> <strong>{new Date(currentLocation.at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong></div>
                <div style={{ marginTop: 5, borderRadius: 15, padding: 12, background: currentSegment ? `${colorHex[currentSegment.color]}14` : "#f1f5f9", color: currentSegment ? colorHex[currentSegment.color] : "#475569" }}>
                  <small style={{ fontWeight: 900 }}>TRAMO ACTUAL</small>
                  <div style={{ fontSize: 22, fontWeight: 950, marginTop: 3 }}>{currentSegment ? colorLabel[currentSegment.color] : "Fuera de ruta marcada"}</div>
                  {nearest && <div style={{ marginTop: 4, fontSize: 11 }}>Distancia a la ruta marcada: {Math.round(nearest.distance)} m</div>}
                </div>
              </div>
            ) : <p style={{ color: "#64748b", fontSize: 13 }}>Activa la ubicación del navegador para mostrar coordenadas y detectar el tramo más cercano.</p>}
          </Panel>

          <Panel>
            <strong>🧠 Explicación del tramo</strong>
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.45 }}>{aiExplanation}</p>
            <button onClick={explainCurrent} disabled={ai.busy} style={{ ...primaryButton, width: "100%", background: theme.accent, opacity: ai.busy ? .65 : 1 }}><Sparkles size={17} /> {ai.busy ? "Analizando..." : "Explicar tramo con IA"}</button>
          </Panel>
        </div>
      </div>

      <Panel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ flex: "1 1 220px" }}><strong style={{ fontSize: 13 }}>Escenario de demostración</strong><select value={scenario} onChange={(e) => chooseScenario(e.target.value as keyof typeof safeScenarios)} style={{ ...fieldStyle, marginTop: 6 }}>{Object.entries(safeScenarios).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label>
          <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent }}><BrainCircuit size={18} /> Calcular simulación</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 14 }}>
          <NumberBox label="Hora" value={hour} min={0} max={23} onChange={setHour} />
          <SelectBox label="Iluminación" value={light} onChange={setLight} options={[[0,"Baja"],[1,"Media"],[2,"Alta"]]} />
          <SelectBox label="Personas" value={people} onChange={setPeople} options={[[0,"Pocas"],[1,"Algunas"],[2,"Muchas"]]} />
          <NumberBox label="Incidentes simulados" value={incidents} min={0} max={5} onChange={setIncidents} />
        </div>
        <div style={{ marginTop: 13, borderRadius: 14, padding: 12, background: `${result.color}12`, color: result.color }}><strong>{result.label}</strong> · {result.note}</div>
        <div style={{ marginTop: 9, color: "#64748b", fontSize: 11 }}>Clasificación educativa basada en datos registrados por los alumnos. No representa una garantía de seguridad real.</div>
      </Panel>
    </div>
  );
}

function StudyQuestDemo({ theme }: { theme: Theme }) {
  const ai = useAtenasAI(6);
  const [tasks, setTasks] = useState("Estudiar Matemáticas 1 hora; hacer la tarea de Historia; repasar Ciencias; entregar el proyecto.");
  const [startTime, setStartTime] = useState("17:00");
  const [sessionMinutes, setSessionMinutes] = useState(35);
  const [breakMinutes, setBreakMinutes] = useState(10);
  const [plan, setPlan] = useState<Array<{ time: string; task: string; type: "task" | "break" }>>([]);
  const [insight, setInsight] = useState("La IA explicará cómo priorizó tu agenda.");

  function plusMinutes(time: string, add: number) {
    const [h, m] = time.split(":").map(Number);
    const total = (h * 60 + m + add) % (24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  async function run() {
    const parts = tasks.split(/[;\n]+/).map((item) => item.trim()).filter(Boolean).slice(0, 8);
    let cursor = startTime;
    const next: Array<{ time: string; task: string; type: "task" | "break" }> = [];
    parts.forEach((task, index) => {
      next.push({ time: cursor, task, type: "task" });
      cursor = plusMinutes(cursor, sessionMinutes);
      if (index < parts.length - 1) {
        next.push({ time: cursor, task: `Descanso de ${breakMinutes} min`, type: "break" });
        cursor = plusMinutes(cursor, breakMinutes);
      }
    });
    setPlan(next);

    const text = await ai.ask(
      "Organiza y explica brevemente esta agenda escolar.",
      { tasks: parts, startTime, sessionMinutes, breakMinutes }
    );
    if (text) setInsight(text);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#faf8ff)" }}>
        <AiUseBar ai={ai} accent={theme.accent} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3,minmax(130px,.45fr))", gap: 12, marginTop: 14, alignItems: "end" }}>
          <label><strong style={{ fontSize: 13 }}>Tareas de hoy</strong><textarea value={tasks} onChange={(e) => setTasks(e.target.value)} rows={4} style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, marginTop: 6, resize: "vertical" }} /></label>
          <label><strong style={{ fontSize: 13 }}>Empezar</strong><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <label><strong style={{ fontSize: 13 }}>Bloque</strong><input type="number" min={20} max={90} value={sessionMinutes} onChange={(e) => setSessionMinutes(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <label><strong style={{ fontSize: 13 }}>Descanso</strong><input type="number" min={5} max={30} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 6 }} /></label>
        </div>
        <button type="button" onClick={run} disabled={ai.busy} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, marginTop: 12, opacity: ai.busy ? .65 : 1 }}><BrainCircuit size={18} /> {ai.busy ? "Organizando..." : "Organizar con IA"}</button>
        <div style={{ marginTop: 12, borderRadius: 15, padding: 12, background: theme.soft, color: "#475569", fontSize: 13 }}><strong style={{ color: theme.accent }}>Por qué este orden:</strong> {insight}</div>
      </Panel>

      <Panel style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #eef2f7", display: "flex", justifyContent: "space-between" }}>
          <div><strong style={{ fontSize: 21 }}>🗓️ Agenda sugerida</strong><div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>Bloques de estudio y descansos.</div></div>
          <span style={{ borderRadius: 999, padding: "7px 10px", background: theme.soft, color: theme.accent, fontWeight: 900, fontSize: 11 }}>{plan.filter((item) => item.type === "task").length} tareas</span>
        </div>
        {plan.length === 0 ? <div style={{ padding: 24, color: "#64748b" }}>Pulsa “Organizar con IA” para crear la agenda.</div> : (
          <div style={{ padding: 18, display: "grid", gap: 9 }}>
            {plan.map((item, index) => (
              <div key={`${item.time}-${index}`} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, alignItems: "center", padding: item.type === "break" ? "9px 13px" : "13px", borderRadius: 17, background: item.type === "break" ? "#f1f5f9" : "#fff", border: "1px solid #eef2f7" }}>
                <div style={{ fontWeight: 950, color: item.type === "break" ? "#64748b" : theme.accent }}>{item.time}</div>
                <div><strong style={{ color: item.type === "break" ? "#64748b" : "#111827" }}>{item.type === "break" ? "☕ " : "📚 "}{item.task}</strong>{item.type === "task" && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sessionMinutes} min de enfoque</div>}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SeniorCareDemo({ theme }: { theme: Theme }) {
  const ai = useAtenasAI(7);
  const [time, setTime] = useState("08:00");
  const [reminder, setReminder] = useState("Tomar el medicamento previamente indicado");
  const [result, setResult] = useState("Configura un recordatorio o pide un resumen de la rutina.");
  const [routine, setRoutine] = useState([
    { time: "08:00", icon: "💊", title: "Medicamento registrado", detail: "Según indicación ya registrada por el cuidador." },
    { time: "09:30", icon: "💧", title: "Hidratación", detail: "Tomar agua." },
    { time: "10:30", icon: "🚶", title: "Caminata", detail: "Actividad suave de demostración." },
    { time: "12:00", icon: "❤️", title: "Registro de bienestar", detail: "Anotar pulso o actividad, sin diagnóstico." },
    { time: "16:00", icon: "📞", title: "Contacto familiar", detail: "Llamada o mensaje a un familiar." },
    { time: "18:30", icon: "🥗", title: "Cena", detail: "Recordatorio de rutina." },
  ]);

  function createReminder() {
    setRoutine((current) => [...current, { time, icon: "⏰", title: reminder, detail: "Recordatorio agregado por el usuario." }].sort((a,b) => a.time.localeCompare(b.time)));
    setResult(`Recordatorio programado para las ${time}: ${reminder}.`);
  }

  async function summarize() {
    const text = await ai.ask(
      "Resume la rutina de hoy y señala cuál es el próximo recordatorio.",
      { now: new Date().toISOString(), routine }
    );
    if (text) setResult(text);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel style={{ background: "linear-gradient(135deg,#ffffff,#fff8fb)" }}>
        <AiUseBar ai={ai} accent={theme.accent} />
        <div style={{ display: "grid", gridTemplateColumns: "minmax(140px,.45fr) minmax(240px,1.3fr) auto auto", gap: 12, alignItems: "end", marginTop: 14 }}>
          <label><strong style={{ fontSize: 13 }}>Hora</strong><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <label><strong style={{ fontSize: 13 }}>Recordatorio</strong><input value={reminder} onChange={(e) => setReminder(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <button type="button" onClick={createReminder} style={{ ...primaryButton, background: "#0f766e" }}>＋ Agregar</button>
          <button type="button" onClick={summarize} disabled={ai.busy} style={{ ...primaryButton, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, opacity: ai.busy ? .65 : 1 }}><Sparkles size={18} /> {ai.busy ? "Revisando..." : "Resumen con IA"}</button>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(280px,.7fr)", gap: 16 }}>
        <Panel style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "17px 20px", borderBottom: "1px solid #eef2f7" }}><strong style={{ fontSize: 20 }}>Rutina de demostración</strong><div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>Datos ficticios configurados para la exposición.</div></div>
          <div style={{ padding: 16, display: "grid", gap: 9 }}>
            {routine.map((item, index) => <div key={`${item.time}-${index}`} style={{ display: "grid", gridTemplateColumns: "64px 46px 1fr", gap: 11, alignItems: "center", padding: 11, borderRadius: 16, background: index % 2 ? "#f8fafc" : "#fff", border: "1px solid #eef2f7" }}><strong style={{ color: theme.accent }}>{item.time}</strong><div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: theme.soft, fontSize: 21 }}>{item.icon}</div><div><strong>{item.title}</strong><div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{item.detail}</div></div></div>)}
          </div>
        </Panel>

        <Panel style={{ background: `linear-gradient(135deg,${theme.accent}0d,#ffffff)` }}>
          <small style={{ color: theme.accent, fontWeight: 950 }}>ASISTENTE DE RUTINA</small>
          <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.5, fontWeight: 750 }}>{result}</div>
          <div style={{ marginTop: 14, borderRadius: 14, padding: 12, background: "#fff7ed", fontSize: 12, color: "#9a3412" }}>Prototipo educativo. Organiza recordatorios ya registrados; no diagnostica ni modifica medicamentos, dosis o tratamientos.</div>
        </Panel>
      </div>
    </div>
  );
}

function MiniGameDemo({ theme }: { theme: Theme }) {
  const ai = useAtenasAI(10);
  const [position, setPosition] = useState(14);
  const [health, setHealth] = useState(82);
  const [energy, setEnergy] = useState(76);
  const [coins, setCoins] = useState(0);
  const [aiAdvice, setAiAdvice] = useState("La estrategia local recomienda avanzar y recoger monedas.");
  const enemyPosition = 72;
  const coinPositions = [32, 51, 88];

  const distanceToEnemy = Math.abs(enemyPosition - position);
  const suggestion = health < 35 ? "🏃 Retroceder y recuperar vida" : distanceToEnemy < 18 && energy > 40 ? "⚔️ Atacar al enemigo" : energy < 30 ? "💤 Descansar y recuperar energía" : "➡️ Avanzar y recoger monedas";

  function move(delta: number) { setPosition((value) => Math.max(4, Math.min(94, value + delta))); setEnergy((value) => Math.max(0, value - 4)); }
  function collect() { if (coinPositions.some((coin) => Math.abs(coin - position) < 8)) setCoins((value) => value + 1); }
  function attack() { setEnergy((value) => Math.max(0, value - (distanceToEnemy < 20 ? 12 : 5))); if (distanceToEnemy < 20) setCoins((value) => value + 1); }
  function rest() { setEnergy((value) => Math.min(100, value + 20)); setHealth((value) => Math.min(100, value + 8)); }
  function reset() { setPosition(14); setHealth(82); setEnergy(76); setCoins(0); setAiAdvice("La estrategia local recomienda avanzar y recoger monedas."); }

  async function consult(kind: "strategy" | "mission") {
    const text = await ai.ask(
      kind === "strategy" ? "Dame la mejor estrategia para el estado actual." : "Crea una mini misión para este estado del juego.",
      { health, energy, coins, position, enemyPosition, distanceToEnemy, localSuggestion: suggestion }
    );
    if (text) setAiAdvice(text);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AiUseBar ai={ai} accent={theme.accent} />
      <div style={{ borderRadius: 26, overflow: "hidden", position: "relative", minHeight: 350, backgroundImage: `linear-gradient(180deg,rgba(15,23,42,.05),rgba(15,23,42,.58)),url(${theme.image})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 22px 58px rgba(15,23,42,.18)" }}>
        <div style={{ position: "absolute", left: 18, right: 18, top: 18, display: "flex", justifyContent: "space-between", gap: 10 }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(15,23,42,.72)", color: "white", fontWeight: 900, fontSize: 11 }}>❤️ VIDA {health}%</span><span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(15,23,42,.72)", color: "white", fontWeight: 900, fontSize: 11 }}>⚡ ENERGÍA {energy}%</span><span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(15,23,42,.72)", color: "white", fontWeight: 900, fontSize: 11 }}>🪙 {coins}</span></div><span style={{ borderRadius: 999, padding: "8px 11px", background: "rgba(255,255,255,.9)", color: theme.accent, fontWeight: 950, fontSize: 11 }}>🏰 META</span></div>
        <div style={{ position: "absolute", left: `${position}%`, bottom: 58, width: 54, height: 54, borderRadius: 18, display: "grid", placeItems: "center", background: "rgba(255,255,255,.92)", fontSize: 31, transform: "translateX(-50%)", transition: "left .2s ease" }}>🧙</div>
        <div style={{ position: "absolute", left: `${enemyPosition}%`, bottom: 62, width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: "rgba(127,29,29,.88)", fontSize: 27, transform: "translateX(-50%)" }}>👾</div>
        {coinPositions.map((coin) => <div key={coin} style={{ position: "absolute", left: `${coin}%`, bottom: 66, fontSize: 24, transform: "translateX(-50%)" }}>🪙</div>)}
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, height: 16, borderRadius: 999, background: "rgba(255,255,255,.22)", overflow: "hidden" }}><div style={{ width: `${position}%`, height: "100%", background: `linear-gradient(90deg,${theme.accent},${theme.accent2})` }} /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(290px,.72fr)", gap: 14 }}>
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}><Stat label="Vida" value={health} color="#e11d48" /><Stat label="Energía" value={energy} color="#f59e0b" /><Stat label="Monedas" value={Math.min(100, coins * 25)} color="#7c3aed" text={String(coins)} /></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}><GameButton onClick={() => move(-10)}>⬅️ Atrás</GameButton><GameButton onClick={() => move(10)}>➡️ Avanzar</GameButton><GameButton onClick={collect}>🪙 Recoger</GameButton><GameButton onClick={attack}>⚔️ Atacar</GameButton><GameButton onClick={rest}>💤 Descansar</GameButton><GameButton onClick={reset}><RotateCcw size={15} /> Reiniciar</GameButton></div>
        </Panel>
        <Panel style={{ background: `linear-gradient(135deg,${theme.accent}10,#ffffff)` }}>
          <small style={{ color: theme.accent, fontWeight: 950 }}>ESTRATEGIA INTELIGENTE</small>
          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>{aiAdvice}</div>
          <div style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>Regla local: <strong>{suggestion}</strong></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}><button onClick={() => consult("strategy")} disabled={ai.busy} style={{ ...primaryButton, minHeight: 42, background: theme.accent }}>Consejo IA</button><button onClick={() => consult("mission")} disabled={ai.busy} style={{ ...primaryButton, minHeight: 42, background: "white", color: theme.accent, border: `1px solid ${theme.accent}44` }}>Nueva misión</button></div>
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
  const [adminScreen, setAdminScreen] = useState(false);
  const displayName = projectName?.trim() || theme.fallbackName;
  const heroRight = [4, 8, 11, 12].includes(groupId);
  const uiFont = 'Inter, Aptos, "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

  useEffect(() => {
    setAdminScreen(window.location.pathname === "/");
  }, []);

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
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
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
              {adminScreen && groupId === 1 && (
                <a
                  href="/ai-control"
                  style={{
                    minHeight: 55,
                    borderRadius: 16,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #ddd6fe",
                    background: "#f5f3ff",
                    color: "#6d28d9",
                    fontWeight: 900,
                    textDecoration: "none",
                  }}
                >
                  <Settings size={18} /> Control de IA
                </a>
              )}
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
