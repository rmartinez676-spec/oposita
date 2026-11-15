import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { laws } from "@/db/schema";
import type { Scope } from "./quizTypes";

const WS_RE = /^[A-Za-z0-9_-]{8,128}$/;

export const NO_WORKSPACE_MSG =
  "No he podido identificar tu espacio de estudio. Recarga la página (Ctrl+F5) e inténtalo de nuevo.";

/**
 * Cada visitante se identifica con un id aleatorio. Lo aceptamos por tres vías, la primera válida gana:
 * cabecera x-workspace-id, parámetro ?ws= de la URL o cookie oposita_ws.
 */
export function workspaceOf(req: Request): string | null {
  const candidates: string[] = [];
  const header = req.headers.get("x-workspace-id");
  if (header) candidates.push(...header.split(","));
  try {
    const q = new URL(req.url).searchParams.get("ws");
    if (q) candidates.push(q);
  } catch {
    /* url no analizable */
  }
  const cookie = req.headers.get("cookie");
  if (cookie) {
    const m = cookie.match(/(?:^|;\s*)oposita_ws=([^;]+)/);
    if (m) {
      try {
        candidates.push(decodeURIComponent(m[1]));
      } catch {
        candidates.push(m[1]);
      }
    }
  }
  for (const c of candidates) {
    const v = c.trim();
    if (WS_RE.test(v)) return v;
  }
  return null;
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

export function applyScope<T extends { id: number; kind: string; number: string; block: string }>(
  articles: T[],
  scope?: Scope,
): { list: T[]; label: string } {
  if (!scope || scope.mode === "all") return { list: articles, label: "Toda la ley" };
  if (scope.mode === "ids") {
    const set = new Set((scope.ids ?? []).map(Number));
    const list = articles.filter((a) => set.has(a.id));
    return { list, label: `Mi selección (${list.length} ${list.length === 1 ? "artículo" : "artículos"})` };
  }
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
