import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { fail, parseId, workspaceOf , NO_WORKSPACE_MSG } from "@/lib/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const [row] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.workspaceId, ws)));
    if (!row) return fail("Intento no encontrado", 404);
    return NextResponse.json(row);
  } catch (error) {
    console.error("GET attempt", error);
    return fail("No se pudo abrir el test", 500);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail(NO_WORKSPACE_MSG);
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    const [row] = await db
      .delete(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.workspaceId, ws)))
      .returning({ id: attempts.id });
    if (!row) return fail("Intento no encontrado", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE attempt", error);
    return fail("No se pudo borrar", 500);
  }
}
