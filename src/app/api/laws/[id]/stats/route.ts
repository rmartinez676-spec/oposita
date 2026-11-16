import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { attempts } from "@/db/schema";
import { dbFail, fail, findOwnLaw, parseId, workspaceOf } from "@/lib/server";
import { summarizeAttempts } from "@/lib/stats";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    await ensureSchema();
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const rows = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.lawId, id), eq(attempts.workspaceId, ws)));
    return NextResponse.json(summarizeAttempts(rows, { withWeak: true }));
  } catch (error) {
    return dbFail(error);
  }
}
