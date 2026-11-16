import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Versión del código: si esta ruta no existe en tu despliegue, tienes código antiguo. */
export const APP_VERSION = "v3-subida-pdf-autotablas";

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function maskUrl(url: string): string {
  return url.replace(/:\/\/([^:/@]+):([^@]+)@/, "://$1:***@").slice(0, 160);
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 220);

export async function GET() {
  const checks: Check[] = [];
  const advice: string[] = [];

  const url = process.env.DATABASE_URL ?? "";
  checks.push({
    name: "Variable DATABASE_URL",
    ok: Boolean(url),
    detail: url ? maskUrl(url) : "No está definida. Añádela en Vercel → Settings → Environment Variables.",
  });
  if (!url) advice.push("Añade DATABASE_URL en Vercel con la cadena de conexión de Neon y vuelve a desplegar.");

  let connected = false;
  if (url) {
    try {
      await db.execute(sql`select 1`);
      connected = true;
      checks.push({ name: "Conexión a PostgreSQL", ok: true, detail: "Correcta." });
    } catch (e) {
      const m = msg(e);
      checks.push({ name: "Conexión a PostgreSQL", ok: false, detail: m });
      if (/certificate|ssl|tls/i.test(m)) {
        advice.push("Añade ?sslmode=require al final de DATABASE_URL (Neon exige conexión cifrada).");
      } else if (/timeout|ECONN|ENOTFOUND|terminated|fetch failed/i.test(m)) {
        advice.push("Usa la cadena «pooled» de Neon (el host lleva -pooler) y comprueba que la base de datos exista y no esté suspendida.");
      } else if (/password|authentication/i.test(m)) {
        advice.push("La contraseña de DATABASE_URL no es correcta: copia la cadena entera desde Neon → Dashboard → Connection string.");
      } else {
        advice.push("Revisa DATABASE_URL: " + m);
      }
    }
  }

  if (connected) {
    try {
      await ensureSchema();
      const rows = await db.execute(sql`
        select table_name from information_schema.tables where table_schema = 'public' order by table_name
      `);
      const names = (rows.rows as { table_name: string }[]).map((r) => r.table_name);
      const needed = ["laws", "law_articles", "attempts", "notes", "app_meta"];
      const missing = needed.filter((t) => !names.includes(t));
      checks.push({
        name: "Tablas de la app",
        ok: missing.length === 0,
        detail: missing.length === 0 ? `Las 5 tablas existen (${names.join(", ")}).` : `Faltan: ${missing.join(", ")}.`,
      });
      if (missing.length) advice.push("Pulsa «Reintentar» en la mesa: las tablas se crean solas. Si sigue fallando, mira el detalle de la conexión.");
    } catch (e) {
      checks.push({ name: "Tablas de la app", ok: false, detail: msg(e) });
      advice.push("No se pudieron crear las tablas: " + msg(e));
    }
  }

  try {
    const res = await fetch("https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OpositaApp/1.0)" },
      signal: AbortSignal.timeout(9000),
      cache: "no-store",
    });
    const body = await res.text();
    const ok = res.ok && body.includes('id="textoxslt"');
    checks.push({
      name: "Acceso al BOE (descargar leyes)",
      ok,
      detail: ok ? `Correcto (HTTP ${res.status}, ${(body.length / 1024).toFixed(0)} KB).` : `HTTP ${res.status}, sin texto de ley.`,
    });
    if (!ok) advice.push("El servidor no puede leer el BOE. Mientras tanto, sube las leyes como PDF o pegando el texto.");
  } catch (e) {
    checks.push({ name: "Acceso al BOE (descargar leyes)", ok: false, detail: msg(e) });
    advice.push("El servidor no llega a boe.es (bloqueo o tiempo agotado). Sube las leyes como PDF o texto: funciona igual.");
  }

  if (checks.every((c) => c.ok)) {
    advice.push(
      "Por aquí todo está correcto. Si tu web publicada sigue fallando o no ves el botón «Subir PDF», tu despliegue de Vercel tiene código ANTIGUO: vuelve a desplegar (Redeploy) con esta versión.",
    );
  }

  return NextResponse.json({ version: APP_VERSION, checks, advice });
}
