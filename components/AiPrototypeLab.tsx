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
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const webcamRef = useRef<any>(null);
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
    const parsed = extractTeachableUrl(String(prototypeUrl ?? "")) || extractTeachableUrl(saved);
    if (parsed) {
      setModelUrl(parsed);
      setModelSource(parsed);
      setShowSetup(false);
      setStatus("Modelo configurado. Puedes usar cámara o importar una imagen.");
    }
  }, [groupId, prototypeUrl]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      try {
        webcamRef.current?.stop?.();
      } catch {
        // no-op
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
      window.localStorage.setItem(`atenas-tm-model-${groupId}`, parsed);
      setModelUrl(parsed);
      await ensureModel(parsed);
      setShowSetup(false);
      setStatus("✅ Modelo guardado en este navegador y listo para probar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo conectar el modelo.");
    }
  }

  function stopCamera() {
    runningRef.current = false;
    try {
      webcamRef.current?.stop?.();
    } catch {
      // no-op
    }
    webcamRef.current = null;
    if (canvasHostRef.current) canvasHostRef.current.innerHTML = "";
  }

  async function startCamera() {
    setPredictions([]);
    setImagePreview("");
    stopCamera();

    try {
      const model = await ensureModel();
      const tmImage = (window as any).tmImage;
      const webcam = new tmImage.Webcam(420, 320, true);
      await webcam.setup();
      await webcam.play();
      webcamRef.current = webcam;
      runningRef.current = true;
      setMode("camera");

      if (canvasHostRef.current) {
        canvasHostRef.current.innerHTML = "";
        webcam.canvas.style.width = "100%";
        webcam.canvas.style.height = "100%";
        webcam.canvas.style.objectFit = "cover";
        canvasHostRef.current.appendChild(webcam.canvas);
      }

      const loop = async () => {
        if (!runningRef.current || !webcamRef.current) return;
        webcamRef.current.update();
        const result = (await model.predict(webcamRef.current.canvas)) as Prediction[];
        setPredictions(sortPredictions(result));
        window.requestAnimationFrame(loop);
      };

      loop();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "No se pudo iniciar la cámara.");
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
          ref={canvasHostRef}
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

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && run()}
            placeholder="Ej.: ¿Tienen café con pan?"
            style={{ ...fieldStyle, flex: "1 1 420px" }}
          />
          <button type="button" onClick={() => run()} style={{ ...primaryButton, background: theme.accent }}>
            <Sparkles size={18} /> Consultar
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => run(chip)}
              style={{ border: 0, borderRadius: 999, padding: "8px 11px", background: theme.soft, color: "#4c1d95", cursor: "pointer", fontWeight: 800 }}
            >
              {chip}
            </button>
          ))}
        </div>
        <ResultBadge accent={theme.accent}>
          <strong style={{ color: theme.accent }}>🤖 Respuesta de la IA</strong>
          <div style={{ marginTop: 7, fontSize: 18, lineHeight: 1.45 }}>{answer}</div>
        </ResultBadge>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
        {[
          ["☕", "Café", "Espresso, americano y cappuccino"],
          ["🥐", "Panadería", "Pan fresco y croissants"],
          ["🥪", "Combos", "Café + pan y meriendas"],
          ["🏷️", "Ofertas", "Promociones de demostración"],
        ].map(([icon, title, text]) => (
          <Panel key={title} style={{ padding: 16, boxShadow: "none" }}>
            <div style={{ fontSize: 34 }}>{icon}</div>
            <strong style={{ display: "block", margin: "7px 0 4px" }}>{title}</strong>
            <span style={{ color: "#64748b", fontSize: 13 }}>{text}</span>
          </Panel>
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
    { name: "Aventura del Castillo", style: "aventura", difficulty: "media", players: 3, icon: "🏰", text: "Explora un castillo y completa retos." },
    { name: "Mundo Creativo", style: "construccion", difficulty: "facil", players: 4, icon: "🧱", text: "Construye libremente en equipo." },
    { name: "Islas de Supervivencia", style: "supervivencia", difficulty: "dificil", players: 2, icon: "🏝️", text: "Consigue recursos y sobrevive." },
    { name: "Bosque de Exploración", style: "exploracion", difficulty: "facil", players: 2, icon: "🌲", text: "Descubre caminos, secretos y zonas ocultas." },
  ];

  function run() {
    const ranked = maps
      .map((item) => ({
        ...item,
        score:
          (item.style === style ? 3 : 0) +
          (item.difficulty === difficulty ? 2 : 0) +
          Math.max(0, 2 - Math.abs(item.players - players) * .5),
      }))
      .sort((a, b) => b.score - a.score);
    setResult(ranked[0].name);
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <label>
            <strong style={{ fontSize: 13 }}>Estilo</strong>
            <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }}>
              <option value="aventura">Aventura</option>
              <option value="construccion">Construcción</option>
              <option value="supervivencia">Supervivencia</option>
              <option value="exploracion">Exploración</option>
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
        <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent, marginTop: 14 }}>
          <BrainCircuit size={18} /> Recomendar mapa
        </button>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        {maps.map((map) => {
          const selected = result === map.name;
          return (
            <Panel key={map.name} style={{ padding: 16, boxShadow: selected ? `0 0 0 3px ${theme.accent}55,0 18px 40px rgba(15,23,42,.14)` : "none" }}>
              <div style={{ fontSize: 40 }}>{map.icon}</div>
              <strong style={{ display: "block", fontSize: 18, margin: "6px 0" }}>{map.name}</strong>
              <span style={{ color: "#64748b", fontSize: 13 }}>{map.text}</span>
              {selected && <div style={{ marginTop: 10, color: theme.accent, fontWeight: 900 }}>✨ Recomendado por la IA</div>}
            </Panel>
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

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
          <label style={{ flex: "1 1 230px" }}>
            <strong style={{ fontSize: 13 }}>Escenario de demostración</strong>
            <select value={scenario} onChange={(e) => chooseScenario(e.target.value as keyof typeof safeScenarios)} style={{ ...fieldStyle, marginTop: 6 }}>
              {Object.entries(safeScenarios).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent }}>
            <BrainCircuit size={18} /> Analizar ruta
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 14 }}>
          <NumberBox label="Hora" value={hour} min={0} max={23} onChange={setHour} />
          <SelectBox label="Iluminación" value={light} onChange={setLight} options={[[0,"Baja"],[1,"Media"],[2,"Alta"]]} />
          <SelectBox label="Personas" value={people} onChange={setPeople} options={[[0,"Pocas"],[1,"Algunas"],[2,"Muchas"]]} />
          <NumberBox label="Incidentes" value={incidents} min={0} max={5} onChange={setIncidents} />
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(240px,.7fr)", gap: 16 }}>
        <Panel style={{ padding: 12, overflow: "hidden" }}>
          <div
            style={{
              minHeight: 360,
              borderRadius: 18,
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#eef2ff",
              backgroundImage: "linear-gradient(#d8dee9 1px,transparent 1px),linear-gradient(90deg,#d8dee9 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          >
            <div style={{ position: "absolute", inset: "9% 8%", borderRadius: 80, border: `12px solid ${result.color}`, transform: "rotate(-8deg)", opacity: .85 }} />
            <div style={{ position: "absolute", left: "8%", top: "38%", fontSize: 42 }}>🏫</div>
            <div style={{ position: "absolute", right: "9%", bottom: "20%", fontSize: 42 }}>🏠</div>
            <div style={{ position: "absolute", left: "43%", top: "19%", fontSize: 36 }}>⚠️</div>
            <div style={{ position: "absolute", left: "57%", bottom: "18%", fontSize: 36 }}>⚠️</div>
            <div style={{ position: "absolute", left: 18, bottom: 18, borderRadius: 14, padding: "10px 12px", background: "rgba(255,255,255,.94)", fontSize: 12, fontWeight: 800 }}>
              🟢 ruta recomendada · 🔴 zona de riesgo · 🟠 precaución
            </div>
          </div>
        </Panel>

        <Panel>
          <small style={{ color: result.color, fontWeight: 900 }}>SIMULACIÓN EDUCATIVA</small>
          <div style={{ fontSize: 30, fontWeight: 950, color: result.color, marginTop: 7 }}>{result.label}</div>
          <div style={{ marginTop: 8, color: "#475569" }}>Confianza simulada: <strong>{Math.round(result.confidence)}%</strong></div>
          <p style={{ color: "#475569", lineHeight: 1.5 }}>{result.note}</p>
          <div style={{ borderRadius: 14, padding: 12, background: "#f8fafc", fontSize: 12, color: "#64748b" }}>
            SafeWalk no determina seguridad real. Sirve para explicar cómo una IA podría combinar datos de una zona y clasificar el riesgo.
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
    const times = ["8:00", "9:15", "10:30", "12:00", "16:00", "18:00"];
    setPlan(parts.map((item, index) => `${times[index] ?? `${8 + index}:00`} · ${item}`));
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel>
        <strong>Escribe tus tareas y horarios</strong>
        <textarea value={tasks} onChange={(e) => setTasks(e.target.value)} rows={4} style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 14, padding: 13, marginTop: 8, fontSize: 15 }} />
        <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent, marginTop: 12 }}>
          <BrainCircuit size={18} /> Organizar con IA
        </button>
      </Panel>

      <Panel>
        <strong style={{ fontSize: 20 }}>🗓️ Tu agenda sugerida</strong>
        {plan.length === 0 ? (
          <p style={{ color: "#64748b" }}>Pulsa “Organizar con IA” para crear una demostración de horario.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 14 }}>
            {plan.map((item, index) => (
              <div key={`${item}-${index}`} style={{ borderRadius: 18, padding: 16, background: index % 2 ? "#eff6ff" : theme.soft, minHeight: 110 }}>
                <strong style={{ display: "block", color: theme.accent }}>Bloque {index + 1}</strong>
                <span style={{ display: "block", marginTop: 8, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
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

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Panel>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,.5fr) minmax(240px,1.4fr) auto", gap: 12, alignItems: "end" }}>
          <label><strong style={{ fontSize: 13 }}>Hora</strong><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <label><strong style={{ fontSize: 13 }}>Recordatorio</strong><input value={reminder} onChange={(e) => setReminder(e.target.value)} style={{ ...fieldStyle, marginTop: 6 }} /></label>
          <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent }}><Sparkles size={18} /> Crear plan</button>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
        <Panel>
          <strong style={{ fontSize: 19 }}>⏰ Horario de recordatorios</strong>
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={{ borderRadius: 14, padding: 12, background: theme.soft }}><strong>{time}</strong> · {reminder}</div>
            <div style={{ borderRadius: 14, padding: 12, background: "#f8fafc" }}><strong>20:00</strong> · Revisión de rutina configurada como ejemplo</div>
          </div>
        </Panel>
        <Panel>
          <strong style={{ fontSize: 19 }}>💜 Resultado del asistente</strong>
          <p style={{ lineHeight: 1.5, color: "#475569" }}>{result || "Configura un recordatorio y pulsa Crear plan."}</p>
          <div style={{ borderRadius: 14, padding: 12, background: "#fff7ed", fontSize: 12, color: "#9a3412" }}>
            Prototipo educativo: organiza recordatorios. No diagnostica ni decide tratamientos o dosis.
          </div>
        </Panel>
      </div>
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
      <Panel style={{ padding: 14 }}>
        <div
          style={{
            height: 300,
            position: "relative",
            overflow: "hidden",
            borderRadius: 20,
            background: "linear-gradient(#93c5fd 0 62%,#86efac 62% 74%,#854d0e 74%)",
          }}
        >
          <div style={{ position: "absolute", inset: "24px 0 auto 0", textAlign: "center", fontSize: 40, opacity: .8 }}>☁️　　　　☁️　　　　　　　　☁️</div>
          {coinPositions.map((coin) => <div key={coin} style={{ position: "absolute", left: `${coin}%`, top: "61%", fontSize: 28, transform: "translate(-50%,-50%)" }}>🪙</div>)}
          <div style={{ position: "absolute", left: `${enemyPosition}%`, top: "58%", fontSize: 42, transform: "translate(-50%,-50%)" }}>👾</div>
          <div style={{ position: "absolute", left: `${position}%`, top: "57%", fontSize: 48, transform: "translate(-50%,-50%)", transition: "left .2s ease" }}>🧙</div>
          <div style={{ position: "absolute", right: 18, top: 16, borderRadius: 14, padding: "8px 10px", background: "rgba(255,255,255,.9)", fontSize: 12, fontWeight: 800 }}>🏰 META</div>
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(250px,.7fr)", gap: 14 }}>
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <Stat label="Vida" value={health} color="#e11d48" />
            <Stat label="Energía" value={energy} color="#f59e0b" />
            <Stat label="Monedas" value={Math.min(100, coins * 25)} color="#7c3aed" text={String(coins)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <GameButton onClick={() => move(-10)}>⬅️ Atrás</GameButton>
            <GameButton onClick={() => move(10)}>➡️ Avanzar</GameButton>
            <GameButton onClick={collect}>🪙 Recoger</GameButton>
            <GameButton onClick={attack}>⚔️ Atacar</GameButton>
            <GameButton onClick={rest}>💤 Descansar</GameButton>
            <GameButton onClick={reset}><RotateCcw size={15} /> Reiniciar</GameButton>
          </div>
        </Panel>

        <Panel>
          <small style={{ color: theme.accent, fontWeight: 900 }}>RECOMENDACIÓN DE LA IA</small>
          <div style={{ fontSize: 24, fontWeight: 950, marginTop: 8 }}>{suggestion}</div>
          <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
            La recomendación cambia según vida, energía y distancia al enemigo. El estudiante puede jugar y observar cómo cambia la decisión.
          </p>
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
    <Panel>
      <strong>{projectName || theme.fallbackName} · Demostración IA</strong>
      <p style={{ color: "#64748b", fontSize: 13 }}>Este grupo todavía no tiene un motor específico asignado; esta prueba permite explicar entrada → análisis → resultado.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Escribe una entrada para analizar..." style={{ width: "100%", border: "1px solid #cbd5e1", borderRadius: 14, padding: 12 }} />
      <button type="button" onClick={run} style={{ ...primaryButton, background: theme.accent, marginTop: 12 }}><BrainCircuit size={18} /> Analizar</button>
      {result && <ResultBadge accent={theme.accent}><strong>{result}</strong></ResultBadge>}
    </Panel>
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
    decorations: ["🤖", "✨", "🧠", "⚙️"],
  };

  const [open, setOpen] = useState(false);
  const displayName = projectName?.trim() || theme.fallbackName;

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
      // full-screen API is optional; overlay still fills the viewport
    }
  }

  return (
    <>
      <section
        style={{
          borderRadius: 26,
          padding: 24,
          margin: "20px 0",
          color: "white",
          background: theme.background,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 18px 44px rgba(15,23,42,.14)",
        }}
      >
        {theme.decorations.map((item, index) => (
          <span
            key={`${item}-${index}`}
            style={{
              position: "absolute",
              right: `${4 + index * 7}%`,
              top: `${12 + (index % 2) * 42}%`,
              fontSize: 34 + index * 3,
              opacity: .16,
              transform: `rotate(${index % 2 ? 12 : -12}deg)`,
              pointerEvents: "none",
            }}
          >
            {item}
          </span>
        ))}

        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 740 }}>
            <small style={{ fontWeight: 900, letterSpacing: .8, opacity: .86 }}>LABORATORIO IA · DEMO EN VIVO</small>
            <h2 style={{ margin: "8px 0 5px", fontSize: 28 }}>{theme.emoji} {displayName}</h2>
            <p style={{ margin: 0, opacity: .9, lineHeight: 1.5 }}>{theme.tagline}. Abre una interfaz de presentación para demostrar la función principal de la IA.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ ...primaryButton, minHeight: 54, background: "white", color: theme.accent, padding: "0 22px" }}
          >
            <Sparkles size={20} /> Probar mi proyecto IA <ChevronRight size={19} />
          </button>
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
            background: theme.background,
            color: "#172033",
          }}
        >
          <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
            {theme.decorations.map((item, index) => (
              <span
                key={`full-${item}-${index}`}
                style={{
                  position: "fixed",
                  left: index % 2 === 0 ? `${2 + index * 6}%` : "auto",
                  right: index % 2 ? `${2 + index * 5}%` : "auto",
                  top: `${14 + index * 19}%`,
                  fontSize: 70,
                  opacity: .1,
                  pointerEvents: "none",
                  filter: "blur(.2px)",
                }}
              >
                {item}
              </span>
            ))}

            <header
              style={{
                position: "sticky",
                top: 0,
                zIndex: 3,
                padding: "12px 22px",
                background: "rgba(255,255,255,.94)",
                borderBottom: "1px solid rgba(226,232,240,.8)",
                backdropFilter: "blur(16px)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 30 }}>{theme.emoji}</span>
                <div>
                  <strong style={{ display: "block", color: theme.accent }}>Atenas IA Lab</strong>
                  <small style={{ color: "#64748b" }}>Grupo {groupId} · Demo de exposición</small>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={browserFullscreen} style={{ border: "1px solid #cbd5e1", borderRadius: 12, background: "white", width: 44, height: 44, display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="Pantalla completa"><Maximize2 size={18} /></button>
                <button type="button" onClick={() => setOpen(false)} style={{ border: 0, borderRadius: 12, background: "#111827", color: "white", width: 44, height: 44, display: "grid", placeItems: "center", cursor: "pointer" }} aria-label="Cerrar"><X size={20} /></button>
              </div>
            </header>

            <main style={{ position: "relative", zIndex: 1, maxWidth: 1380, margin: "0 auto", padding: "34px 22px 54px" }}>
              <section style={{ textAlign: "center", color: "white", marginBottom: 26 }}>
                <div style={{ fontSize: 54, marginBottom: 6 }}>{theme.emoji}</div>
                <h1 style={{ margin: 0, fontSize: "clamp(34px,5vw,66px)", lineHeight: 1.02, textShadow: "0 3px 18px rgba(15,23,42,.3)" }}>{displayName}</h1>
                <div style={{ margin: "10px auto 0", fontSize: "clamp(17px,2vw,25px)", fontWeight: 800, opacity: .94 }}>{theme.tagline}</div>
                <p style={{ maxWidth: 760, margin: "10px auto 0", opacity: .85, lineHeight: 1.5 }}>
                  Entrada → modelo → resultado. Esta pantalla está pensada para una demostración corta, clara y llamativa durante la exposición.
                </p>
              </section>

              <Panel style={{ padding: "clamp(16px,2.5vw,30px)", background: "rgba(255,255,255,.95)" }}>
                <Experience groupId={groupId} projectName={projectName} prototypeUrl={prototypeUrl} theme={theme} />
              </Panel>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
