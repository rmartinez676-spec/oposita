import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appMeta, notes } from "@/db/schema";
import { SEED_NOTES } from "@/lib/seed";
import { fail, findOwnLaw, workspaceOf } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Siembra los apuntes de ejemplo solo la primera vez que un espacio de trabajo abre el cuaderno. */
async function ensureSeeded(ws: string) {
  const key = `seeded_v2:${ws}`;
  const marker = await db.select().from(appMeta).where(eq(appMeta.key, key));
  if (marker.length > 0) return;
  const mine = await db.select({ id: notes.id }).from(notes).where(eq(notes.workspaceId, ws)).limit(1);
  if (mine.length === 0) {
    await db.insert(notes).values(SEED_NOTES.map((n) => ({ ...n, workspaceId: ws })));
  }
  await db.insert(appMeta).values({ key, value: new Date().toISOString() }).onConflictDoNothing();
}

export async function GET(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    const lawIdParam = new URL(request.url).searchParams.get("lawId");
    const lawId = lawIdParam ? Number(lawIdParam) : null;
    if (!lawId) await ensureSeeded(ws);
    const rows = await db
      .select()
      .from(notes)
      .where(lawId ? and(eq(notes.workspaceId, ws), eq(notes.lawId, lawId)) : eq(notes.workspaceId, ws))
      .orderBy(desc(notes.createdAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/notes", error);
    return fail("No se pudieron cargar los apuntes", 500);
  }
}

export async function POST(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!title) return fail("El apunte necesita un título");
    if (!content) return fail("Escribe algo en el apunte, aunque sea una línea");

    let lawId: number | null = null;
    if (body.lawId) {
      const law = await findOwnLaw(ws, Number(body.lawId));
      if (law) lawId = law.id;
    }

    const [created] = await db
      .insert(notes)
      .values({
        workspaceId: ws,
        lawId,
        title,
        lawName: String(body.lawName ?? "").trim(),
        article: String(body.article ?? "").trim(),
        category: String(body.category ?? "Constitucional"),
        content,
        paperColor: String(body.paperColor ?? "crema"),
        fontStyle: String(body.fontStyle ?? "caveat"),
        inkColor: String(body.inkColor ?? "azul"),
        isFavorite: Boolean(body.isFavorite),
        tags: String(body.tags ?? "").trim(),
      })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes", error);
    return fail("No se pudo guardar el apunte", 500);
  }
}
