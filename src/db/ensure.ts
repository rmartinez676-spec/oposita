import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Crea las tablas si no existen (idempotente). Así la app funciona aunque la
 * base de datos de Neon esté vacía: no hace falta ejecutar SQL a mano.
 * Se ejecuta una sola vez por instancia; si falla, se reintenta en la siguiente petición.
 */
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = run().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

async function run(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS laws (
      id            SERIAL PRIMARY KEY,
      workspace_id  TEXT NOT NULL,
      name          TEXT NOT NULL,
      short_name    TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      boe_id        TEXT NOT NULL DEFAULT '',
      opos          TEXT NOT NULL DEFAULT '',
      color         TEXT NOT NULL DEFAULT 'amber',
      icon          TEXT NOT NULL DEFAULT '⚖️',
      branch        TEXT NOT NULL DEFAULT 'Administrativo',
      source        TEXT NOT NULL DEFAULT 'texto',
      article_count INTEGER NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS laws_workspace_idx ON laws (workspace_id)`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS law_articles (
      id         SERIAL PRIMARY KEY,
      law_id     INTEGER NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL DEFAULT 'articulo',
      number     TEXT NOT NULL,
      block      TEXT NOT NULL DEFAULT '',
      chapter    TEXT NOT NULL DEFAULT '',
      rubric     TEXT NOT NULL DEFAULT '',
      body       TEXT NOT NULL DEFAULT '',
      "position" INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS law_articles_law_idx ON law_articles (law_id)`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS attempts (
      id           SERIAL PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      law_id       INTEGER NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
      kind         TEXT NOT NULL DEFAULT 'test',
      title        TEXT NOT NULL DEFAULT '',
      scope        TEXT NOT NULL DEFAULT 'Toda la ley',
      score        INTEGER NOT NULL DEFAULT 0,
      wrong        INTEGER NOT NULL DEFAULT 0,
      blank        INTEGER NOT NULL DEFAULT 0,
      total        INTEGER NOT NULL DEFAULT 0,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      questions    JSONB,
      answers      JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS attempts_law_idx ON attempts (law_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS attempts_workspace_idx ON attempts (workspace_id)`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notes (
      id           SERIAL PRIMARY KEY,
      workspace_id TEXT NOT NULL DEFAULT 'public',
      law_id       INTEGER REFERENCES laws(id) ON DELETE SET NULL,
      title        TEXT NOT NULL,
      law_name     TEXT NOT NULL DEFAULT '',
      article      TEXT NOT NULL DEFAULT '',
      category     TEXT NOT NULL DEFAULT 'Constitucional',
      content      TEXT NOT NULL DEFAULT '',
      paper_color  TEXT NOT NULL DEFAULT 'crema',
      font_style   TEXT NOT NULL DEFAULT 'caveat',
      ink_color    TEXT NOT NULL DEFAULT 'azul',
      is_favorite  BOOLEAN NOT NULL DEFAULT false,
      tags         TEXT NOT NULL DEFAULT '',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  // Bases de datos creadas con la primera versión de la app:
  await db.execute(sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS workspace_id TEXT NOT NULL DEFAULT 'public'`);
  await db.execute(sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS law_id INTEGER REFERENCES laws(id) ON DELETE SET NULL`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS notes_workspace_idx ON notes (workspace_id)`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}
