"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BrainCircuit, Power, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase-browser";

type GroupConfig = {
  groupId: number;
  enabled: boolean;
  dailyLimit: number;
  used: number;
  lastUsedAt: string | null;
};

type Config = {
  globalEnabled: boolean;
  defaultDailyLimit: number;
  cooldownSeconds: number;
  usageDate: string;
  groups: GroupConfig[];
};

const NAMES: Record<number, string> = {
  1: "Scafe",
  2: "Innova Game IA",
  3: "SafeWalk",
  6: "Krono",
  7: "SeniorCare",
  10: "Videojuego 2D",
};

export default function AiControlPage() {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function token() {
    const supabase = await getSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function load() {
    setBusy(true);
    setNotice("");
    try {
      const accessToken = await token();
      if (!accessToken) throw new Error("Sesión no disponible.");
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 12000);

      let response: Response;
      try {
        response = await fetch("/api/admin/ai", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No se pudo cargar.");
      setConfig(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setNotice("La conexión con el servidor tardó demasiado. Revisa Supabase o vuelve a intentar.");
      } else {
        setNotice(error instanceof Error ? error.message : "No se pudo cargar la configuración.");
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const supabase = await getSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) {
          window.location.replace("/login");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role,active")
          .eq("id", user.id)
          .single();
        if (!profile?.active || profile.role !== "admin") {
          window.location.replace("/student");
          return;
        }
        if (mounted) {
          setReady(true);
          await load();
        }
      } catch {
        window.location.replace("/login");
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function save(next = config) {
    if (!next) return;
    setBusy(true);
    setNotice("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/admin/ai", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar.");
      setConfig(data);
      setNotice("✅ Configuración guardada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  function patchGroup(groupId: number, patch: Partial<GroupConfig>) {
    setConfig((current) => current ? {
      ...current,
      groups: current.groups.map((group) => group.groupId === groupId ? { ...group, ...patch } : group),
    } : current);
  }

  function setPreset(limit: number) {
    setConfig((current) => current ? {
      ...current,
      defaultDailyLimit: limit,
      groups: current.groups.map((group) => ({ ...group, dailyLimit: limit })),
    } : current);
  }

  const totalUsed = useMemo(
    () => config?.groups.reduce((sum, group) => sum + group.used, 0) ?? 0,
    [config]
  );
  const totalLimit = useMemo(
    () => config?.groups.reduce((sum, group) => sum + group.dailyLimit, 0) ?? 0,
    [config]
  );

  if (!ready) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Inter,Segoe UI,sans-serif", background: "#f5f6fb" }}>
        <strong>Verificando acceso del profesor...</strong>
      </main>
    );
  }

  if (!config) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter,Segoe UI,sans-serif", background: "#f5f6fb" }}>
        <section style={{ width: "min(620px,100%)", borderRadius: 24, padding: 26, background: "white", boxShadow: "0 18px 55px rgba(15,23,42,.10)", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 34 }}>⚠️</div>
          <h1 style={{ margin: "10px 0 6px", fontSize: 24 }}>No se pudo cargar el control de IA</h1>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
            {notice || (busy ? "Consultando la configuración..." : "El servidor no devolvió la configuración.")}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button
              type="button"
              onClick={load}
              disabled={busy}
              style={{ border: 0, borderRadius: 14, minHeight: 46, padding: "0 18px", background: "#6d28d9", color: "white", fontWeight: 900, cursor: "pointer" }}
            >
              {busy ? "Reintentando..." : "Reintentar"}
            </button>
            <a
              href="/"
              style={{ border: "1px solid #cbd5e1", borderRadius: 14, minHeight: 46, padding: "0 18px", background: "white", color: "#334155", fontWeight: 850, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Volver al panel
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f7f8fc,#eef2ff)", color: "#172033", fontFamily: "Inter,Aptos,Segoe UI,sans-serif", padding: "28px clamp(18px,4vw,54px) 60px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a href="/" style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: 14, background: "white", color: "#4f46e5", boxShadow: "0 8px 24px rgba(15,23,42,.08)" }}><ArrowLeft size={19} /></a>
            <div>
              <small style={{ color: "#6d28d9", fontWeight: 900, letterSpacing: .6 }}>ATENAS IA LAB · ADMIN</small>
              <h1 style={{ margin: "5px 0 0", fontSize: 32, letterSpacing: -.8 }}>Control de inteligencia artificial</h1>
              <p style={{ margin: "7px 0 0", color: "#64748b" }}>Activa, limita y supervisa el uso diario de los proyectos que utilizan consultas inteligentes.</p>
            </div>
          </div>
          <button onClick={load} disabled={busy} style={{ border: "1px solid #dbe2ea", borderRadius: 14, minHeight: 44, padding: "0 15px", background: "white", fontWeight: 850, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><RefreshCw size={17} /> Actualizar</button>
        </div>

        <section style={{ borderRadius: 28, padding: 24, background: "white", boxShadow: "0 18px 55px rgba(15,23,42,.09)", border: "1px solid rgba(148,163,184,.16)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px,1.2fr) repeat(2,minmax(180px,.6fr))", gap: 18, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 58, height: 58, borderRadius: 19, display: "grid", placeItems: "center", color: "white", background: config.globalEnabled ? "linear-gradient(135deg,#16a34a,#059669)" : "linear-gradient(135deg,#64748b,#475569)" }}><Power size={26} /></div>
              <div><strong style={{ display: "block", fontSize: 21 }}>Estado general</strong><span style={{ color: config.globalEnabled ? "#15803d" : "#64748b", fontWeight: 900 }}>{config.globalEnabled ? "🟢 IA ACTIVADA" : "🔴 IA DESACTIVADA"}</span></div>
            </div>
            <label><strong style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Límite diario predeterminado</strong><input type="number" min={0} max={500} value={config.defaultDailyLimit} onChange={(e) => setConfig({ ...config, defaultDailyLimit: Number(e.target.value) })} style={{ width: "100%", minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 13, padding: "0 12px", fontSize: 16 }} /></label>
            <label><strong style={{ display: "block", fontSize: 12, marginBottom: 6 }}>Espera entre consultas</strong><div style={{ position: "relative" }}><input type="number" min={0} max={300} value={config.cooldownSeconds} onChange={(e) => setConfig({ ...config, cooldownSeconds: Number(e.target.value) })} style={{ width: "100%", minHeight: 46, border: "1px solid #cbd5e1", borderRadius: 13, padding: "0 44px 0 12px", fontSize: 16 }} /><span style={{ position: "absolute", right: 12, top: 13, color: "#64748b", fontSize: 12 }}>seg</span></div></label>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
            {[5,10,30].map((limit) => <button key={limit} onClick={() => setPreset(limit)} style={{ border: "1px solid #ddd6fe", borderRadius: 999, background: config.defaultDailyLimit === limit ? "#6d28d9" : "#f5f3ff", color: config.defaultDailyLimit === limit ? "white" : "#6d28d9", padding: "8px 13px", fontWeight: 850, cursor: "pointer" }}>{limit === 5 ? "Modo clase · 5" : limit === 10 ? "Modo pruebas · 10" : "Modo exposición · 30"}</button>)}
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setConfig({ ...config, globalEnabled: !config.globalEnabled })} style={{ border: 0, borderRadius: 14, minHeight: 48, padding: "0 18px", background: config.globalEnabled ? "#fee2e2" : "#dcfce7", color: config.globalEnabled ? "#b91c1c" : "#166534", fontWeight: 900, cursor: "pointer" }}>{config.globalEnabled ? "Desactivar IA para todos" : "Activar IA para todos"}</button>
            <button onClick={() => save()} disabled={busy} style={{ border: 0, borderRadius: 14, minHeight: 48, padding: "0 20px", background: "linear-gradient(135deg,#6d28d9,#4f46e5)", color: "white", fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><Save size={18} /> Guardar cambios</button>
          </div>
          {notice && <div style={{ marginTop: 12, color: notice.startsWith("✅") ? "#047857" : "#b91c1c", fontWeight: 800 }}>{notice}</div>}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16, marginTop: 18 }}>
          {config.groups.map((group) => {
            const remaining = Math.max(0, group.dailyLimit - group.used);
            const percent = group.dailyLimit > 0 ? Math.min(100, (group.used / group.dailyLimit) * 100) : 100;
            return (
              <section key={group.groupId} style={{ borderRadius: 24, padding: 20, background: "white", boxShadow: "0 14px 38px rgba(15,23,42,.07)", border: "1px solid rgba(148,163,184,.16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div><small style={{ color: "#7c3aed", fontWeight: 900 }}>GRUPO {group.groupId}</small><strong style={{ display: "block", fontSize: 19, marginTop: 3 }}>{NAMES[group.groupId]}</strong></div>
                  <button onClick={() => patchGroup(group.groupId, { enabled: !group.enabled })} style={{ border: 0, borderRadius: 999, padding: "8px 12px", background: group.enabled ? "#dcfce7" : "#fee2e2", color: group.enabled ? "#166534" : "#b91c1c", fontWeight: 900, cursor: "pointer" }}>{group.enabled ? "🟢 ON" : "🔴 OFF"}</button>
                </div>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                  <div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}><span>Uso de hoy</span><strong>{group.used} / {group.dailyLimit}</strong></div><div style={{ height: 9, marginTop: 7, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${percent}%`, height: "100%", background: percent >= 90 ? "#dc2626" : "linear-gradient(90deg,#7c3aed,#4f46e5)" }} /></div></div>
                  <label><small style={{ display: "block", color: "#64748b", fontWeight: 800, marginBottom: 5 }}>Límite</small><input type="number" min={0} max={500} value={group.dailyLimit} onChange={(e) => patchGroup(group.groupId, { dailyLimit: Number(e.target.value) })} style={{ width: 82, minHeight: 40, border: "1px solid #cbd5e1", borderRadius: 11, padding: "0 9px", fontWeight: 850 }} /></label>
                </div>
                <div style={{ marginTop: 12, borderRadius: 13, padding: 10, background: "#f8fafc", color: "#475569", fontSize: 12 }}><ShieldCheck size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />Quedan <strong>{remaining}</strong> usos hoy. Reinicio diario según horario de Lima.</div>
              </section>
            );
          })}
        </div>

        <section style={{ marginTop: 18, borderRadius: 24, padding: 20, background: "#111827", color: "white" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><BrainCircuit size={23} /><div><strong style={{ fontSize: 18 }}>Resumen de hoy</strong><div style={{ color: "#cbd5e1", marginTop: 3 }}>{totalUsed} usos realizados de {totalLimit} disponibles entre todos los proyectos.</div></div></div>
        </section>
      </div>
    </main>
  );
}
