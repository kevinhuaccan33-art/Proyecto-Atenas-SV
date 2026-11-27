"use client";

import { useMemo, useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

type DemoTheme = {
  accent: string;
  accent2: string;
  soft: string;
  image: string;
};

type DemoProps = {
  groupId: number;
  projectName?: string | null;
  theme: DemoTheme;
};

const field: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  border: "1px solid #cbd5e1",
  borderRadius: 13,
  padding: "0 13px",
  background: "white",
  color: "#172033",
};

const button: React.CSSProperties = {
  minHeight: 46,
  border: 0,
  borderRadius: 13,
  padding: "0 16px",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 18,
        background: "white",
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 34px rgba(15,23,42,.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

async function askAI(groupId: number, message: string, context: Record<string, unknown>) {
  try {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return "";

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId, message, context }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return "";
    return String(payload.text || "");
  } catch {
    return "";
  }
}

export function InnovaCreativeDemo({ theme }: DemoProps) {
  const [idea, setIdea] = useState("Un juego de aventura en una isla misteriosa");
  const [genre, setGenre] = useState("aventura");
  const [audience, setAudience] = useState("adolescentes");
  const [aiText, setAiText] = useState("");
  const [busy, setBusy] = useState(false);

  const proposal = useMemo(() => {
    const seed = idea.trim() || "Una aventura";
    return {
      character:
        genre === "terror"
          ? "Explorador que escucha ecos del futuro"
          : genre === "estrategia"
          ? "Comandante que puede alterar una regla por turno"
          : "Protagonista que transforma objetos del entorno",
      world:
        genre === "carreras"
          ? "Circuitos que cambian según decisiones del jugador"
          : "Mundo dividido en zonas con reglas visuales y desafíos diferentes",
      mechanic:
        genre === "deportes"
          ? "Combinar jugadas para desbloquear habilidades de equipo"
          : "Resolver retos modificando el entorno en lugar de repetir combates",
      twist:
        seed + " cambia según las decisiones del jugador, para evitar una experiencia lineal.",
    };
  }, [idea, genre]);

  async function generate() {
    setBusy(true);
    const response = await askAI(
      2,
      "Propón una mejora creativa y breve para esta idea de videojuego: " + idea,
      { genero: genre, publico: audience, propuestaLocal: proposal }
    );
    setAiText(
      response ||
        "La IA está desactivada o alcanzó su límite. La propuesta local sigue disponible para la demostración."
    );
    setBusy(false);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card style={{ background: "linear-gradient(135deg,#fff," + theme.soft + ")" }}>
        <small style={{ color: theme.accent, fontWeight: 950 }}>INNOVA GAME IA · ASISTENTE CREATIVO</small>
        <h3 style={{ margin: "7px 0 6px", fontSize: 25 }}>Transforma una idea común en una propuesta más original</h3>
        <p style={{ margin: "0 0 14px", color: "#64748b" }}>
          El Canvas plantea personajes, historias, escenarios y mecánicas; por eso la demo ahora trabaja con esos elementos.
        </p>

        <textarea
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          rows={3}
          style={{ ...field, padding: 13, resize: "vertical" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginTop: 10 }}>
          <select value={genre} onChange={(event) => setGenre(event.target.value)} style={field}>
            <option value="aventura">Aventura</option>
            <option value="terror">Terror</option>
            <option value="estrategia">Estrategia</option>
            <option value="carreras">Carreras</option>
            <option value="deportes">Deportes</option>
          </select>
          <select value={audience} onChange={(event) => setAudience(event.target.value)} style={field}>
            <option value="niños">Niños</option>
            <option value="adolescentes">Adolescentes</option>
            <option value="general">Público general</option>
          </select>
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            style={{ ...button, background: "linear-gradient(135deg," + theme.accent + "," + theme.accent2 + ")" }}
          >
            <Sparkles size={17} /> {busy ? "Creando..." : "Mejorar idea"}
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
        {[
          ["🧑", "Personaje", proposal.character],
          ["🌍", "Escenario", proposal.world],
          ["⚙️", "Mecánica", proposal.mechanic],
          ["✨", "Giro creativo", proposal.twist],
        ].map(([icon, title, description]) => (
          <Card key={title}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <strong style={{ display: "block", marginTop: 8 }}>{title}</strong>
            <p style={{ color: "#64748b", lineHeight: 1.45, fontSize: 13 }}>{description}</p>
          </Card>
        ))}
      </div>

      <Card style={{ background: theme.soft }}>
        <strong style={{ color: theme.accent }}>🤖 Sugerencia inteligente</strong>
        <p style={{ marginBottom: 0, lineHeight: 1.55 }}>
          {aiText || "Pulsa “Mejorar idea” para obtener una sugerencia. La IA apoya la creatividad; no reemplaza la decisión del creador."}
        </p>
      </Card>
    </div>
  );
}

export function DragonRobloxDemo({ theme }: DemoProps) {
  const [distance, setDistance] = useState(70);
  const [stealth, setStealth] = useState(75);
  const [lineOfSight, setLineOfSight] = useState(false);
  const [eggTouched, setEggTouched] = useState(false);
  const [advice, setAdvice] = useState("");
  const [busy, setBusy] = useState(false);

  const state = eggTouched
    ? { label: "PERSECUCIÓN / ATAQUE", color: "#dc2626", icon: "🐉" }
    : distance < 35 && (lineOfSight || stealth < 55)
    ? { label: "ALERTA / BÚSQUEDA", color: "#d97706", icon: "👁️" }
    : { label: "PATRULLAJE / REPOSO", color: "#16a34a", icon: "🛡️" };

  async function getAdvice() {
    setBusy(true);
    const response = await askAI(
      10,
      "Da una recomendación corta para el jugador según el estado del dragón.",
      { distance, stealth, lineOfSight, eggTouched, state: state.label }
    );
    setAdvice(
      response ||
        (state.label.includes("ATAQUE")
          ? "Aléjate del nido y busca cobertura antes de volver a intentarlo."
          : state.label.includes("ALERTA")
          ? "Reduce el movimiento y rompe la línea de visión."
          : "Aprovecha el patrullaje para planear una ruta con mayor sigilo.")
    );
    setBusy(false);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card
        style={{
          minHeight: 300,
          background:
            "linear-gradient(90deg,rgba(15,23,42,.92),rgba(15,23,42,.55)),url(" +
            theme.image +
            ") center/cover",
          color: "white",
        }}
      >
        <small style={{ color: "#fde68a", fontWeight: 950 }}>ROBLOX · NIDO DEL DRAGÓN</small>
        <h3 style={{ fontSize: 30, margin: "8px 0" }}>IA del dragón guardián</h3>
        <p style={{ maxWidth: 700, color: "#e2e8f0", lineHeight: 1.5 }}>
          El dataset del grupo define tres estados: Patrullaje, Alerta y Persecución/Ataque. Cambia las variables y observa la reacción.
        </p>

        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          <label>
            <strong>Distancia al huevo: {distance} m</strong>
            <input type="range" min="0" max="100" value={distance} onChange={(e) => setDistance(Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label>
            <strong>Sigilo: {stealth}%</strong>
            <input type="range" min="0" max="100" value={stealth} onChange={(e) => setStealth(Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label style={{ display: "grid", alignContent: "center", gap: 8 }}>
            <span>👁️ Línea de visión</span>
            <input type="checkbox" checked={lineOfSight} onChange={(e) => setLineOfSight(e.target.checked)} />
          </label>
          <label style={{ display: "grid", alignContent: "center", gap: 8 }}>
            <span>🥚 Tocó el huevo</span>
            <input type="checkbox" checked={eggTouched} onChange={(e) => setEggTouched(e.target.checked)} />
          </label>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,.8fr) minmax(0,1.2fr)", gap: 14 }}>
        <Card style={{ border: "2px solid " + state.color + "55" }}>
          <div style={{ fontSize: 38 }}>{state.icon}</div>
          <small style={{ color: "#64748b", fontWeight: 900 }}>ESTADO ACTUAL</small>
          <strong style={{ display: "block", marginTop: 6, fontSize: 24, color: state.color }}>{state.label}</strong>
          <p style={{ color: "#64748b", lineHeight: 1.45 }}>
            Esta clasificación usa las variables que el grupo definió para su dataset de Roblox Studio.
          </p>
        </Card>

        <Card>
          <button
            type="button"
            onClick={getAdvice}
            disabled={busy}
            style={{ ...button, background: "linear-gradient(135deg," + theme.accent + "," + theme.accent2 + ")" }}
          >
            <BrainCircuit size={17} /> {busy ? "Analizando..." : "Pedir estrategia"}
          </button>
          <p style={{ marginBottom: 0, lineHeight: 1.55 }}>
            {advice || "La recomendación aparecerá aquí. El juego sigue funcionando aunque la IA esté apagada."}
          </p>
        </Card>
      </div>
    </div>
  );
}

export function FoodAidDemo({ theme }: DemoProps) {
  const [zone, setZone] = useState("Zona alejada de Lima Norte");
  const [families, setFamilies] = useState(24);
  const [kilos, setKilos] = useState(180);
  const [campaign, setCampaign] = useState(0);

  const kgPerFamily = families > 0 ? kilos / families : 0;
  const phrases = [
    "Un pequeño aporte puede acercar bienestar a una familia.",
    "Más allá del camino, la solidaridad también llega.",
    "Compartir alimentos es acercar oportunidades.",
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card style={{ background: "linear-gradient(135deg,#fff7ed,#fff)" }}>
        <small style={{ color: theme.accent, fontWeight: 950 }}>MÁS ALLÁ DEL CAMINO</small>
        <h3 style={{ fontSize: 26, margin: "7px 0" }}>Planificador de campaña alimentaria</h3>
        <p style={{ color: "#64748b" }}>
          El Canvas del grupo propone campañas, formularios, organización de donaciones y apoyo creativo para los carteles.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
          <input value={zone} onChange={(e) => setZone(e.target.value)} style={field} />
          <input type="number" min="1" value={families} onChange={(e) => setFamilies(Number(e.target.value))} style={field} />
          <input type="number" min="0" value={kilos} onChange={(e) => setKilos(Number(e.target.value))} style={field} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <Card><small>FAMILIAS</small><strong style={{ display: "block", fontSize: 30 }}>{families}</strong></Card>
        <Card><small>ALIMENTOS DISPONIBLES</small><strong style={{ display: "block", fontSize: 30 }}>{kilos} kg</strong></Card>
        <Card><small>DISTRIBUCIÓN ORIENTATIVA</small><strong style={{ display: "block", fontSize: 30 }}>{kgPerFamily.toFixed(1)} kg</strong><span>por familia</span></Card>
      </div>

      <Card style={{ background: theme.soft }}>
        <strong style={{ color: theme.accent }}>📣 Idea de cartel / campaña</strong>
        <p style={{ fontSize: 20, lineHeight: 1.45 }}>{phrases[campaign % phrases.length]}</p>
        <button type="button" onClick={() => setCampaign((value) => value + 1)} style={{ ...button, background: theme.accent }}>
          <Sparkles size={17} /> Otra frase
        </button>
        <p style={{ color: "#64748b", fontSize: 12, marginBottom: 0 }}>
          Zona de demostración: {zone}. La herramienta apoya la difusión; la entrega real requiere organización humana.
        </p>
      </Card>
    </div>
  );
}

export function LexiScanDemo({ theme }: DemoProps) {
  const [text, setText] = useState(
    "La inteligencia artificial puede apoyar el aprendizaje, pero sus resultados deben revisarse de manera crítica."
  );
  const [result, setResult] = useState<null | {
    score: number;
    label: string;
    detail: string;
  }>(null);

  function analyze() {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text
      .split(/[.!?]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    const lengths = sentences.map((sentence) => sentence.split(/\s+/).length);
    const average = lengths.length
      ? lengths.reduce((sum, value) => sum + value, 0) / lengths.length
      : 0;
    const variance = lengths.length
      ? lengths.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / lengths.length
      : 0;
    const unique = new Set(words.map((word) => word.toLowerCase().replace(/[^a-záéíóúñ]/gi, ""))).size;
    const lexical = words.length ? unique / words.length : 0;

    let score = 50;
    if (words.length > 80) score += 7;
    if (variance < 12 && sentences.length >= 3) score += 12;
    if (lexical < .55 && words.length > 40) score += 8;
    if (/[;:]/.test(text)) score += 3;
    if (/\b(yo|me|mi|recuerdo|pienso|creo)\b/i.test(text)) score -= 12;
    score = Math.max(15, Math.min(85, Math.round(score)));

    setResult({
      score,
      label: score >= 60 ? "Patrones más regulares / sintéticos" : "Patrones más variables / humanos",
      detail:
        "Se revisaron longitud de oraciones, variación y diversidad de vocabulario. Es una estimación experimental, no una prueba de autoría.",
    });
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card style={{ background: "linear-gradient(135deg,#fff," + theme.soft + ")" }}>
        <small style={{ color: theme.accent, fontWeight: 950 }}>LEXISCAN AI · PROTOTIPO EXPERIMENTAL</small>
        <h3 style={{ fontSize: 26, margin: "7px 0" }}>Analiza patrones de un texto</h3>
        <p style={{ color: "#64748b" }}>
          El Canvas busca distinguir textos humanos y generados por IA. La demo presenta una estimación y explica sus límites.
        </p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} style={{ ...field, padding: 14, resize: "vertical" }} />
        <button type="button" onClick={analyze} style={{ ...button, background: "linear-gradient(135deg," + theme.accent + "," + theme.accent2 + ")", marginTop: 10 }}>
          <BrainCircuit size={17} /> Analizar patrones
        </button>
      </Card>

      {result && (
        <Card>
          <small style={{ color: "#64748b", fontWeight: 900 }}>ESTIMACIÓN</small>
          <strong style={{ display: "block", fontSize: 24, marginTop: 7 }}>{result.label}</strong>
          <div style={{ margin: "14px 0", height: 12, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
            <div style={{ width: result.score + "%", height: "100%", background: "linear-gradient(90deg," + theme.accent2 + "," + theme.accent + ")" }} />
          </div>
          <strong>{result.score}% de regularidad detectada</strong>
          <p style={{ color: "#64748b", lineHeight: 1.5 }}>{result.detail}</p>
          <div style={{ borderRadius: 14, padding: 12, background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
            ⚠️ No debe usarse para acusar o sancionar a una persona. Los detectores de texto pueden equivocarse.
          </div>
        </Card>
      )}
    </div>
  );
}

export function CanvasAlignedExtras({ groupId, theme }: DemoProps) {
  if (groupId === 1) return <ScafeExtras theme={theme} />;
  if (groupId === 4) return <ManosLabExtras theme={theme} />;
  if (groupId === 5) return <LostObjectExtras theme={theme} />;
  if (groupId === 6) return <KronoQuizExtras theme={theme} />;
  if (groupId === 7) return <AdaExtras theme={theme} />;
  if (groupId === 8) return <EcoDetectExtras theme={theme} />;
  if (groupId === 9) return <EcoAlertaExtras theme={theme} />;
  return null;
}

function ScafeExtras({ theme }: { theme: DemoTheme }) {
  const [help, setHelp] = useState(false);
  return (
    <Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <div><small>HORARIO DE DEMO</small><strong style={{ display: "block", marginTop: 5 }}>07:30–17:00</strong></div>
        <div><small>DISPONIBILIDAD</small><strong style={{ display: "block", marginTop: 5, color: "#15803d" }}>● Menú disponible</strong></div>
        <div><small>ATENCIÓN HUMANA</small><button type="button" onClick={() => setHelp(true)} style={{ ...button, background: theme.accent, marginTop: 6 }}>Solicitar ayuda</button></div>
      </div>
      {help && <p style={{ marginBottom: 0, color: "#475569" }}>✅ Un trabajador fue notificado. La IA orienta, pero no reemplaza la atención humana.</p>}
    </Card>
  );
}

function ManosLabExtras({ theme }: { theme: DemoTheme }) {
  const [lesson, setLesson] = useState(0);
  const steps = [
    ["1", "Aprender", "Observa una seña o letra del abecedario."],
    ["2", "Practicar", "Imítala y usa la cámara para comprobar el reconocimiento."],
    ["3", "Prueba", "Realiza varias señas sin ayuda visual."],
    ["4", "Reforzar", "Si falla, vuelve a la práctica antes de avanzar."],
  ];
  return (
    <Card style={{ background: "linear-gradient(135deg,#fff," + theme.soft + ")" }}>
      <small style={{ color: theme.accent, fontWeight: 950 }}>MANOSLAB · RUTA DE APRENDIZAJE</small>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 12 }}>
        {steps.map(([n, title, description], index) => (
          <button key={title} type="button" onClick={() => setLesson(index)} style={{ border: lesson === index ? "2px solid " + theme.accent : "1px solid #e2e8f0", borderRadius: 18, padding: 14, background: "white", textAlign: "left", cursor: "pointer" }}>
            <span style={{ color: theme.accent, fontWeight: 950 }}>{n}</span>
            <strong style={{ display: "block", marginTop: 6 }}>{title}</strong>
            <small style={{ color: "#64748b", lineHeight: 1.4 }}>{description}</small>
          </button>
        ))}
      </div>
    </Card>
  );
}

function LostObjectExtras({ theme }: { theme: DemoTheme }) {
  const [category, setCategory] = useState("mochila");
  const [color, setColor] = useState("negro");
  const [place, setPlace] = useState("patio");
  const reports = [
    { category: "mochila", color: "negro", place: "patio", label: "Mochila negra encontrada", base: 94 },
    { category: "celular", color: "azul", place: "aula", label: "Celular azul encontrado", base: 91 },
    { category: "llaves", color: "plata", place: "biblioteca", label: "Llavero plateado", base: 88 },
  ];
  const ranked = reports
    .map((report) => ({
      ...report,
      score:
        report.base -
        (report.category === category ? 0 : 28) -
        (report.color === color ? 0 : 12) -
        (report.place === place ? 0 : 9),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <Card>
      <small style={{ color: theme.accent, fontWeight: 950 }}>C&S · EMPAREJAMIENTO DE REPORTES</small>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 10 }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={field}><option value="mochila">Mochila</option><option value="celular">Celular</option><option value="llaves">Llaves</option></select>
        <select value={color} onChange={(e) => setColor(e.target.value)} style={field}><option value="negro">Negro</option><option value="azul">Azul</option><option value="plata">Plata</option></select>
        <select value={place} onChange={(e) => setPlace(e.target.value)} style={field}><option value="patio">Patio</option><option value="aula">Aula</option><option value="biblioteca">Biblioteca</option></select>
      </div>
      <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
        {ranked.map((report, index) => (
          <div key={report.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 11, borderRadius: 14, background: index === 0 ? theme.soft : "#f8fafc" }}>
            <span>{index === 0 ? "✨ " : ""}{report.label}</span>
            <strong style={{ color: index === 0 ? theme.accent : "#475569" }}>{Math.max(20, report.score)}% coincidencia</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KronoQuizExtras({ theme }: { theme: DemoTheme }) {
  const [topic, setTopic] = useState("Fracciones");
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = selected === "3/4";
  return (
    <Card style={{ background: "linear-gradient(135deg,#fff," + theme.soft + ")" }}>
      <small style={{ color: theme.accent, fontWeight: 950 }}>KRONO IA · REFUERZO</small>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginTop: 10 }}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} style={field} />
        <div>
          <strong>Mini cuestionario sobre {topic}</strong>
          <p style={{ color: "#64748b" }}>Si una pizza tiene 4 partes y comes 3, ¿qué fracción comiste?</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["1/4", "2/4", "3/4"].map((option) => (
              <button key={option} type="button" onClick={() => { setSelected(option); setChecked(false); }} style={{ border: selected === option ? "2px solid " + theme.accent : "1px solid #cbd5e1", borderRadius: 12, padding: "8px 12px", background: "white", cursor: "pointer" }}>{option}</button>
            ))}
            <button type="button" onClick={() => setChecked(true)} style={{ ...button, background: theme.accent }}>Comprobar</button>
          </div>
          {checked && <p style={{ color: correct ? "#15803d" : "#b91c1c", fontWeight: 850 }}>{correct ? "✅ Correcto · avance de práctica registrado" : "🔄 Repasa el tema y vuelve a intentarlo"}</p>}
        </div>
      </div>
    </Card>
  );
}

function AdaExtras({ theme }: { theme: DemoTheme }) {
  const routine = [
    ["08:00", "💊 Medicación registrada", "Según indicación previamente cargada por el cuidador"],
    ["10:30", "💧 Hidratación", "Recordatorio de agua"],
    ["16:00", "🚶 Caminata suave", "Actividad de bienestar"],
    ["19:00", "📞 Llamada familiar", "Acompañamiento y rutina"],
  ];
  return (
    <Card>
      <small style={{ color: theme.accent, fontWeight: 950 }}>ADA · ASISTENTE DE WISE HEARTS</small>
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {routine.map(([time, title, description]) => (
          <div key={time} style={{ display: "grid", gridTemplateColumns: "75px 1fr", gap: 12, padding: 11, borderRadius: 14, background: "#f8fafc" }}>
            <strong style={{ color: theme.accent }}>{time}</strong>
            <div><strong>{title}</strong><small style={{ display: "block", color: "#64748b", marginTop: 3 }}>{description}</small></div>
          </div>
        ))}
      </div>
      <p style={{ marginBottom: 0, color: "#9a3412", fontSize: 12 }}>Ada recuerda información ya registrada; no receta, diagnostica ni modifica dosis.</p>
    </Card>
  );
}

function EcoDetectExtras({ theme }: { theme: DemoTheme }) {
  const [kind, setKind] = useState("suelo");
  const advice: Record<string, string> = {
    suelo: "Retirar residuos de forma segura, separar materiales y evitar quemarlos.",
    aire: "Identificar la fuente de humo y reducir exposición; la demo no mide calidad real del aire.",
    agua: "No manipular agua contaminada sin protección y reportar la fuente a un adulto o autoridad.",
  };
  return (
    <Card>
      <small style={{ color: theme.accent, fontWeight: 950 }}>ECODETECT · RECOMENDACIÓN DE CUIDADO</small>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, marginTop: 10 }}>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={field}><option value="suelo">Contaminación del suelo</option><option value="aire">Contaminación del aire</option><option value="agua">Contaminación del agua</option></select>
        <div style={{ borderRadius: 14, padding: 13, background: theme.soft }}><strong>Recomendación:</strong> {advice[kind]}</div>
      </div>
    </Card>
  );
}

function EcoAlertaExtras({ theme }: { theme: DemoTheme }) {
  const bins = [
    ["Plástico", "♻️ Contenedor de reciclables limpios"],
    ["Papel/Cartón", "📦 Mantener seco y limpio"],
    ["Metal", "🥫 Separar y, si es posible, compactar"],
    ["Vidrio", "🫙 Depositar con cuidado en punto autorizado"],
    ["No reciclable", "🗑️ Residuo común"],
  ];
  return (
    <Card>
      <small style={{ color: theme.accent, fontWeight: 950 }}>ECOALERTA · GUÍA DE CLASIFICACIÓN</small>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 8, marginTop: 10 }}>
        {bins.map(([name, description]) => (
          <div key={name} style={{ borderRadius: 14, padding: 12, background: "#f8fafc" }}><strong>{name}</strong><small style={{ display: "block", marginTop: 4, color: "#64748b" }}>{description}</small></div>
        ))}
      </div>
    </Card>
  );
}
