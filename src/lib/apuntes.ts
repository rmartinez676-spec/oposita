/* ------------------------------------------------------------------ */
/*  Tipos y constantes compartidas de "Apuntes de Leyes"               */
/* ------------------------------------------------------------------ */

export interface NoteItem {
  id: number;
  lawId: number | null;
  title: string;
  lawName: string;
  article: string;
  category: string;
  content: string;
  paperColor: string;
  fontStyle: string;
  inkColor: string;
  isFavorite: boolean;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDraft {
  lawId: number | null;
  title: string;
  lawName: string;
  article: string;
  category: string;
  content: string;
  paperColor: string;
  fontStyle: string;
  inkColor: string;
  isFavorite: boolean;
  tags: string;
}

export const EMPTY_DRAFT: NoteDraft = {
  lawId: null,
  title: "",
  lawName: "",
  article: "",
  category: "Constitucional",
  content: "",
  paperColor: "crema",
  fontStyle: "caveat",
  inkColor: "azul",
  isFavorite: false,
  tags: "",
};

/* ------------------------- Ramas del Derecho ------------------------ */

export interface CategoryStyle {
  name: string;
  bg: string;
  text: string;
  dot: string;
  tape: string;
}

export const CATEGORIES: CategoryStyle[] = [
  { name: "Constitucional", bg: "#fee2e2", text: "#991b1b", dot: "#dc2626", tape: "rgba(248, 113, 113, 0.45)" },
  { name: "Civil", bg: "#dbeafe", text: "#1e40af", dot: "#2563eb", tape: "rgba(96, 165, 250, 0.45)" },
  { name: "Penal", bg: "#e7e5e4", text: "#292524", dot: "#44403c", tape: "rgba(120, 113, 108, 0.45)" },
  { name: "Administrativo", bg: "#ccfbf1", text: "#115e59", dot: "#0d9488", tape: "rgba(45, 212, 191, 0.45)" },
  { name: "Laboral", bg: "#ffedd5", text: "#9a3412", dot: "#ea580c", tape: "rgba(251, 146, 60, 0.45)" },
  { name: "Mercantil", bg: "#ede9fe", text: "#5b21b6", dot: "#7c3aed", tape: "rgba(167, 139, 250, 0.45)" },
  { name: "Procesal", bg: "#fce7f3", text: "#9d174d", dot: "#db2777", tape: "rgba(244, 114, 182, 0.45)" },
  { name: "Fiscal", bg: "#dcfce7", text: "#166534", dot: "#16a34a", tape: "rgba(74, 222, 128, 0.45)" },
  { name: "Internacional", bg: "#e0f2fe", text: "#075985", dot: "#0284c7", tape: "rgba(56, 189, 248, 0.45)" },
];

export function getCategory(name: string): CategoryStyle {
  return CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[0];
}

/* --------------------------- Tipos de papel ------------------------- */

export interface PaperStyle {
  id: string;
  name: string;
  bg: string;
  line: string;
  swatch: string;
}

export const PAPER_COLORS: PaperStyle[] = [
  { id: "crema", name: "Cuaderno", bg: "#fffdf4", line: "rgba(96, 140, 220, 0.20)", swatch: "#fffdf4" },
  { id: "amarillo", name: "Post-it", bg: "#fef6c8", line: "rgba(202, 138, 4, 0.16)", swatch: "#fde68a" },
  { id: "rosa", name: "Rosa", bg: "#fff0f4", line: "rgba(219, 39, 119, 0.13)", swatch: "#fbcfe8" },
  { id: "azul", name: "Celeste", bg: "#eef6ff", line: "rgba(37, 99, 235, 0.14)", swatch: "#bfdbfe" },
  { id: "verde", name: "Menta", bg: "#effdf3", line: "rgba(22, 163, 74, 0.14)", swatch: "#bbf7d0" },
  { id: "lila", name: "Lila", bg: "#f6f2ff", line: "rgba(124, 58, 237, 0.13)", swatch: "#ddd6fe" },
];

export function getPaper(id: string): PaperStyle {
  return PAPER_COLORS.find((p) => p.id === id) ?? PAPER_COLORS[0];
}

/* ------------------------------ Tintas ------------------------------ */

export interface InkStyle {
  id: string;
  name: string;
  hex: string;
}

export const INK_COLORS: InkStyle[] = [
  { id: "azul", name: "Boli azul", hex: "#2b3a8f" },
  { id: "negro", name: "Tinta negra", hex: "#2d2a26" },
  { id: "rojo", name: "Boli rojo", hex: "#b91c1c" },
  { id: "verde", name: "Verde", hex: "#15803d" },
  { id: "violeta", name: "Violeta", hex: "#6d28d9" },
];

export function getInk(id: string): InkStyle {
  return INK_COLORS.find((i) => i.id === id) ?? INK_COLORS[0];
}

/* --------------------------- Tipos de letra -------------------------- */

export interface FontStyle {
  id: string;
  name: string;
  className: string;
}

export const FONT_STYLES: FontStyle[] = [
  { id: "caveat", name: "Caveat", className: "font-hand-caveat" },
  { id: "kalam", name: "Kalam", className: "font-hand-kalam" },
  { id: "patrick", name: "Patrick", className: "font-hand-patrick" },
  { id: "shadows", name: "Shadows", className: "font-hand-shadows" },
];

export function getFont(id: string): FontStyle {
  return FONT_STYLES.find((f) => f.id === id) ?? FONT_STYLES[0];
}

/* ------------------------------ Helpers ------------------------------ */

const ROTATIONS = [-1.6, 1.1, -0.6, 1.6, -1.1, 0.7, -0.3, 1.3];

export function rotationFor(id: number): number {
  return ROTATIONS[Math.abs(id) % ROTATIONS.length];
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function tagList(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(content: string): number {
  return Math.max(1, Math.round(wordCount(content) / 130));
}
