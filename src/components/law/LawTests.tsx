"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, History, Loader2, Play, RotateCcw, Target, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { fmtDuration, fmtGrade, gradeOf, KIND_INFO, type AnswerDetail, type AttemptKind, type Question, type QuestionType, type Scope } from "@/lib/quizTypes";
import type { ArticleItem, AttemptListItem, LawListItem } from "@/lib/lawStyle";
import { timeAgo } from "@/components/LawFolderCard";
import ScopePicker from "./ScopePicker";
import TestRunner from "@/components/TestRunner";
import ConfirmDialog from "@/components/ConfirmDialog";

type LawRow = Omit<LawListItem, "stats">;

interface AttemptFull extends AttemptListItem {
  questions: Question[] | null;
  answers: AnswerDetail[];
}

interface RunnerState {
  key: number;
  title: string;
  scopeLabel: string;
  questions: Question[];
  instant: boolean;
  review?: { answers: AnswerDetail[]; durationSec: number };
}

const TYPE_OPTS: { id: QuestionType; label: string; hint: string }[] = [
  { id: "cloze", label: "Completa el hueco", hint: "Plazos, cifras y órganos" },
  { id: "vf", label: "Verdadero / Falso", hint: "Afirmaciones literales" },
  { id: "article", label: "¿Qué artículo es?", hint: "Localiza el artículo" },
];

interface LawTestsProps {
  law: LawRow;
  articles: ArticleItem[];
  preset: { scope: Scope; key: number } | null;
  /** Si es true, al montar lanza directamente el test de fallos */
  autoFallos?: boolean;
  onAutoHandled?: () => void;
  onChanged: () => void;
}

