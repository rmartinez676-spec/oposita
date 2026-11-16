import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { attempts } from "@/db/schema";
import { dbFail, fail, parseId, workspaceOf } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    await ensureSchema();
    const [row] = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.workspaceId, ws)));
    if (!row) return fail("Intento no encontrado", 404);
    return NextResponse.json(row);
  } catch (error) {
    return dbFail(error);
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  const id = parseId((await params).id);
  if (!id) return fail("Id no válido");
  try {
    await ensureSchema();
    const [row] = await db
      .delete(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.workspaceId, ws)))
      .returning({ id: attempts.id });
    if (!row) return fail("Intento no encontrado", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbFail(error);
  }
}
