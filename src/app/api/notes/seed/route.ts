import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notes } from "@/db/schema";
import { SEED_NOTES } from "@/lib/seed";
import { dbFail, fail, workspaceOf } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Carga los apuntes de ejemplo a petición del usuario (solo si no tiene ninguno). */
export async function POST(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    await ensureSchema();
    const existing = await db.select({ id: notes.id }).from(notes).where(eq(notes.workspaceId, ws)).limit(1);
    if (existing.length === 0) {
      await db.insert(notes).values(SEED_NOTES.map((n) => ({ ...n, workspaceId: ws })));
    }
    const rows = await db.select().from(notes).where(eq(notes.workspaceId, ws)).orderBy(desc(notes.createdAt), desc(notes.id));
    return NextResponse.json(rows);
  } catch (error) {
    return dbFail(error);
  }
}
