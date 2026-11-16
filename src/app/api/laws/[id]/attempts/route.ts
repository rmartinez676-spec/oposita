import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { attempts } from "@/db/schema";
import { dbFail, fail, findOwnLaw, parseId, workspaceOf } from "@/lib/server";
import type { AnswerDetail, Question } from "@/lib/quizTypes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const KINDS = ["test", "vf", "parejas", "ahorcado", "ordena"];
const toInt = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

export async function GET(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    await ensureSchema();
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const rows = await db
      .select({
        id: attempts.id,
        kind: attempts.kind,
        title: attempts.title,
        scope: attempts.scope,
        score: attempts.score,
        wrong: attempts.wrong,
        blank: attempts.blank,
        total: attempts.total,
        durationSec: attempts.durationSec,
        createdAt: attempts.createdAt,
      })
      .from(attempts)
      .where(and(eq(attempts.lawId, id), eq(attempts.workspaceId, ws)))
      .orderBy(desc(attempts.createdAt))
      .limit(150);
    return NextResponse.json(rows);
  } catch (error) {
    return dbFail(error);
  }
}

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
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (!KINDS.includes(kind)) return fail("Tipo de intento no válido");

    const answers: AnswerDetail[] = (Array.isArray(body.answers) ? body.answers : [])
      .slice(0, 300)
      .map((a: Record<string, unknown>) => ({
        qid: String(a.qid ?? "").slice(0, 30),
        articleId: toInt(a.articleId, 1_000_000),
        articleLabel: String(a.articleLabel ?? "").slice(0, 80),
        chosen: typeof a.chosen === "number" ? a.chosen : null,
        correct: typeof a.correct === "boolean" ? a.correct : null,
      }));

    const questions =
      kind === "test" && Array.isArray(body.questions) ? (body.questions.slice(0, 100) as Question[]) : null;

    const [created] = await db
      .insert(attempts)
      .values({
        workspaceId: ws,
        lawId: id,
        kind,
        title: String(body.title ?? "").slice(0, 160),
        scope: String(body.scope ?? "Toda la ley").slice(0, 200),
        score: toInt(body.score, 1000),
        wrong: toInt(body.wrong, 1000),
        blank: toInt(body.blank, 1000),
        total: toInt(body.total, 1000),
        durationSec: toInt(body.durationSec, 86400),
        questions,
        answers,
      })
      .returning({ id: attempts.id });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return dbFail(error);
  }
}
