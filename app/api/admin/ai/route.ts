import {
  adminFetch,
  requireProfessor,
} from "@/lib/atenas-ai-server";

const AI_GROUPS = [1, 2, 3, 6, 7, 10];

async function loadConfig() {
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const pick = (type: string) => todayParts.find((part) => part.type === type)?.value || "";
  const today = `${pick("year")}-${pick("month")}-${pick("day")}`;

  const [settingsRows, groupRows, usageRows] = await Promise.all([
    adminFetch(
      "/rest/v1/ai_settings?id=eq.1&select=id,global_enabled,default_daily_limit,cooldown_seconds,updated_at",
      { method: "GET" }
    ),
    adminFetch(
      `/rest/v1/ai_group_settings?group_id=in.(${AI_GROUPS.join(",")})&select=group_id,enabled,daily_limit&order=group_id.asc`,
      { method: "GET" }
    ),
    adminFetch(
      `/rest/v1/ai_usage?usage_date=eq.${today}&group_id=in.(${AI_GROUPS.join(",")})&select=group_id,count,last_used_at&order=group_id.asc`,
      { method: "GET" }
    ),
  ]);

  const settings = (settingsRows as any[])?.[0] ?? {
    global_enabled: false,
    default_daily_limit: 10,
    cooldown_seconds: 8,
  };

  const groupMap = new Map<number, any>((groupRows as any[] ?? []).map((row) => [Number(row.group_id), row]));
  const usageMap = new Map<number, any>((usageRows as any[] ?? []).map((row) => [Number(row.group_id), row]));

  return {
    globalEnabled: Boolean(settings.global_enabled),
    defaultDailyLimit: Number(settings.default_daily_limit ?? 10),
    cooldownSeconds: Number(settings.cooldown_seconds ?? 8),
    usageDate: today,
    groups: AI_GROUPS.map((groupId) => ({
      groupId,
      enabled: groupMap.get(groupId)?.enabled !== false,
      dailyLimit: Number(groupMap.get(groupId)?.daily_limit ?? settings.default_daily_limit ?? 10),
      used: Number(usageMap.get(groupId)?.count ?? 0),
      lastUsedAt: usageMap.get(groupId)?.last_used_at ?? null,
    })),
  };
}

export async function GET(request: Request) {
  try {
    await requireProfessor(request);
    return Response.json(await loadConfig());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo cargar la configuración." },
      { status: 403 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireProfessor(request);
    const body = (await request.json()) as {
      globalEnabled?: boolean;
      defaultDailyLimit?: number;
      cooldownSeconds?: number;
      groups?: Array<{ groupId: number; enabled?: boolean; dailyLimit?: number }>;
    };

    const defaultDailyLimit = Math.max(0, Math.min(500, Number(body.defaultDailyLimit ?? 10)));
    const cooldownSeconds = Math.max(0, Math.min(300, Number(body.cooldownSeconds ?? 8)));

    await adminFetch("/rest/v1/ai_settings?id=eq.1", {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        global_enabled: Boolean(body.globalEnabled),
        default_daily_limit: defaultDailyLimit,
        cooldown_seconds: cooldownSeconds,
        updated_at: new Date().toISOString(),
      }),
    });

    for (const item of body.groups ?? []) {
      const groupId = Number(item.groupId);
      if (!AI_GROUPS.includes(groupId)) continue;
      const dailyLimit = Math.max(0, Math.min(500, Number(item.dailyLimit ?? defaultDailyLimit)));
      await adminFetch("/rest/v1/ai_group_settings?on_conflict=group_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          group_id: groupId,
          enabled: item.enabled !== false,
          daily_limit: dailyLimit,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    return Response.json(await loadConfig());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar la configuración." },
      { status: 400 }
    );
  }
}
