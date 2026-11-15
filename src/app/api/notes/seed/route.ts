import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { SEED_NOTES } from "@/lib/seed";
import { fail, workspaceOf , NO_WORKSPACE_MSG } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Carga los apuntes de ejemplo a petición del usuario (solo si no tiene ninguno). */
export async function POST(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  try {
    const existing = await db.select({ id: notes.id }).from(notes).where(eq(notes.workspaceId, ws)).limit(1);
    if (existing.length === 0) {
      await db.insert(notes).values(SEED_NOTES.map((n) => ({ ...n, workspaceId: ws })));
    }
    const rows = await db.select().from(notes).where(eq(notes.workspaceId, ws)).orderBy(desc(notes.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("POST /api/notes/seed", error);
    return fail("No se pudieron cargar los ejemplos", 500);
  }
}
