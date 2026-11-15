import { boolean, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { AnswerDetail, Question } from "@/lib/quizTypes";

/**
 * Cada visitante tiene su propio "workspace" (id aleatorio guardado en su navegador),
 * así cada opositor mete las leyes de SUS oposiciones sin ver las de otros.
 */

/** Carpeta de ley: una norma subida/importada por el opositor. */
export const laws = pgTable(
  "laws",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull().default(""),
    description: text("description").notNull().default(""),
    boeId: text("boe_id").notNull().default(""),
    /** Oposiciones a las que pertenece, separadas por comas */
    opos: text("opos").notNull().default(""),
    color: text("color").notNull().default("amber"),
    icon: text("icon").notNull().default("⚖️"),
    branch: text("branch").notNull().default("Administrativo"),
    source: text("source").notNull().default("texto"),
    articleCount: integer("article_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("laws_workspace_idx").on(t.workspaceId)],
);

/** Artículos (y disposiciones) de cada ley, ya troceados. */
export const lawArticles = pgTable(
  "law_articles",
  {
    id: serial("id").primaryKey(),
    lawId: integer("law_id")
      .notNull()
      .references(() => laws.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("articulo"),
    number: text("number").notNull(),
    block: text("block").notNull().default(""),
    chapter: text("chapter").notNull().default(""),
    rubric: text("rubric").notNull().default(""),
    body: text("body").notNull().default(""),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("law_articles_law_idx").on(t.lawId)],
);

/** Cada test o juego realizado (alimenta las estadísticas). */
export const attempts = pgTable(
  "attempts",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    lawId: integer("law_id")
      .notNull()
      .references(() => laws.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("test"),
    title: text("title").notNull().default(""),
    scope: text("scope").notNull().default("Toda la ley"),
    score: integer("score").notNull().default(0),
    wrong: integer("wrong").notNull().default(0),
    blank: integer("blank").notNull().default(0),
    total: integer("total").notNull().default(0),
    durationSec: integer("duration_sec").notNull().default(0),
    questions: jsonb("questions").$type<Question[]>(),
    answers: jsonb("answers").$type<AnswerDetail[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attempts_law_idx").on(t.lawId), index("attempts_workspace_idx").on(t.workspaceId)],
);

/** Apuntes manuscritos (los escritos a mano y los generados a partir de una ley). */
export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    workspaceId: text("workspace_id").notNull().default("public"),
    lawId: integer("law_id").references(() => laws.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    lawName: text("law_name").notNull().default(""),
    article: text("article").notNull().default(""),
    category: text("category").notNull().default("Constitucional"),
    content: text("content").notNull().default(""),
    paperColor: text("paper_color").notNull().default("crema"),
    fontStyle: text("font_style").notNull().default("caveat"),
    inkColor: text("ink_color").notNull().default("azul"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    tags: text("tags").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notes_workspace_idx").on(t.workspaceId)],
);

/** Pequeña tabla clave/valor (p. ej. para recordar el sembrado de ejemplos por workspace). */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Law = typeof laws.$inferSelect;
export type LawArticleRow = typeof lawArticles.$inferSelect;
export type AttemptRow = typeof attempts.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
