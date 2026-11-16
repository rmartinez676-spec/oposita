/* Tipos compartidos entre servidor (generador / API) y cliente (tests y juegos) */

export type QuestionType = "cloze" | "article" | "vf";

export interface Question {
  id: string;
  type: QuestionType;
  /** Enunciado de la pregunta */
  prompt: string;
  /** Texto literal de la ley que se cita (hueco, afirmación o fragmento) */
  statement?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  articleId: number;
  articleLabel: string;
}

export interface AnswerDetail {
  qid: string;
  articleId: number;
  articleLabel: string;
  /** null = en blanco */
  chosen: number | null;
  /** null = en blanco */
  correct: boolean | null;
}

export type AttemptKind = "test" | "vf" | "parejas" | "ahorcado" | "ordena";

export const KIND_INFO: Record<AttemptKind, { label: string; emoji: string }> = {
  test: { label: "Test", emoji: "📝" },
  vf: { label: "V/F relámpago", emoji: "⚡" },
  parejas: { label: "Parejas", emoji: "🃏" },
  ahorcado: { label: "Ahorcado jurídico", emoji: "☕" },
  ordena: { label: "Ordena la frase", emoji: "🧩" },
};

export interface Scope {
  mode: "all" | "block" | "range";
  block?: string;
  from?: number;
  to?: number;
}

/** Nota sobre 10. En test se aplica la penalización clásica de oposiciones (−1/3 por fallo). */
export function gradeOf(a: { kind: string; score: number; wrong: number; total: number }): number {
  if (a.total <= 0) return 0;
  if (a.kind === "test") {
    return Math.max(0, ((a.score - a.wrong / 3) / a.total) * 10);
  }
  return Math.max(0, (a.score / a.total) * 10);
}

export function fmtGrade(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}m ${s.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
}
