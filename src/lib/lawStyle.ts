export interface FolderStyle {
  body: string;
  tab: string;
  edge: string;
  ink: string;
  soft: string;
}

export const FOLDER_STYLES: Record<string, FolderStyle> = {
  amarillo: { body: "#fde68a", tab: "#fcd34d", edge: "#d4a017", ink: "#78350f", soft: "#fef3c7" },
  azul: { body: "#bfdbfe", tab: "#93c5fd", edge: "#3b82f6", ink: "#1e3a8a", soft: "#dbeafe" },
  verde: { body: "#bbf7d0", tab: "#86efac", edge: "#22c55e", ink: "#14532d", soft: "#dcfce7" },
  rosa: { body: "#fbcfe8", tab: "#f9a8d4", edge: "#ec4899", ink: "#831843", soft: "#fce7f3" },
  lila: { body: "#ddd6fe", tab: "#c4b5fd", edge: "#8b5cf6", ink: "#4c1d95", soft: "#ede9fe" },
  crema: { body: "#fde7c3", tab: "#f5cf94", edge: "#c2873a", ink: "#78350f", soft: "#fef3e0" },
};

export function folderStyle(id: string): FolderStyle {
  return FOLDER_STYLES[id] ?? FOLDER_STYLES.amarillo;
}

/* Tipos del lado cliente para las respuestas de la API */

export interface LawListItem {
  id: number;
  name: string;
  shortName: string;
  description: string;
  boeId: string;
  opos: string;
  color: string;
  icon: string;
  branch: string;
  source: string;
  articleCount: number;
  createdAt: string;
  stats: {
    attempts: number;
    avgGrade: number;
    bestGrade: number;
    lastAt: string | null;
    notes: number;
  };
}

export interface ArticleItem {
  id: number;
  kind: string;
  number: string;
  block: string;
  chapter: string;
  rubric: string;
  body: string;
  position: number;
}

export interface AttemptListItem {
  id: number;
  kind: string;
  title: string;
  scope: string;
  score: number;
  wrong: number;
  blank: number;
  total: number;
  durationSec: number;
  createdAt: string;
}
