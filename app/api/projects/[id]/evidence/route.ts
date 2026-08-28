import { getBindings, messageFromError } from "@/lib/cloudflare";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, context:{ params:Promise<{id:string}> }) {
  try {
    const { id:projectId } = await context.params;
    const form = await request.formData();
    const file = form.get("file");
    const caption = String(form.get("caption") ?? "").trim();
    if (!(file instanceof File)) return Response.json({ error:"Selecciona una imagen." }, { status:400 });
    if (!ALLOWED_TYPES.has(file.type)) return Response.json({ error:"Utiliza JPG, PNG o WebP." }, { status:400 });
    if (file.size > MAX_FILE_SIZE) return Response.json({ error:"La imagen no puede superar 5 MB." }, { status:400 });
    const id = crypto.randomUUID();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const objectKey = `projects/${projectId}/${id}.${extension}`;
    const { DB, BUCKET } = getBindings();
    await BUCKET.put(objectKey, file.stream(), { httpMetadata:{ contentType:file.type }, customMetadata:{ projectId } });
    await DB.prepare("INSERT INTO evidence (id, project_id, object_key, file_name, content_type, size, caption) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, projectId, objectKey, file.name, file.type, file.size, caption).run();
    return Response.json({ evidence:{ id, fileName:file.name, caption } }, { status:201 });
  } catch (error) {
    return Response.json({ error:messageFromError(error) }, { status:500 });
  }
}
