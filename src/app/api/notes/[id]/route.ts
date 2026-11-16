import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notes } from "@/db/schema";
import { dbFail, fail, findOwnLaw, parseId, workspaceOf } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    await ensureSchema();
    const id = parseId((await params).id);
    if (!id) return fail("Id no válido");

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const textFields = ["title", "lawName", "article", "category", "content", "paperColor", "fontStyle", "inkColor", "tags"] as const;
    for (const field of textFields) {
      if (typeof body[field] === "string") updates[field] = body[field].trim();
    }
    if (typeof body.isFavorite === "boolean") updates.isFavorite = body.isFavorite;
    if ("lawId" in body) {
      if (body.lawId === null || body.lawId === "") updates.lawId = null;
      else {
        const law = await findOwnLaw(ws, Number(body.lawId));
        updates.lawId = law ? law.id : null;
      }
    }
    if (typeof updates.title === "string" && !updates.title) return fail("El apunte necesita un título");

    const [updated] = await db
      .update(notes)
      .set(updates)
      .where(and(eq(notes.id, id), eq(notes.workspaceId, ws)))
      .returning();
    if (!updated) return fail("Apunte no encontrado", 404);
    return NextResponse.json(updated);
  } catch (error) {
    return dbFail(error);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    await ensureSchema();
    const id = parseId((await params).id);
    if (!id) return fail("Id no válido");
    const [deleted] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.workspaceId, ws)))
      .returning();
    if (!deleted) return fail("Apunte no encontrado", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbFail(error);
  }
}
