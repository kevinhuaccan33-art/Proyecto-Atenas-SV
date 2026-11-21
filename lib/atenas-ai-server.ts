import { env } from "cloudflare:workers";

type SecretStoreBinding = { get(): Promise<string> };
type SecretSource = string | SecretStoreBinding;

type Bindings = {
  SUPABASE_SECRET_KEY?: SecretSource;
  SUPABASE_SERVICE_ROLE_KEY?: SecretSource;
  OPENAI_API_KEY?: SecretSource;
};

export type SessionProfile = {
  userId: string;
  role: string;
  groupId: number | null;
  active: boolean;
};

export type AiStatus = {
  enabled: boolean;
  globalEnabled: boolean;
  groupEnabled: boolean;
  dailyLimit: number;
  used: number;
  remaining: number;
  cooldownSeconds: number;
  retryAfter: number;
  usageDate: string;
};

export const SUPABASE_URL = "https://ozmkqjhqgakqttrhatfn.supabase.co";

async function resolveSecret(source: SecretSource | undefined, fallbackName: string) {
  if (typeof source === "string" && source.trim()) return source.trim();
  if (source && typeof source === "object" && typeof source.get === "function") {
    const value = await source.get();
    if (value?.trim()) return value.trim();
  }

  const processValue = process.env[fallbackName];
  if (processValue?.trim()) return processValue.trim();
  return "";
}

export async function getSupabaseSecret() {
  const bindings = env as unknown as Bindings;
  const value =
    (await resolveSecret(bindings.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY")) ||
    (await resolveSecret(bindings.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"));

  if (!value) {
    throw new Error("Falta SUPABASE_SECRET_KEY en los secretos de Cloudflare.");
  }
  return value;
}

export async function getOpenAiKey() {
  const bindings = env as unknown as Bindings;
  const value = await resolveSecret(bindings.OPENAI_API_KEY, "OPENAI_API_KEY");
  if (!value) {
    throw new Error("Falta OPENAI_API_KEY en los secretos de Cloudflare.");
  }
  return value;
}

export async function parseError(response: Response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return data?.message || data?.msg || data?.error_description || data?.error?.message || data?.error || text;
  } catch {
    return text || `Error ${response.status}`;
  }
}

export async function adminFetch(path: string, init: RequestInit = {}) {
  const secret = await getSupabaseSecret();
  const headers = new Headers(init.headers);
  headers.set("apikey", secret);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}${path}`, {
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Supabase tardó demasiado en responder.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
  if (!response.ok) throw new Error(await parseError(response));
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function requireSession(request: Request): Promise<SessionProfile> {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Sesión no válida.");

  const token = authorization.slice(7);
  const secret = await getSupabaseSecret();
  const authController = new AbortController();
  const authTimeoutId = setTimeout(() => authController.abort(), 12000);

  let userResponse: Response;
  try {
    userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: secret, Authorization: `Bearer ${token}` },
      signal: authController.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Supabase tardó demasiado en validar la sesión.");
    }
    throw error;
  } finally {
    clearTimeout(authTimeoutId);
  }
  if (!userResponse.ok) throw new Error("La sesión expiró. Vuelve a iniciar sesión.");

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("No se pudo identificar al usuario.");

  const rows = (await adminFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,group_id,active`,
    { method: "GET" }
  )) as Array<{ role?: string; group_id?: number | null; active?: boolean }>;

  const profile = rows?.[0];
  if (!profile?.active) throw new Error("La cuenta está deshabilitada.");

  return {
    userId: user.id,
    role: String(profile.role || ""),
    groupId: profile.group_id == null ? null : Number(profile.group_id),
    active: Boolean(profile.active),
  };
}

export async function requireProfessor(request: Request) {
  const profile = await requireSession(request);
  if (profile.role !== "admin") throw new Error("Solo el profesor administrador puede cambiar esta configuración.");
  return profile;
}

function limaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

async function getGlobalSettings() {
  const rows = (await adminFetch(
    "/rest/v1/ai_settings?id=eq.1&select=id,global_enabled,default_daily_limit,cooldown_seconds",
    { method: "GET" }
  )) as Array<{
    global_enabled?: boolean;
    default_daily_limit?: number;
    cooldown_seconds?: number;
  }>;

  return rows?.[0] ?? { global_enabled: false, default_daily_limit: 10, cooldown_seconds: 8 };
}

