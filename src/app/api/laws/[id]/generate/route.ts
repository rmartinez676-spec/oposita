import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { attempts, lawArticles } from "@/db/schema";
import { applyScope, dbFail, fail, findOwnLaw, parseId, workspaceOf } from "@/lib/server";
import { buildHangman, buildIndex, buildOrder, buildPairs, generateQuestions } from "@/lib/generator";
import type { AttemptKind, QuestionType, Scope } from "@/lib/quizTypes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** Genera un test o los datos de un juego a partir del texto de la ley. */
export async function POST(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    await ensureSchema();
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);

    const body = await request.json();
    const kind = (typeof body.kind === "string" ? body.kind : "test") as AttemptKind;
    const scope = body.scope as Scope | undefined;
    const count = Math.max(5, Math.min(60, Math.floor(Number(body.count) || 20)));
    const types = (Array.isArray(body.types) ? body.types : []).filter((t: unknown): t is QuestionType =>
      t === "cloze" || t === "article" || t === "vf",
    );

    const articles = await db
      .select()
      .from(lawArticles)
      .where(eq(lawArticles.lawId, id))
      .orderBy(asc(lawArticles.position));
    const idx = buildIndex(articles);

    let { list, label } = applyScope(articles, scope);

    if (body.mode === "fallos") {
      const rows = await db
        .select({ answers: attempts.answers })
        .from(attempts)
        .where(and(eq(attempts.lawId, id), eq(attempts.workspaceId, ws)))
        .orderBy(desc(attempts.createdAt))
        .limit(40);
      const wrongIds = new Set<number>();
      for (const r of rows) for (const a of r.answers) if (a.correct === false) wrongIds.add(a.articleId);
      list = articles.filter((a) => wrongIds.has(a.id));
      label = "Tus artículos flojos";
      if (!list.length) {
        return fail("Todavía no tienes fallos que repasar. ¡Haz primero algún test o juego!", 422);
      }
    }

    const usable = list.filter((a) => (idx.facts.get(a.id)?.length ?? 0) > 0);
    if (usable.length < 2) {
      return fail("Con ese ámbito no hay texto suficiente para generar preguntas. Prueba con «Toda la ley».", 422);
    }

    if (kind === "test") {
      const questions = generateQuestions(idx, list, articles, { count, types });
      if (!questions.length) return fail("No he podido generar preguntas con ese ámbito.", 422);
      return NextResponse.json({ questions, scopeLabel: label, articleCount: usable.length });
    }
    if (kind === "vf") {
      const items = generateQuestions(idx, list, articles, { count: 40, types: ["vf"] });
      if (items.length < 5) return fail("Hay muy poco texto para este juego. Prueba con «Toda la ley».", 422);
      return NextResponse.json({ items, scopeLabel: label });
    }
    if (kind === "parejas") {
      const pairs = buildPairs(idx, list, 6);
      if (pairs.length < 3) return fail("Necesito al menos 3 artículos con texto para jugar a las parejas.", 422);
      return NextResponse.json({ pairs, scopeLabel: label });
    }
    if (kind === "ahorcado") {
      const words = buildHangman(idx, list, 6);
      if (words.length < 2) return fail("No hay suficientes palabras clave en ese ámbito.", 422);
      return NextResponse.json({ words, scopeLabel: label });
    }
    if (kind === "ordena") {
      const sentences = buildOrder(idx, list, 6);
      if (sentences.length < 2) return fail("No encuentro frases adecuadas en ese ámbito.", 422);
      return NextResponse.json({ sentences, scopeLabel: label });
    }
    return fail("Tipo de juego no válido");
  } catch (error) {
    return dbFail(error);
  }
}
