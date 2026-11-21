import {
  consumeAiUse,
  getAiStatus,
  getOpenAiKey,
  parseError,
  refundAiUse,
  requireSession,
} from "@/lib/atenas-ai-server";

const SUPPORTED_GROUPS = new Set([1, 2, 3, 6, 7, 10]);

const PROMPTS: Record<number, string> = {
  1: `Eres el asistente de Scafe, una cafetería escolar ficticia usada en una demostración educativa. Responde en español, breve, amable y concreto. Solo usa este menú de demostración: Espresso S/ 6.00, Americano S/ 7.00, Cappuccino S/ 8.50, Croissant S/ 4.50, Pan artesanal S/ 3.50, Sandwich S/ 9.00, Combo Café + Pan S/ 10.50. Puedes sugerir combinaciones y explicar el pedido, pero nunca inventes precios ni productos fuera de esta lista. Máximo 80 palabras.`,
  2: `Eres el recomendador de Innova Game IA, un proyecto escolar relacionado con experiencias y mapas que luego pueden desarrollarse en Roblox Studio. Responde en español, máximo 90 palabras. Usa únicamente estas opciones de demostración: Aventura del Castillo (aventura, dificultad media, 3 jugadores), Mundo Creativo (construcción, fácil, 4), Islas de Supervivencia (supervivencia, difícil, 2), Bosque de Exploración (exploración, fácil, 2). Recomienda una opción según las preferencias recibidas y explica por qué. No afirmes que controlas Roblox ni que has creado un mapa real.`,
  3: `Eres el asistente explicativo de SafeWalk, una simulación educativa escolar. Recibirás datos de un tramo marcado por alumnos (verde, amarillo o rojo), hora, iluminación, personas, incidentes simulados y opcionalmente coordenadas. Explica brevemente por qué el tramo recibió esa clasificación y qué precaución general corresponde. Nunca afirmes que una calle real es objetivamente segura o peligrosa, no des garantías y menciona que es una clasificación educativa basada en datos registrados. Máximo 90 palabras.`,
  6: `Eres Krono, un organizador escolar. Recibirás tareas, tiempos y prioridades. Devuelve un plan breve y práctico en español, priorizando fechas límite y alternando trabajo con descansos razonables. No inventes obligaciones que no estén en los datos. Máximo 120 palabras.`,
  7: `Eres SeniorCare, un asistente educativo para una rutina ficticia de un adulto mayor. Puedes organizar recordatorios ya registrados de hidratación, caminata, alimentación, citas, contacto familiar y medicamentos previamente indicados. No diagnostiques, no recomiendes iniciar, suspender o cambiar medicamentos, dosis o tratamientos. Si el usuario pide consejo médico, indica que debe consultarlo con un profesional. Máximo 100 palabras.`,
  10: `Eres el motor de estrategia de un videojuego escolar 2D. Recibirás vida, energía, monedas, posición y distancia al enemigo. Da una recomendación de una o dos acciones y, opcionalmente, una mini misión de una línea. Sé breve, divertido y coherente con el estado recibido. Máximo 70 palabras.`,
};

function extractOutputText(data: any) {
  const parts: string[] = [];
  for (const item of data?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function requestedGroup(request: Request, bodyGroupId?: unknown) {
  const url = new URL(request.url);
  const raw = bodyGroupId ?? url.searchParams.get("groupId");
  const groupId = Number(raw);
  return Number.isInteger(groupId) ? groupId : 0;
}

async function authorizeGroup(request: Request, groupId: number) {
  const profile = await requireSession(request);
  if (!SUPPORTED_GROUPS.has(groupId)) throw new Error("Este proyecto no usa consultas inteligentes.");
  if (profile.role !== "admin" && profile.groupId !== groupId) {
    throw new Error("Esta cuenta no pertenece al proyecto solicitado.");
  }
  return profile;
}

export async function GET(request: Request) {
  try {
    const groupId = requestedGroup(request);
    if (!groupId) return Response.json({ error: "groupId inválido." }, { status: 400 });
    await authorizeGroup(request, groupId);
    const status = await getAiStatus(groupId);
    return Response.json({ status });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo consultar el estado." },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  let groupId = 0;
  let consumed = false;

  try {
    const body = (await request.json()) as {
      groupId?: number;
      message?: string;
      context?: unknown;
    };

    groupId = requestedGroup(request, body.groupId);
    if (!groupId) return Response.json({ error: "groupId inválido." }, { status: 400 });

    const profile = await authorizeGroup(request, groupId);
    const message = String(body.message ?? "").trim().slice(0, 1800);
    if (!message) return Response.json({ error: "Escribe una consulta." }, { status: 400 });

    const usage = await consumeAiUse(groupId);
    if (!usage.allowed) {
      return Response.json(
        {
          error: usage.reason,
          status: usage,
        },
        { status: 429 }
      );
    }
    consumed = true;

    const contextText = JSON.stringify(body.context ?? {}).slice(0, 4500);
    const apiKey = await getOpenAiKey();

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        instructions: PROMPTS[groupId],
        input: `Consulta del proyecto:\n${message}\n\nDatos de la interfaz:\n${contextText}`,
        reasoning: { effort: "none" },
        max_output_tokens: 240,
        store: false,
        metadata: {
          app: "atenas-ia-lab",
          group_id: String(groupId),
          role: profile.role,
        },
      }),
    });

    if (!openAiResponse.ok) {
      const detail = await parseError(openAiResponse);
      await refundAiUse(groupId);
      consumed = false;
      return Response.json(
        { error: `No se pudo generar la respuesta: ${detail}` },
        { status: 502 }
      );
    }

    const data = await openAiResponse.json();
    const text = extractOutputText(data);
    if (!text) {
      await refundAiUse(groupId);
      consumed = false;
      return Response.json({ error: "La consulta no devolvió texto." }, { status: 502 });
    }

    return Response.json({
      text,
      status: {
        enabled: true,
        dailyLimit: usage.dailyLimit,
        used: usage.used,
        remaining: usage.remaining,
        cooldownSeconds: usage.cooldownSeconds,
        retryAfter: usage.cooldownSeconds,
      },
    });
  } catch (error) {
    if (consumed && groupId) await refundAiUse(groupId);
    return Response.json(
      { error: error instanceof Error ? error.message : "Error inesperado." },
      { status: 500 }
    );
  }
}
