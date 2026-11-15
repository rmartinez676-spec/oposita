import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lawArticles, laws } from "@/db/schema";
import { fail, findOwnLaw, parseId, workspaceOf , NO_WORKSPACE_MSG } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const articles = await db
      .select({
        id: lawArticles.id,
        kind: lawArticles.kind,
        number: lawArticles.number,
        block: lawArticles.block,
        chapter: lawArticles.chapter,
        rubric: lawArticles.rubric,
        body: lawArticles.body,
        position: lawArticles.position,
      })
      .from(lawArticles)
      .where(eq(lawArticles.lawId, id))
      .orderBy(asc(lawArticles.position));
    return NextResponse.json({ law, articles });
  } catch (error) {
    console.error("GET /api/laws/[id]", error);
    return fail("No se pudo abrir la ley", 500);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const body = await request.json();
    const updates: Partial<typeof laws.$inferInsert> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim().slice(0, 300);
    if (typeof body.shortName === "string") updates.shortName = body.shortName.trim().slice(0, 40);
    if (typeof body.description === "string") updates.description = body.description.trim().slice(0, 500);
    if (typeof body.opos === "string") updates.opos = body.opos.trim().slice(0, 300);
    if (typeof body.color === "string") updates.color = body.color;
    if (typeof body.icon === "string") updates.icon = body.icon.slice(0, 8);
    if (!Object.keys(updates).length) return NextResponse.json(law);
    const [updated] = await db.update(laws).set(updates).where(eq(laws.id, id)).returning();
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/laws/[id]", error);
    return fail("No se pudo actualizar la ley", 500);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    await db.delete(laws).where(eq(laws.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/laws/[id]", error);
    return fail("No se pudo borrar la ley", 500);
  }
}
