import { getBindings, messageFromError } from "@/lib/cloudflare";

export async function PATCH(request: Request, context: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { progress?:number; stage?:string; stepPosition?:number; stepDone?:boolean };
    const progress = Math.max(0, Math.min(100, Number(body.progress ?? 0)));
    const stage = body.stage?.trim() || "En desarrollo";
    const { DB } = getBindings();
    const statements = [DB.prepare("UPDATE projects SET progress = ?, stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(progress, stage, id)];
    if (body.stepPosition) statements.push(DB.prepare("UPDATE project_steps SET completed = ? WHERE project_id = ? AND position = ?").bind(body.stepDone ? 1 : 0, id, body.stepPosition));
    await DB.batch(statements);
    return Response.json({ ok:true, progress, stage });
  } catch (error) {
    return Response.json({ error: messageFromError(error) }, { status:500 });
  }
}
