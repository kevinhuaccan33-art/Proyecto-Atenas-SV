import { getBindings, messageFromError } from "@/lib/cloudflare";

const DEFAULT_STEPS = ["Problema", "Beneficiarios", "Solución propuesta", "Prototipo", "Producto final"];

export async function GET() {
  try {
    const { DB } = getBindings();
    const projects = await DB.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all<Record<string, unknown>>();
    const steps = await DB.prepare("SELECT project_id, position, label, completed, note FROM project_steps ORDER BY position ASC").all<Record<string, unknown>>();
    const evidenceCounts = await DB.prepare("SELECT project_id, COUNT(*) AS total FROM evidence GROUP BY project_id").all<Record<string, unknown>>();
    const stepsByProject = new Map<string, Record<string, unknown>[]>();
    for (const step of steps.results) {
      const key = String(step.project_id);
      stepsByProject.set(key, [...(stepsByProject.get(key) ?? []), step]);
    }
    const counts = new Map(evidenceCounts.results.map(row => [String(row.project_id), Number(row.total)]));
    return Response.json({ projects: projects.results.map(row => ({
      id: row.id,
      title: row.title,
      team: row.team,
      members: JSON.parse(String(row.members_json ?? "[]")),
      summary: row.summary,
      stage: row.stage,
      progress: Number(row.progress),
      icon: row.icon,
      accent: row.accent,
      soft: row.soft,
      appUrl: row.app_url,
      updatedAt: row.updated_at,
      evidenceCount: counts.get(String(row.id)) ?? 0,
      steps: (stepsByProject.get(String(row.id)) ?? []).map(step => ({ label: step.label, done: Boolean(step.completed), note: step.note })),
    })) });
  } catch (error) {
    return Response.json({ error: messageFromError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { title?:string; team?:string; members?:string[]; summary?:string; icon?:string; appUrl?:string };
    const title = body.title?.trim() ?? "";
    const team = body.team?.trim() ?? "";
    const members = (body.members ?? []).map(member => member.trim()).filter(Boolean);
    if (!title || !team) return Response.json({ error: "Nombre del proyecto y grupo son obligatorios." }, { status: 400 });
    const id = crypto.randomUUID();
    const { DB } = getBindings();
    const statements = [DB.prepare("INSERT INTO projects (id, title, team, members_json, summary, icon, app_url) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, title, team, JSON.stringify(members), body.summary?.trim() ?? "", body.icon?.trim() || "💡", body.appUrl?.trim() ?? "")];
    DEFAULT_STEPS.forEach((label, position) => statements.push(DB.prepare("INSERT INTO project_steps (project_id, position, label, completed, note) VALUES (?, ?, ?, 0, '')").bind(id, position + 1, label)));
    await DB.batch(statements);
    return Response.json({ project: { id, title, team, members, summary:body.summary ?? "", stage:"Idea", progress:0, icon:body.icon || "💡", accent:"#6c56d9", soft:"#eeeafd", appUrl:body.appUrl ?? "", evidenceCount:0, steps:DEFAULT_STEPS.map(label => ({ label, done:false, note:"" })) } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: messageFromError(error) }, { status: 500 });
  }
}
