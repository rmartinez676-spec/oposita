import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { fail, workspaceOf , NO_WORKSPACE_MSG } from "@/lib/server";
import { summarizeAttempts } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** Estadísticas globales de todas tus leyes. */
export async function GET(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  try {
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
    console.error("GET /api/stats", error);
    return fail("No se pudieron calcular las estadísticas", 500);
  }
}
