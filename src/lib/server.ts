import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { laws } from "@/db/schema";
import type { Scope } from "./quizTypes";

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Cada visitante identifica su espacio de trabajo por la cabecera x-workspace-id,
 * por el parámetro ?ws= o por la cookie oposita-ws (en ese orden), por si algún proxy
 * o navegador descarta alguno de los canales.
 */
export function workspaceOf(req: Request): string | null {
  const fromHeader = req.headers.get("x-workspace-id") ?? "";
  if (ID_RE.test(fromHeader)) return fromHeader;
  try {
    const q = new URL(req.url).searchParams.get("ws") ?? "";
    if (ID_RE.test(q)) return q;
  } catch {
    /* url no analizable */
  }
  const m = (req.headers.get("cookie") ?? "").match(/(?:^|;\s*)oposita-ws=([A-Za-z0-9_-]{8,64})/);
  return m ? m[1] : null;
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
