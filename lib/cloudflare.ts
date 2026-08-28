import { env } from "cloudflare:workers";

type AtenasBindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

export function getBindings() {
  return env as unknown as AtenasBindings;
}

export function messageFromError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error inesperado";
  if (message.includes("no such table")) {
    return "La base de datos todavía no fue preparada. Ejecuta las migraciones antes de publicar.";
  }
  return message;
}
