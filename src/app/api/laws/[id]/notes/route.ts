import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { lawArticles, notes } from "@/db/schema";
import { applyScope, fail, findOwnLaw, NO_WORKSPACE_MSG, parseId, workspaceOf } from "@/lib/server";
import { buildNotes, type NoteDetail } from "@/lib/notesBuilder";
import type { Scope } from "@/lib/quizTypes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

/**
 * Crea apuntes COMPLETOS a partir de los artículos de la ley.
 *  - Por defecto crea apuntes nuevos (uno por título/bloque; uno solo si es una selección o un rango).
 *  - Con appendToNoteId añade el contenido generado al final de un apunte que ya tienes.
 */
export async function POST(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const body = await request.json();
    const detail: NoteDetail = body.detail === "esquema" ? "esquema" : body.detail === "ampliado" ? "ampliado" : "completo";
    const scope = body.scope as Scope | undefined;

    const articles = await db
      .select()
      .from(lawArticles)
      .where(eq(lawArticles.lawId, id))
      .orderBy(asc(lawArticles.position));
    const { list, label } = applyScope(articles, scope);
    if (!list.length) return fail("No hay artículos en ese ámbito. Elige otra parte de la ley.", 422);

    const mergeLabel =
      scope?.mode === "ids" ? "Selección de artículos" : scope?.mode === "range" ? label : undefined;
    const generated = buildNotes({ name: law.name, shortName: law.shortName }, list, { detail, mergeLabel }).slice(0, 60);
    if (!generated.length) return fail("No se pudo generar ningún apunte.", 422);

    const appendId = Number(body.appendToNoteId) || 0;
    if (appendId) {
      const [target] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, appendId), eq(notes.workspaceId, ws)));
      if (!target) return fail("No encuentro el apunte que quieres ampliar.", 404);
      const ranges = generated.map((g) => g.article).join(" + ");
      const content = `${target.content.trim()}\n\n# + Ampliación · ${ranges}\n${generated.map((g) => g.content).join("\n\n")}`;
      const article = [target.article, ranges].filter(Boolean).join(" + ").slice(0, 160);
      const [updated] = await db
        .update(notes)
        .set({ content, article, updatedAt: new Date() })
        .where(eq(notes.id, target.id))
        .returning();
      return NextResponse.json({ created: [], updated });
    }

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
    return NextResponse.json({ created, updated: null }, { status: 201 });
  } catch (error) {
    console.error("POST /api/laws/[id]/notes", error);
    return fail("No se pudieron generar los apuntes", 500);
  }
}
