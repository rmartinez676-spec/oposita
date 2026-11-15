import { NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts, lawArticles, laws, notes } from "@/db/schema";
import { fail, workspaceOf , NO_WORKSPACE_MSG } from "@/lib/server";
import { parseLaw } from "@/lib/lawParser";
import { fetchBoeLaw, normalizeBoeId } from "@/lib/boe";
import { addOpo, autoShortName, BRANCH_ICON, guessBranch, pickColor } from "@/lib/catalog";
import { gradeOf } from "@/lib/quizTypes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const str = (v: unknown, max = 400) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function GET(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  try {
    const rows = await db.select().from(laws).where(eq(laws.workspaceId, ws)).orderBy(desc(laws.createdAt));
    const att = await db
      .select({
        lawId: attempts.lawId,
        kind: attempts.kind,
        score: attempts.score,
        wrong: attempts.wrong,
        total: attempts.total,
        createdAt: attempts.createdAt,
      })
      .from(attempts)
      .where(eq(attempts.workspaceId, ws));
    const noteCounts = await db
      .select({ lawId: notes.lawId, n: count() })
      .from(notes)
      .where(eq(notes.workspaceId, ws))
      .groupBy(notes.lawId);

    const result = rows.map((law) => {
      const mine = att.filter((a) => a.lawId === law.id);
      const grades = mine.map((a) => gradeOf(a));
      const last = mine.reduce<Date | null>((acc, a) => (!acc || a.createdAt > acc ? a.createdAt : acc), null);
      return {
        ...law,
        stats: {
          attempts: mine.length,
          avgGrade: grades.length ? Math.round((grades.reduce((s, g) => s + g, 0) / grades.length) * 10) / 10 : 0,
          bestGrade: grades.length ? Math.round(Math.max(...grades) * 10) / 10 : 0,
          lastAt: last ? last.toISOString() : null,
          notes: noteCounts.find((n) => n.lawId === law.id)?.n ?? 0,
        },
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/laws", error);
    return fail("No se pudieron cargar tus leyes", 500);
  }
}

export async function POST(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  try {
    const body = await request.json();
    const boeInput = str(body.boeId, 200);
    const boeId = boeInput ? normalizeBoeId(boeInput) : null;
    if (boeInput && !boeId) {
      return fail("No reconozco ese identificador del BOE. Debe parecerse a BOE-A-1978-31229.");
    }
    const opos = str(body.opos, 300);

    // ¿Ya la tenía? → solo añadimos la oposición a su carpeta
    if (boeId) {
      const [existing] = await db
        .select()
        .from(laws)
        .where(and(eq(laws.workspaceId, ws), eq(laws.boeId, boeId)));
      if (existing) {
        const merged = opos ? addOpo(existing.opos, opos) : existing.opos;
        const [updated] = await db.update(laws).set({ opos: merged }).where(eq(laws.id, existing.id)).returning();
        return NextResponse.json({ law: updated, existed: true });
      }
    }

    let name = str(body.name, 300);
    let text = typeof body.text === "string" ? body.text : "";
    let source = "texto";
    if (boeId) {
      try {
        const out = await fetchBoeLaw(boeId);
        text = out.text;
        if (!name) name = out.title;
        source = "boe";
      } catch (e) {
        return fail(e instanceof Error ? e.message : "No se pudo descargar la ley del BOE", 502);
      }
    } else if (str(body.source, 20) === "archivo") {
      source = "archivo";
    }

    if (text.length > 14_000_000) return fail("El texto es demasiado grande (máximo ~14 MB)");
    if (text.trim().length < 80) return fail("El texto de la ley está vacío o es demasiado corto.");

    const parsed = parseLaw(text);
    if (!parsed.articles.length) {
      return fail(
        "No he encontrado artículos en ese texto. Comprueba que la ley tiene líneas del tipo «Artículo 1.» y que el PDF no es una imagen escaneada.",
        422,
      );
    }

    name = name || parsed.suggestedName || "Ley sin nombre";
    const shortName = str(body.shortName, 40) || autoShortName(name);
    const branch = guessBranch(name);

    const [law] = await db
      .insert(laws)
      .values({
        workspaceId: ws,
        name: name.slice(0, 300),
        shortName,
        description: str(body.description, 500),
        boeId: boeId ?? "",
        opos,
        color: pickColor(name),
        icon: BRANCH_ICON[branch] ?? "⚖️",
        branch,
        source,
        articleCount: parsed.articles.length,
      })
      .returning();

    try {
      const rows = parsed.articles.map((a) => ({
        lawId: law.id,
        kind: a.kind,
        number: a.number.slice(0, 120),
        block: a.block.slice(0, 300),
        chapter: a.chapter.slice(0, 400),
        rubric: a.rubric.slice(0, 300),
        body: a.body,
        position: a.position,
      }));
      for (let i = 0; i < rows.length; i += 250) {
        await db.insert(lawArticles).values(rows.slice(i, i + 250));
      }
    } catch (e) {
      await db.delete(laws).where(eq(laws.id, law.id));
      throw e;
    }

    return NextResponse.json({ law, existed: false, articleCount: parsed.articles.length }, { status: 201 });
  } catch (error) {
    console.error("POST /api/laws", error);
    return fail("No se pudo guardar la ley", 500);
  }
}
