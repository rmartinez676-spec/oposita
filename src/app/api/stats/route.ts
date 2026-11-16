import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { attempts } from "@/db/schema";
import { dbFail, fail, workspaceOf } from "@/lib/server";
import { summarizeAttempts } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Estadísticas globales de todas tus leyes. */
export async function GET(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    await ensureSchema();
    const rows = await db
      .select({
        id: attempts.id,
        lawId: attempts.lawId,
        kind: attempts.kind,
        title: attempts.title,
        score: attempts.score,
        wrong: attempts.wrong,
        blank: attempts.blank,
        total: attempts.total,
        durationSec: attempts.durationSec,
        createdAt: attempts.createdAt,
      })
      .from(attempts)
      .where(eq(attempts.workspaceId, ws));
    return NextResponse.json(summarizeAttempts(rows));
  } catch (error) {
    return dbFail(error);
  }
}
