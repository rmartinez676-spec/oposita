import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message.slice(0, 200) : "error" },
      { status: 500 },
    );
  }
}