export default function LawTests({ law, articles, preset, autoFallos = false, onAutoHandled, onChanged }: LawTestsProps) {
  const [count, setCount] = useState(20);
  const [types, setTypes] = useState<QuestionType[]>(["cloze", "vf", "article"]);
  const [scope, setScope] = useState<Scope>({ mode: "all" });
  const [instant, setInstant] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<AttemptListItem[] | null>(null);
  const [runner, setRunner] = useState<RunnerState | null>(null);
  const [toDelete, setToDelete] = useState<AttemptListItem | null>(null);
  const configRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await api<AttemptListItem[]>(`/api/laws/${law.id}/attempts`));
    } catch {
      setHistory([]);
    }
  }, [law.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (preset) {
      setScope(preset.scope);
      configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [preset]);

  const toggleType = (t: QuestionType) =>
    setTypes((cur) => (cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : [...cur, t]));

  const generate = async (mode?: "fallos") => {
    setGenerating(true);
    setError("");
    try {
      const r = await api<{ questions: Question[]; scopeLabel: string }>(`/api/laws/${law.id}/generate`, {
        method: "POST",
        json: { kind: "test", count, types, scope, mode },
      });
      setRunner({
        key: Date.now(),
        title: mode === "fallos" ? "Test de mis fallos" : `Test de ${law.shortName || law.name}`,
        scopeLabel: r.scopeLabel,
        questions: r.questions,
        instant,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el test");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (autoFallos) {
      onAutoHandled?.();
      generate("fallos");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFallos]);

  const openAttempt = async (a: AttemptListItem, review: boolean) => {
    try {
      const full = await api<AttemptFull>(`/api/attempts/${a.id}`);
      if (!full.questions?.length) throw new Error("Este intento no guarda las preguntas");
      setRunner({
        key: Date.now(),
        title: full.title,
        scopeLabel: full.scope,
        questions: full.questions,
        instant,
        review: review ? { answers: full.answers, durationSec: full.durationSec } : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir el test");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    try {
      await api(`/api/attempts/${target.id}`, { method: "DELETE" });
      setHistory((h) => (h ? h.filter((x) => x.id !== target.id) : h));
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  const tests = (history ?? []).filter((h) => h.kind === "test");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ------------------------------ Generador ------------------------------ */}
      <section ref={configRef} className="scroll-mt-28">
        <div className="relative rounded-lg bg-[#fffdf4] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10">
          <div className="tape left-8 top-[-9px]" style={{ backgroundColor: "rgba(96,165,250,0.45)", transform: "rotate(-3deg)" }} />
          <h2 className="font-hand-caveat text-[34px] font-bold leading-none text-amber-950">Generar un test</h2>
          <p className="mt-1 text-[14px] leading-snug text-stone-600">
            Preguntas hechas con el texto literal de la ley. Cada fallo te explica el artículo.
          </p>

          <div className="mt-4">
            <p className="font-hand-caveat text-[20px] font-semibold leading-none text-amber-900">¿Cuántas preguntas?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`h-10 min-w-[52px] rounded-full px-4 font-hand-caveat text-[22px] font-bold shadow-sm ring-1 transition-all hover:-rotate-2 ${
                    count === n ? "bg-amber-500 text-white ring-amber-700/40" : "bg-white text-stone-600 ring-black/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="font-hand-caveat text-[20px] font-semibold leading-none text-amber-900">Tipos de pregunta</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {TYPE_OPTS.map((t) => {
                const on = types.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleType(t.id)}
                    className={`rounded-xl px-3 py-2 text-left shadow-sm ring-1 transition-all hover:-rotate-1 ${
                      on ? "bg-white ring-2 ring-amber-600" : "bg-white/60 ring-black/10"
                    }`}
                  >
                    <p className={`text-[14px] font-bold leading-tight ${on ? "text-amber-900" : "text-stone-500"}`}>{t.label}</p>
                    <p className="text-[11px] leading-tight text-stone-500">{t.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="font-hand-caveat text-[20px] font-semibold leading-none text-amber-900">¿De qué parte de la ley?</p>
            <div className="mt-2">
              <ScopePicker articles={articles} value={scope} onChange={setScope} />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {[
              { v: true, l: "Modo estudio", d: "Te corrige al momento" },
              { v: false, l: "Modo examen", d: "Corrige al final" },
            ].map((m) => (
              <button
                key={m.l}
                type="button"
                onClick={() => setInstant(m.v)}
                className={`flex-1 rounded-xl px-3 py-2 text-left shadow-sm ring-1 transition-all hover:-rotate-1 ${
                  instant === m.v ? "bg-white ring-2 ring-teal-600" : "bg-white/60 ring-black/10"
                }`}
              >
                <p className={`text-[14px] font-bold leading-tight ${instant === m.v ? "text-teal-800" : "text-stone-500"}`}>{m.l}</p>
                <p className="text-[11px] text-stone-500">{m.d}</p>
              </button>
            ))}
          </div>

          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm leading-snug text-rose-700 ring-1 ring-rose-200">{error}</p>}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => generate()}
              disabled={generating}
              className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-3 text-[16px] font-bold text-white disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              {generating ? "Preparando…" : "Empezar test"}
            </button>
            <button
              type="button"
              onClick={() => generate("fallos")}
              disabled={generating}
              className="flex items-center gap-2 rounded-full bg-teal-700 px-5 py-3 text-[15px] font-bold text-white shadow-[0_3px_0_#115e59] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none disabled:opacity-60"
            >
              <Target className="h-4.5 w-4.5" /> Test con mis fallos
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------ Historial ------------------------------ */}
      <section>
        <h2 className="flex items-center gap-2 font-hand-caveat text-[34px] font-bold leading-none text-amber-950">
          <History className="h-6 w-6 text-amber-700" /> Tests realizados
        </h2>
        {history === null ? (
          <div className="mt-4 space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/60" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="mt-4 -rotate-1 rounded-lg bg-[#fef6c8] p-6 text-center shadow ring-1 ring-black/5">
            <p className="font-hand-caveat text-[30px] font-bold leading-none text-amber-950">Aún no hay ningún test</p>
            <p className="mt-1 text-[14px] text-stone-600">Haz el primero y aquí quedará tu historial con notas, tiempos y repaso de cada pregunta.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {history.map((a) => {
              const grade = gradeOf(a);
              const good = grade >= 5;
              const info = KIND_INFO[a.kind as AttemptKind] ?? KIND_INFO.test;
              return (
                <li key={a.id} className="note-in flex items-center gap-3 rounded-xl bg-white/85 p-3 shadow-sm ring-1 ring-black/5" style={{ ["--rot" as string]: "0deg" }}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[22px]">{info.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold leading-tight text-stone-800">{a.title || info.label}</p>
                    <p className="truncate text-[12px] text-stone-500">
                      {a.scope} · {a.score}/{a.total} · {fmtDuration(a.durationSec)} · {timeAgo(a.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 font-hand-caveat text-[26px] font-bold leading-none ${
                      good ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {fmtGrade(grade)}
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    {a.kind === "test" && (
                      <>
                        <button type="button" title="Revisar respuestas" aria-label="Revisar respuestas" onClick={() => openAttempt(a, true)} className="rounded-full p-2 text-stone-500 hover:bg-amber-100 hover:text-amber-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" title="Repetir este test" aria-label="Repetir este test" onClick={() => openAttempt(a, false)} className="rounded-full p-2 text-stone-500 hover:bg-amber-100 hover:text-amber-800">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button type="button" title="Borrar" aria-label="Borrar" onClick={() => setToDelete(a)} className="rounded-full p-2 text-stone-400 hover:bg-rose-100 hover:text-rose-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {history && history.length > 0 && tests.length === 0 && (
          <p className="mt-3 text-sm italic text-stone-500">Aquí también aparecen tus partidas de juegos.</p>
        )}
      </section>

      {runner && (
        <TestRunner
          key={runner.key}
          lawId={law.id}
          title={runner.title}
          scopeLabel={runner.scopeLabel}
          questions={runner.questions}
          instant={runner.instant}
          review={runner.review}
          onClose={() => {
            setRunner(null);
            loadHistory();
            onChanged();
          }}
          onSaved={() => {
            loadHistory();
            onChanged();
          }}
          onRetry={() => setRunner({ ...runner, key: Date.now(), review: undefined })}
          onFallos={() => {
            setRunner(null);
            generate("fallos");
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Borrar este resultado?"
          message="Desaparecerá del historial y de tus estadísticas."
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
