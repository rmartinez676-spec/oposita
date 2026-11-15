"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Clock3, Eye, Flame, Lightbulb, RotateCcw, Target, X } from "lucide-react";
import { api, oposita } from "@/lib/client";
import { fmtDuration, fmtGrade, gradeOf, type AnswerDetail, type Question } from "@/lib/quizTypes";
import ConfirmDialog from "./ConfirmDialog";

interface TestRunnerProps {
  lawId: number;
  title: string;
  scopeLabel: string;
  questions: Question[];
  instant: boolean;
  /** Si viene, se muestra solo la revisión de un test ya realizado */
  review?: { answers: AnswerDetail[]; durationSec: number };
  onClose: () => void;
  onSaved: () => void;
  onRetry: () => void;
  onFallos: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

function Statement({ q }: { q: Question }) {
  const text = q.statement ?? "";
  const parts = text.split("_____");
  return (
    <p className="font-hand-kalam text-[20px] leading-[34px] text-[#2b3a8f] sm:text-[22px]">
      {q.type === "vf" || q.type === "article" ? "«" : ""}
      {parts.length === 2 ? (
        <>
          {parts[0]}
          <span className="mx-1 inline-block min-w-[96px] border-b-[3px] border-dashed border-amber-600 align-baseline">&nbsp;</span>
          {parts[1]}
        </>
      ) : (
        text
      )}
      {q.type === "vf" || q.type === "article" ? "»" : ""}
    </p>
  );
}

export default function TestRunner({
  lawId,
  title,
  scopeLabel,
  questions,
  instant,
  review,
  onClose,
  onSaved,
  onRetry,
  onFallos,
}: TestRunnerProps) {
  const n = questions.length;
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<(number | null)[]>(() =>
    review ? questions.map((q) => review.answers.find((a) => a.qid === q.id)?.chosen ?? null) : Array(n).fill(null),
  );
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"run" | "result">(review ? "result" : "run");
  const [elapsed, setElapsed] = useState(review?.durationSec ?? 0);
  const [streak, setStreak] = useState(0);
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [saveError, setSaveError] = useState("");
  const startRef = useRef(Date.now());
  const savedRef = useRef(false);

  useEffect(() => {
    oposita({ focus: true });
    return () => oposita({ focus: false });
  }, []);

  useEffect(() => {
    if (phase !== "run") return;
    const t = window.setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const q = questions[idx];

  const summary = useMemo(() => {
    let score = 0;
    let wrong = 0;
    let blank = 0;
    questions.forEach((qu, i) => {
      const c = chosen[i];
      if (c === null || c === undefined) blank++;
      else if (c === qu.correctIndex) score++;
      else wrong++;
    });
    const grade = gradeOf({ kind: "test", score, wrong, total: n });
    return { score, wrong, blank, grade };
  }, [chosen, questions, n]);

  const finish = useCallback(
    async (finalChosen: (number | null)[]) => {
      const seconds = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
      setElapsed(seconds);
      setPhase("result");
      let score = 0;
      let wrong = 0;
      let blank = 0;
      const answers: AnswerDetail[] = questions.map((qu, i) => {
        const c = finalChosen[i];
        const correct = c === null ? null : c === qu.correctIndex;
        if (c === null) blank++;
        else if (correct) score++;
        else wrong++;
        return { qid: qu.id, articleId: qu.articleId, articleLabel: qu.articleLabel, chosen: c, correct };
      });
      const grade = gradeOf({ kind: "test", score, wrong, total: n });
      oposita(
        grade >= 5
          ? { say: grade >= 8 ? "¡Matrícula de honor! 🎉" : `¡Aprobado con un ${fmtGrade(grade)}! Sigue así.`, mood: "cheer" }
          : { say: "No pasa nada: revisa los fallos y repite. ¡Así se aprende!", mood: "think" },
      );
      if (savedRef.current) return;
      savedRef.current = true;
      try {
        await api(`/api/laws/${lawId}/attempts`, {
          method: "POST",
          json: { kind: "test", title, scope: scopeLabel, score, wrong, blank, total: n, durationSec: seconds, questions, answers },
        });
        onSaved();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "No se pudo guardar el resultado");
      }
    },
    [lawId, title, scopeLabel, questions, n, onSaved],
  );

  const select = useCallback(
    (opt: number) => {
      if (phase !== "run") return;
      if (instant && revealed) return;
      setChosen((prev) => {
        const next = [...prev];
        next[idx] = opt;
        return next;
      });
      if (instant) {
        setRevealed(true);
        const ok = opt === questions[idx].correctIndex;
        if (ok) {
          setStreak((s) => {
            if (s + 1 === 4) oposita({ say: "¡Racha de 4! Estás on fire 🔥", mood: "cheer" });
            return s + 1;
          });
        } else {
          setStreak(0);
          setShakeKey((k) => k + 1);
        }
      }
    },
    [phase, instant, revealed, idx, questions],
  );

  const next = useCallback(
    (skip = false) => {
      if (phase !== "run") return;
      let nextChosen = chosen;
      if (skip) {
        nextChosen = [...chosen];
        nextChosen[idx] = null;
        setChosen(nextChosen);
        setStreak(0);
      }
      if (idx < n - 1) {
        setIdx(idx + 1);
        setRevealed(false);
      } else {
        finish(nextChosen);
      }
    },
    [phase, chosen, idx, n, finish],
  );

  useEffect(() => {
    if (phase !== "run") return;
    const onKey = (e: KeyboardEvent) => {
      if (confirmExit) return;
      const k = e.key.toLowerCase();
      const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      if (k in map && map[k] < questions[idx].options.length) select(map[k]);
      else if (k === "enter" || k === "arrowright") {
        if (!instant || revealed) next(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, confirmExit, questions, idx, select, next, instant, revealed]);

  const requestClose = () => {
    if (phase === "run" && chosen.some((c) => c !== null)) setConfirmExit(true);
    else onClose();
  };

  const progress = phase === "run" ? ((idx + (revealed ? 1 : 0)) / n) * 100 : 100;

  /* ------------------------------ Resultado ------------------------------ */
  if (phase === "result") {
    const passed = summary.grade >= 5;
    const list = questions
      .map((qu, i) => ({ qu, i, c: chosen[i] }))
      .filter(({ qu, c }) => !onlyWrong || (c !== null && c !== undefined && c !== qu.correctIndex) || c === null || c === undefined);
    const shown = onlyWrong ? list.filter(({ qu, c }) => c !== qu.correctIndex) : list;

    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="fade-in fixed inset-0 bg-stone-900/65 backdrop-blur-[3px]" onClick={onClose} />
        <div className="relative mx-auto w-full max-w-3xl px-3 py-6 sm:py-10">
          <div
            className="paper-lines-lg pop-in relative overflow-hidden rounded-[6px] px-5 py-8 shadow-2xl ring-1 ring-black/15 sm:px-10"
            style={{ ["--paper-bg" as string]: "#fffdf4", ["--paper-line" as string]: "rgba(96,140,220,0.2)" }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-stone-600 shadow ring-1 ring-black/10 transition-transform hover:rotate-90 hover:text-rose-700"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-stone-500">{review ? "Revisión del test" : "Resultado"} · {scopeLabel}</p>
            <h2 className="font-hand-caveat mt-1 pr-10 text-[36px] font-bold leading-[1.05] text-[#2b3a8f]">{title}</h2>

            <div className="mt-5 flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="font-hand-caveat text-[78px] font-bold leading-none" style={{ color: passed ? "#15803d" : "#b91c1c" }}>
                  {fmtGrade(summary.grade)}
                </p>
                <p className="-mt-1 text-[12px] font-bold uppercase tracking-wide text-stone-500">sobre 10</p>
              </div>
              <div
                className={`stamp-in rounded-lg border-[5px] border-double px-5 py-1 font-hand-caveat text-[44px] font-bold uppercase leading-tight tracking-wider ${
                  passed ? "border-emerald-700 text-emerald-700" : "border-rose-700 text-rose-700"
                }`}
              >
                {passed ? "Aprobado" : "Suspenso"}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { v: summary.score, l: "aciertos", c: "#15803d", bg: "#dcfce7" },
                  { v: summary.wrong, l: "fallos", c: "#b91c1c", bg: "#fee2e2" },
                  { v: summary.blank, l: "en blanco", c: "#57534e", bg: "#f5f5f4" },
                  { v: fmtDuration(elapsed), l: "tiempo", c: "#1e40af", bg: "#dbeafe" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg px-3 py-2 ring-1 ring-black/5" style={{ background: s.bg }}>
                    <p className="font-hand-caveat text-[28px] font-bold leading-none" style={{ color: s.c }}>
                      {s.v}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-stone-500">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[12px] text-stone-500">
              Nota estilo oposición: (aciertos − fallos ÷ 3) ÷ preguntas × 10. Las preguntas en blanco no penalizan.
            </p>
            {saveError && <p className="mt-2 text-sm text-rose-700">{saveError}</p>}

            <div className="mt-5 flex flex-wrap gap-2.5">
              {!review && (
                <button type="button" onClick={onRetry} className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold text-white">
                  <RotateCcw className="h-4 w-4" /> Repetir test
                </button>
              )}
              {summary.wrong > 0 || review ? (
                <button
                  type="button"
                  onClick={onFallos}
                  className="flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-[14px] font-bold text-white shadow-[0_3px_0_#115e59] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
                >
                  <Target className="h-4 w-4" /> Test con mis fallos
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t-2 border-dashed border-stone-300 pt-4">
              <h3 className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">Repaso de respuestas</h3>
              <button
                type="button"
                onClick={() => setOnlyWrong((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold shadow-sm ring-1 transition-all ${
                  onlyWrong ? "bg-rose-500 text-white ring-rose-700/40" : "bg-white text-stone-600 ring-black/10"
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> Solo fallos y blancos
              </button>
            </div>

            <ol className="mt-4 space-y-4">
              {shown.length === 0 && <li className="text-center italic text-stone-500">¡Ni un solo fallo! Perfecto.</li>}
              {shown.map(({ qu, i, c }) => {
                const state = c === null || c === undefined ? "blank" : c === qu.correctIndex ? "ok" : "ko";
                return (
                  <li key={qu.id} className="rounded-xl bg-white/85 p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-hand-caveat text-[24px] font-bold leading-none text-stone-700">{i + 1}.</span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">{qu.articleLabel}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          state === "ok" ? "bg-emerald-100 text-emerald-800" : state === "ko" ? "bg-rose-100 text-rose-800" : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {state === "ok" ? "Acierto" : state === "ko" ? "Fallo" : "En blanco"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13px] text-stone-500">{qu.prompt}</p>
                    <div className="mt-1">
                      <Statement q={qu} />
                    </div>
                    <ul className="mt-2 space-y-1">
                      {qu.options.map((o, oi) => {
                        const isCorrect = oi === qu.correctIndex;
                        const isChosen = oi === c;
                        return (
                          <li
                            key={oi}
                            className={`flex items-start gap-2 rounded-lg px-3 py-1.5 text-[14px] ${
                              isCorrect ? "bg-emerald-100 font-bold text-emerald-900" : isChosen ? "bg-rose-100 text-rose-900 line-through decoration-2" : "text-stone-500"
                            }`}
                          >
                            <span className="font-bold">{LETTERS[oi]})</span>
                            <span className="flex-1">{o}</span>
                            {isCorrect && <Check className="h-4 w-4 shrink-0" />}
                            {isChosen && !isCorrect && <X className="h-4 w-4 shrink-0" />}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-snug text-amber-900 ring-1 ring-amber-600/15">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{qu.explanation}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ Realización ------------------------------ */
  const answered = chosen[idx];
  const isCorrect = revealed && answered === q.correctIndex;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fade-in fixed inset-0 bg-stone-900/70 backdrop-blur-[3px]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-3 py-6">
        <div className="mb-3 flex items-center gap-3 text-white">
          <div className="min-w-0 flex-1">
            <p className="truncate font-hand-caveat text-[26px] font-bold leading-none">{title}</p>
            <p className="truncate text-[12px] uppercase tracking-[0.12em] text-amber-100/80">
              {scopeLabel} · {instant ? "modo estudio" : "modo examen"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold ring-1 ring-white/20">
            <Clock3 className="h-4 w-4" /> {fmtDuration(elapsed)}
          </span>
          {streak >= 2 && instant && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-3 py-1.5 text-sm font-bold">
              <Flame className="h-4 w-4" /> {streak}
            </span>
          )}
          <button
            type="button"
            aria-label="Salir del test"
            onClick={requestClose}
            className="rounded-full bg-stone-800 p-2.5 text-white shadow-md ring-1 ring-white/20 transition-transform hover:rotate-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/25 ring-1 ring-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-center text-sm text-amber-100/90">
            Pregunta {idx + 1} de {n}
          </p>
        </div>

        <div
          key={`${q.id}-${shakeKey}`}
          className={`paper-lines-lg paper-margin pop-in relative overflow-hidden rounded-[6px] py-7 pl-[64px] pr-5 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/15 sm:pr-8 ${
            revealed && !isCorrect ? "shake" : ""
          }`}
          style={{ ["--paper-bg" as string]: "#fffdf4", ["--paper-line" as string]: "rgba(96,140,220,0.2)" }}
        >
          <div className="tape left-1/2 top-[-8px]" style={{ backgroundColor: "rgba(251,191,36,0.5)", transform: "translateX(-50%) rotate(-2deg)" }} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 ring-1 ring-amber-600/20">
              {instant || revealed ? q.articleLabel : q.type === "article" ? "¿Qué artículo?" : "Artículo oculto"}
            </span>
            <span className="text-[13px] font-bold text-stone-500">{q.prompt}</span>
          </div>
          <div className="mt-2">
            <Statement q={q} />
          </div>

          <div className="mt-4 space-y-2.5">
            {q.options.map((o, oi) => {
              const isChosen = answered === oi;
              const isRight = oi === q.correctIndex;
              let cls = "bg-white/85 ring-black/10 text-stone-800";
              if (revealed) {
                if (isRight) cls = "bg-emerald-100 ring-emerald-600/50 text-emerald-900";
                else if (isChosen) cls = "bg-rose-100 ring-rose-600/50 text-rose-900";
                else cls = "bg-white/50 ring-black/5 text-stone-400";
              } else if (isChosen) cls = "bg-amber-100 ring-amber-600 text-amber-950";
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={revealed && instant}
                  onClick={() => select(oi)}
                  className={`option-btn flex w-full items-start gap-3 rounded-xl px-3.5 py-2.5 text-left text-[16px] leading-snug shadow-sm ring-2 ${cls}`}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-hand-caveat text-[19px] font-bold ${
                      isChosen || (revealed && isRight) ? "border-current" : "border-stone-300 text-stone-500"
                    }`}
                  >
                    {revealed && isRight ? <Check className="h-4 w-4" /> : revealed && isChosen ? <X className="h-4 w-4" /> : LETTERS[oi]}
                  </span>
                  <span className="flex-1 pt-0.5">{o}</span>
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="pop-in mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[14px] leading-snug text-amber-950 ring-1 ring-amber-600/20">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">{isCorrect ? "¡Correcto!" : "Ojo, esta era la buena:"}</p>
                <p className="mt-0.5">{q.explanation}</p>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            {!(instant && revealed) ? (
              <button
                type="button"
                onClick={() => next(true)}
                className="rounded-full bg-white/85 px-4 py-2 text-[13px] font-bold text-stone-500 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1 hover:text-stone-800"
              >
                Dejar en blanco
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => next(false)}
              disabled={instant ? !revealed : false}
              className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-2.5 text-[15px] font-bold text-white disabled:opacity-40"
            >
              {idx === n - 1 ? "Terminar test" : "Siguiente"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-amber-100/70">Atajos: 1–4 o A–D para responder · Intro para avanzar</p>
      </div>

      {confirmExit && (
        <ConfirmDialog
          title="¿Abandonar el test?"
          message="Si sales ahora no se guardará este intento ni sus estadísticas."
          confirmLabel="Sí, salir"
          cancelLabel="Seguir con el test"
          onConfirm={onClose}
          onCancel={() => setConfirmExit(false)}
        />
      )}
    </div>
  );
}
