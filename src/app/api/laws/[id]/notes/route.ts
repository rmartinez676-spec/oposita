import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lawArticles, notes } from "@/db/schema";
import { applyScope, fail, findOwnLaw, parseId, workspaceOf } from "@/lib/server";
import { buildNotes, type NoteDetail } from "@/lib/notesBuilder";
import type { Scope } from "@/lib/quizTypes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

/** Crea apuntes COMPLETOS (uno por título / bloque) a partir de los artículos de la ley. */
export async function POST(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("No he podido identificar tu espacio de estudio. Recarga la página e inténtalo de nuevo.");
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const body = await request.json();
    const detail: NoteDetail = body.detail === "esquema" ? "esquema" : "completo";
    const scope = body.scope as Scope | undefined;

    const articles = await db
      .select()
      .from(lawArticles)
      .where(eq(lawArticles.lawId, id))
      .orderBy(asc(lawArticles.position));
    const { list } = applyScope(articles, scope);
    if (!list.length) return fail("No hay artículos en ese ámbito.", 422);

    const generated = buildNotes({ name: law.name, shortName: law.shortName }, list, { detail }).slice(0, 60);
    if (!generated.length) return fail("No se pudo generar ningún apunte.", 422);

    const created = await db
      .insert(notes)
      .values(
        generated.map((g) => ({
          workspaceId: ws,
          lawId: law.id,
          title: g.title,
          lawName: law.name,
          article: g.article,
          category: law.branch,
          content: g.content,
          paperColor: law.color,
          fontStyle: "kalam",
          inkColor: "azul",
          isFavorite: false,
          tags: g.tags,
        })),
      )
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/laws/[id]/notes", error);
    return fail("No se pudieron generar los apuntes", 500);
  }
}
