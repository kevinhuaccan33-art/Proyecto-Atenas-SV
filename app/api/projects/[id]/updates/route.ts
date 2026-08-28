import { getBindings, messageFromError } from "@/lib/cloudflare";

export async function POST(request: Request, context:{ params:Promise<{id:string}> }) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { title?:string; detail?:string; progress?:number; stage?:string };
    const title = body.title?.trim() ?? "";
    const progress = Math.max(0, Math.min(100, Number(body.progress ?? 0)));
    if (!title) return Response.json({ error:"Describe brevemente el avance." }, { status:400 });
    const { DB } = getBindings();
    await DB.batch([
      DB.prepare("INSERT INTO project_updates (project_id, title, detail, progress) VALUES (?, ?, ?, ?)").bind(id, title, body.detail?.trim() ?? "", progress),
      DB.prepare("UPDATE projects SET progress = ?, stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(progress, body.stage?.trim() || "En desarrollo", id),
    ]);
    return Response.json({ ok:true, progress });
  } catch (error) {
    return Response.json({ error:messageFromError(error) }, { status:500 });
  }
}
