import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { laws } from "@/db/schema";
import type { Scope } from "./quizTypes";

/**
 * Código de espacio de trabajo: cabecera x-workspace-id (la inyecta el middleware)
 * o, como respaldo, la cookie oposita_ws. Así ningún cliente se queda fuera.
 */
export function workspaceOf(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/(?:^|;\s*)oposita_ws=([A-Za-z0-9_-]{8,64})/);
  if (m) return m[1];
  const v = req.headers.get("x-workspace-id") ?? "";
  return /^[A-Za-z0-9_-]{8,64}$/.test(v) ? v : null;
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Traduce los errores de PostgreSQL a mensajes que se entienden en pantalla. */
export function dbFail(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error("[db]", msg);
  if (/relation .* does not exist|undefined table/i.test(msg)) {
    return fail(
      "La base de datos todavía no tiene las tablas. Pulsa «Reintentar»: se crean solas en unos segundos.",
      500,
    );
  }
  if (/DATABASE_URL|connect|ECONN|ETIMEDOUT|ENOTFOUND|terminated|SSL|certificate|password|authentication/i.test(msg)) {
    return fail(
      `No se pudo conectar a la base de datos. Revisa la variable DATABASE_URL en Vercel (la cadena de Neon, terminada en ?sslmode=require). Detalle: ${msg.slice(0, 140)}`,
      500,
    );
  }
  return fail(`Error interno: ${msg.slice(0, 160)}`, 500);
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function findOwnLaw(ws: string, id: number) {
  const [law] = await db
    .select()
    .from(laws)
    .where(and(eq(laws.id, id), eq(laws.workspaceId, ws)));
  return law ?? null;
}

export function applyScope<T extends { kind: string; number: string; block: string }>(
  articles: T[],
  scope?: Scope,
): { list: T[]; label: string } {
  if (!scope || scope.mode === "all") return { list: articles, label: "Toda la ley" };
  if (scope.mode === "block") {
    const b = scope.block ?? "";
    return { list: articles.filter((a) => a.block === b), label: b || "Bloque" };
  }
  const from = Number.isFinite(scope.from) ? Number(scope.from) : 0;
  const to = Number.isFinite(scope.to) ? Number(scope.to) : Number.MAX_SAFE_INTEGER;
  const list = articles.filter((a) => {
    if (a.kind !== "articulo") return false;
    const n = parseInt(a.number, 10);
    return n >= from && n <= to;
  });
  return { list, label: `Arts. ${from || 1}–${Number.isFinite(scope.to) ? to : "…"}` };
}
