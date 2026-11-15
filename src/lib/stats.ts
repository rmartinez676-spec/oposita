import { gradeOf, type AnswerDetail } from "./quizTypes";

export interface AttemptLite {
  id: number;
  lawId: number;
  kind: string;
  title: string;
  score: number;
  wrong: number;
  blank: number;
  total: number;
  durationSec: number;
  createdAt: Date | string;
  answers?: AnswerDetail[];
}

export interface AttemptPoint {
  id: number;
  lawId: number;
  kind: string;
  title: string;
  createdAt: string;
  grade: number;
  score: number;
  wrong: number;
  blank: number;
  total: number;
  durationSec: number;
}

export interface WeakArticle {
  articleId: number;
  label: string;
  seen: number;
  wrong: number;
  rate: number;
}

export interface StatsSummary {
  attempts: number;
  tests: number;
  games: number;
  avgGrade: number;
  bestGrade: number;
  totalSeconds: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracy: number;
  byKind: { kind: string; count: number; avgGrade: number }[];
  points: AttemptPoint[];
  weak: WeakArticle[];
}

export function summarizeAttempts(rows: AttemptLite[], opts: { withWeak?: boolean } = {}): StatsSummary {
  const sorted = [...rows].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const points: AttemptPoint[] = sorted.map((r) => ({
    id: r.id,
    lawId: r.lawId,
    kind: r.kind,
    title: r.title,
    createdAt: new Date(r.createdAt).toISOString(),
    grade: Math.round(gradeOf(r) * 10) / 10,
    score: r.score,
    wrong: r.wrong,
    blank: r.blank,
    total: r.total,
    durationSec: r.durationSec,
  }));

  const grades = points.map((p) => p.grade);
  const kinds = new Map<string, number[]>();
  for (const p of points) kinds.set(p.kind, [...(kinds.get(p.kind) ?? []), p.grade]);

  let answered = 0;
  let correct = 0;
  const weakMap = new Map<number, WeakArticle>();
  for (const r of sorted) {
    for (const a of r.answers ?? []) {
      if (a.correct === null) continue;
      answered++;
      if (a.correct) correct++;
      if (opts.withWeak) {
        const w = weakMap.get(a.articleId) ?? {
          articleId: a.articleId,
          label: a.articleLabel,
          seen: 0,
          wrong: 0,
          rate: 0,
        };
        w.seen++;
        if (!a.correct) w.wrong++;
        weakMap.set(a.articleId, w);
      }
    }
  }

  const weak = [...weakMap.values()]
    .filter((w) => w.wrong > 0)
    .map((w) => ({ ...w, rate: w.wrong / w.seen }))
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
    .slice(0, 8);

  return {
    attempts: points.length,
    tests: points.filter((p) => p.kind === "test").length,
    games: points.filter((p) => p.kind !== "test").length,
    avgGrade: grades.length ? Math.round((grades.reduce((s, g) => s + g, 0) / grades.length) * 10) / 10 : 0,
    bestGrade: grades.length ? Math.max(...grades) : 0,
    totalSeconds: points.reduce((s, p) => s + p.durationSec, 0),
    questionsAnswered: answered,
    questionsCorrect: correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    byKind: [...kinds.entries()].map(([kind, g]) => ({
      kind,
      count: g.length,
      avgGrade: Math.round((g.reduce((s, x) => s + x, 0) / g.length) * 10) / 10,
    })),
    points: points.slice(-200),
    weak,
  };
}

/** Día local YYYY-MM-DD */
export function localDay(d: Date | string): string {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

export function dailyCounts(points: { createdAt: string }[], days = 14): { day: string; label: string; count: number }[] {
  const out: { day: string; label: string; count: number }[] = [];
  const counts = new Map<string, number>();
  for (const p of points) counts.set(localDay(p.createdAt), (counts.get(localDay(p.createdAt)) ?? 0) + 1);
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = localDay(d);
    out.push({
      day: key,
      label: d.toLocaleDateString("es-ES", { weekday: "narrow" }),
      count: counts.get(key) ?? 0,
    });
  }
  return out;
}

export function streakDays(points: { createdAt: string }[]): number {
  const days = new Set(points.map((p) => localDay(p.createdAt)));
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    if (days.has(localDay(d))) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}
