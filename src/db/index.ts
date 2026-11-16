import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const DB_URL: string = databaseUrl;

/** Neon, Supabase y compañía exigen TLS; en local no hace falta. */
function needsSsl(url: string): boolean {
  return (
    /sslmode=(require|prefer|verify-ca|verify-full)/i.test(url) ||
    /neon\.tech|supabase\.co|render\.com|amazonaws\.com|cockroachlabs\.cloud/i.test(url)
  );
}

/**
 * En serverless (Vercel) la función se congela entre peticiones y las conexiones
 * idle del pool mueren sin avisar: la siguiente consulta falla con
 * "Connection terminated unexpectedly". Detectamos esos errores y reintentamos
 * una vez con una conexión nueva, que es lo que arregla el fallo intermitente.
 */
function isConnectionError(e: unknown): boolean {
  const m = e instanceof Error ? `${e.message} ${(e as { code?: string }).code ?? ""}` : String(e);
  return /Connection terminated|connection timeout|ECONNRESET|ECONNREFUSED|EPIPE|socket hang up|SSL connection has been closed|57P01|57P02|57P03|ETIMEDOUT|ENOTFOUND|too many clients|remaining connection slots/i.test(
    m,
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __opositaPool?: Pool;
};

function createPool(): Pool {
  const raw = new Pool({
    connectionString: DB_URL,
    // En serverless conviene abrir muy pocas conexiones por instancia.
    max: 3,
    idleTimeoutMillis: 8_000,
    connectionTimeoutMillis: 12_000,
    allowExitOnIdle: true,
    ssl: needsSsl(DB_URL) ? { rejectUnauthorized: false } : undefined,
  });

  // Un cliente idle que muere no debe tumbar el proceso.
  raw.on("error", (err) => {
    console.error("[pg idle client]", err.message);
  });

  const queryWithRetry = async (...args: Parameters<Pool["query"]>) => {
    try {
      return await raw.query(...args);
    } catch (e) {
      if (!isConnectionError(e)) throw e;
      await new Promise((r) => setTimeout(r, 400));
      return raw.query(...args);
    }
  };

  return new Proxy(raw, {
    get(target, prop, receiver) {
      if (prop === "query") return queryWithRetry;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as Pool;
}

export const pool = globalForDb.__opositaPool ?? createPool();
globalForDb.__opositaPool = pool;

export const db = drizzle(pool);
