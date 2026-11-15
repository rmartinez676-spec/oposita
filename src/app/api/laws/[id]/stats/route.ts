import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { fail, findOwnLaw, parseId, workspaceOf , NO_WORKSPACE_MSG } from "@/lib/server";
import { summarizeAttempts } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const law = await findOwnLaw(ws, id);
    if (!law) return fail("Ley no encontrada", 404);
    const rows = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.lawId, id), eq(attempts.workspaceId, ws)));
    return NextResponse.json(summarizeAttempts(rows, { withWeak: true }));
  } catch (error) {
    console.error("GET law stats", error);
    return fail("No se pudieron calcular las estadísticas", 500);
  }
}