async function getGroupSettings(groupId: number) {
  const rows = (await adminFetch(
    `/rest/v1/ai_group_settings?group_id=eq.${groupId}&select=group_id,enabled,daily_limit`,
    { method: "GET" }
  )) as Array<{ enabled?: boolean; daily_limit?: number | null }>;
  return rows?.[0] ?? null;
}

async function getUsage(groupId: number, usageDate = limaDate()) {
  const rows = (await adminFetch(
    `/rest/v1/ai_usage?group_id=eq.${groupId}&usage_date=eq.${usageDate}&select=count,last_used_at`,
    { method: "GET" }
  )) as Array<{ count?: number; last_used_at?: string | null }>;
  return rows?.[0] ?? null;
}

export async function getAiStatus(groupId: number): Promise<AiStatus> {
  const [globalSettings, groupSettings] = await Promise.all([
    getGlobalSettings(),
    getGroupSettings(groupId),
  ]);

  const usageDate = limaDate();
  const usage = await getUsage(groupId, usageDate);
  const globalEnabled = Boolean(globalSettings.global_enabled);
  const groupEnabled = groupSettings?.enabled !== false;
  const dailyLimit = Math.max(
    0,
    Number(groupSettings?.daily_limit ?? globalSettings.default_daily_limit ?? 10)
  );
  const cooldownSeconds = Math.max(0, Number(globalSettings.cooldown_seconds ?? 8));
  const used = Math.max(0, Number(usage?.count ?? 0));

  let retryAfter = 0;
  if (usage?.last_used_at && cooldownSeconds > 0) {
    const elapsed = Math.floor((Date.now() - new Date(usage.last_used_at).getTime()) / 1000);
    retryAfter = Math.max(0, cooldownSeconds - elapsed);
  }

  return {
    enabled: globalEnabled && groupEnabled && used < dailyLimit,
    globalEnabled,
    groupEnabled,
    dailyLimit,
    used,
    remaining: Math.max(0, dailyLimit - used),
    cooldownSeconds,
    retryAfter,
    usageDate,
  };
}

export async function consumeAiUse(groupId: number) {
  const status = await getAiStatus(groupId);
  if (!status.globalEnabled) return { ...status, allowed: false, reason: "La inteligencia artificial está desactivada por el profesor." };
  if (!status.groupEnabled) return { ...status, allowed: false, reason: "La inteligencia artificial está desactivada para este proyecto." };
  if (status.used >= status.dailyLimit) return { ...status, allowed: false, reason: "Se alcanzó el límite diario de uso." };
  if (status.retryAfter > 0) return { ...status, allowed: false, reason: `Espera ${status.retryAfter} s antes de volver a consultar.` };

  const now = new Date().toISOString();
  const usage = await getUsage(groupId, status.usageDate);
  const nextCount = status.used + 1;

  if (usage) {
    await adminFetch(
      `/rest/v1/ai_usage?group_id=eq.${groupId}&usage_date=eq.${status.usageDate}`,
      {
        method: "PATCH",
        body: JSON.stringify({ count: nextCount, last_used_at: now }),
        headers: { Prefer: "return=minimal" },
      }
    );
  } else {
    await adminFetch("/rest/v1/ai_usage", {
      method: "POST",
      body: JSON.stringify({ group_id: groupId, usage_date: status.usageDate, count: 1, last_used_at: now }),
      headers: { Prefer: "return=minimal" },
    });
  }

  return {
    ...status,
    allowed: true,
    used: nextCount,
    remaining: Math.max(0, status.dailyLimit - nextCount),
    retryAfter: status.cooldownSeconds,
    reason: "",
  };
}

export async function refundAiUse(groupId: number) {
  try {
    const status = await getAiStatus(groupId);
    if (status.used <= 0) return;
    await adminFetch(
      `/rest/v1/ai_usage?group_id=eq.${groupId}&usage_date=eq.${status.usageDate}`,
      {
        method: "PATCH",
        body: JSON.stringify({ count: Math.max(0, status.used - 1) }),
        headers: { Prefer: "return=minimal" },
      }
    );
  } catch {
    // Reembolso de mejor esfuerzo si OpenAI falla.
  }
}
