"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Flame, Loader2, RotateCcw, Shuffle, X } from "lucide-react";
import { api, oposita } from "@/lib/client";
import { fmtDuration, fmtGrade, gradeOf, KIND_INFO, type AnswerDetail, type AttemptKind, type Question, type Scope } from "@/lib/quizTypes";
import type { HangmanItem, OrderItem, PairItem } from "@/lib/generator";

interface GenData {
  scopeLabel: string;
  items?: Question[];
  pairs?: PairItem[];
  words?: HangmanItem[];
  sentences?: OrderItem[];
}

interface GameResult {
  score: number;
  wrong: number;
  total: number;
  answers: AnswerDetail[];
  seconds?: number;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ------------------------------------------------------------------ */
/*  1. V/F relámpago                                                   */
/* ------------------------------------------------------------------ */

function VfGame({ items, onFinish }: { items: Question[]; onFinish: (r: GameResult) => void }) {
  const TOTAL = 60;
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(TOTAL);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const answersRef = useRef<AnswerDetail[]>([]);
  const doneRef = useRef(false);
  const endAt = useRef(Date.now() + TOTAL * 1000);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const a = answersRef.current;
    const ok = a.filter((x) => x.correct).length;
    onFinish({ score: ok, wrong: a.length - ok, total: a.length, answers: a, seconds: Math.min(TOTAL, Math.round(TOTAL - (endAt.current - Date.now()) / 1000)) });
  }, [onFinish]);

  useEffect(() => {
    const t = window.setInterval(() => {
      const l = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) finish();
    }, 200);
    return () => window.clearInterval(t);
  }, [finish]);

  const answer = useCallback(
    (saysTrue: boolean) => {
      if (doneRef.current) return;
      const q = items[idx];
      const truth = q.correctIndex === 0;
      const ok = saysTrue === truth;
      answersRef.current.push({
        qid: q.id,
        articleId: q.articleId,
        articleLabel: q.articleLabel,
        chosen: saysTrue ? 0 : 1,
        correct: ok,
      });
      if (ok) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const ns = s + 1;
          setBest((b) => Math.max(b, ns));
          return ns;
        });
        setFeedback({ ok: true, text: "¡Correcto!" });
      } else {
        setWrong((w) => w + 1);
        setStreak(0);
        setFeedback({ ok: false, text: q.explanation });
      }
      if (idx + 1 >= items.length) finish();
      else setIdx(idx + 1);
    },
    [idx, items, finish],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "v" || k === "arrowleft") answer(true);
      else if (k === "f" || k === "arrowright") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  const q = items[idx];
  const danger = left <= 10;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className={`font-hand-caveat text-[44px] font-bold leading-none ${danger ? "text-rose-600" : "text-amber-900"}`}>{left}s</span>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">✔ {score}</span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">✖ {wrong}</span>
          <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-orange-700">
            <Flame className="h-4 w-4" /> {streak} <span className="font-normal opacity-70">(mejor {best})</span>
          </span>
        </div>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-200">
        <div className={`h-full rounded-full transition-all duration-200 ${danger ? "bg-rose-500" : "bg-amber-500"}`} style={{ width: `${(left / TOTAL) * 100}%` }} />
      </div>

      <div key={q.id} className="pop-in mt-5 rounded-xl bg-white/90 p-5 shadow-md ring-1 ring-black/5">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">¿Verdadero o falso?</span>
        <p className="mt-2 font-hand-kalam text-[20px] leading-[1.55] text-[#2b3a8f]">«{q.statement}»</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => answer(true)}
          className="rounded-2xl bg-emerald-600 py-4 font-hand-caveat text-[32px] font-bold text-white shadow-[0_5px_0_#065f46] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          ✔ Verdadero
        </button>
        <button
          type="button"
          onClick={() => answer(false)}
          className="rounded-2xl bg-rose-600 py-4 font-hand-caveat text-[32px] font-bold text-white shadow-[0_5px_0_#881337] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          ✖ Falso
        </button>
      </div>

      <div className="mt-3 min-h-[64px]">
        {feedback && (
          <p
            key={`${idx}-${feedback.ok}`}
            className={`fade-in rounded-lg px-3 py-2 text-[13px] leading-snug ${feedback.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
          >
            {feedback.ok ? "✔ " : "✖ "}
            {feedback.text}
          </p>
        )}
      </div>
      <p className="text-center text-xs text-stone-400">Atajos: V / ← verdadero · F / → falso</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Parejas                                                         */
/* ------------------------------------------------------------------ */

interface MemCard {
  key: string;
  pairId: number;
  kind: "label" | "text";
  text: string;
}

function ParejasGame({ pairs, onFinish }: { pairs: PairItem[]; onFinish: (r: GameResult) => void }) {
  const cards = useMemo<MemCard[]>(
    () =>
      shuffle(
        pairs.flatMap((p) => [
          { key: `${p.articleId}-l`, pairId: p.articleId, kind: "label" as const, text: p.label },
          { key: `${p.articleId}-t`, pairId: p.articleId, kind: "text" as const, text: p.text },
        ]),
      ),
    [pairs],
  );
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [fails, setFails] = useState(0);
  const [locked, setLocked] = useState(false);
  const missed = useRef(new Set<number>());

  const flip = (i: number) => {
    if (locked || flipped.includes(i) || matched.has(cards[i].pairId)) return;
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      const [a, b] = nf.map((x) => cards[x]);
      setLocked(true);
      if (a.pairId === b.pairId && a.kind !== b.kind) {
        window.setTimeout(() => {
          const nm = new Set(matched);
          nm.add(a.pairId);
          setMatched(nm);
          setFlipped([]);
          setLocked(false);
          if (nm.size === pairs.length) {
            const answers: AnswerDetail[] = pairs.map((p) => ({
              qid: `p${p.articleId}`,
              articleId: p.articleId,
              articleLabel: p.label,
              chosen: null,
              correct: !missed.current.has(p.articleId),
            }));
            onFinish({ score: pairs.length, wrong: fails, total: pairs.length + fails, answers });
          }
        }, 550);
      } else {
        missed.current.add(a.pairId);
        missed.current.add(b.pairId);
        setFails((f) => f + 1);
        window.setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 1100);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
          Parejas {matched.size}/{pairs.length}
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Fallos {fails}</span>
      </div>
      <p className="mt-2 text-center text-[13px] text-stone-500">Une cada artículo con lo que dice. ¡Memoriza!</p>
      <div className="perspective-1400 mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {cards.map((c, i) => {
          const isUp = flipped.includes(i) || matched.has(c.pairId);
          const isMatched = matched.has(c.pairId);
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => flip(i)}
              aria-label={isUp ? c.text : "Carta boca abajo"}
              className="relative h-[118px] w-full cursor-pointer"
            >
              <div className={`flip-inner preserve-3d relative h-full w-full ${isUp ? "flipped" : ""}`}>
                <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-md ring-2 ring-amber-900/20">
                  <span className="font-hand-caveat text-[44px] font-bold text-amber-100/80">§</span>
                </div>
                <div
                  className={`backface-hidden face-back absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl p-2 text-center shadow-md ring-2 ${
                    isMatched ? "bg-emerald-100 ring-emerald-500" : c.kind === "label" ? "bg-amber-100 ring-amber-500" : "bg-white ring-sky-400"
                  }`}
                >
                  {c.kind === "label" ? (
                    <span className="font-hand-caveat text-[30px] font-bold leading-none text-amber-900">{c.text}</span>
                  ) : (
                    <span className="font-hand-kalam text-[12px] leading-tight text-[#2b3a8f]">{c.text}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Ahorcado jurídico                                               */
/* ------------------------------------------------------------------ */

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
const normChar = (ch: string) => (ch.toLowerCase() === "ñ" ? "Ñ" : ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase());

function AhorcadoGame({ words, onFinish }: { words: HangmanItem[]; onFinish: (r: GameResult) => void }) {
  const MAX = 6;
  const [wi, setWi] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [lives, setLives] = useState(MAX);
  const [outcomes, setOutcomes] = useState<boolean[]>([]);
  const [shake, setShake] = useState(0);

  const item = words[wi];
  const letters = useMemo(() => item.word.split(""), [item]);
  const solved = letters.every((ch) => guessed.includes(normChar(ch)));
  const lost = lives <= 0;
  const over = solved || lost;

  const guess = useCallback(
    (l: string) => {
      if (over || guessed.includes(l)) return;
      setGuessed((g) => [...g, l]);
      if (!letters.some((ch) => normChar(ch) === l)) {
        setLives((x) => x - 1);
        setShake((s) => s + 1);
      }
    },
    [over, guessed, letters],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (over && e.key === "Enter") {
        nextWord();
        return;
      }
      const l = normChar(e.key.length === 1 ? e.key : "");
      if (l && ALPHABET.includes(l)) guess(l);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guess, over]);

  const nextWord = () => {
    const out = [...outcomes, solved];
    setOutcomes(out);
    if (wi + 1 >= words.length) {
      const answers: AnswerDetail[] = words.map((w, i) => ({
        qid: `h${i}`,
        articleId: w.articleId,
        articleLabel: w.articleLabel,
        chosen: null,
        correct: out[i],
      }));
      const ok = out.filter(Boolean).length;
      onFinish({ score: ok, wrong: words.length - ok, total: words.length, answers });
      return;
    }
    setWi(wi + 1);
    setGuessed([]);
    setLives(MAX);
  };

  const hintParts = item.hint.split("_____");

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
          Palabra {wi + 1}/{words.length}
        </span>
        <div className="flex gap-1 text-[22px]" aria-label={`${lives} cafés`}>
          {Array.from({ length: MAX }).map((_, i) => (
            <span key={i} className={`transition-all duration-300 ${i < lives ? "" : "scale-75 opacity-20 grayscale"}`}>
              ☕
            </span>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[12px] text-stone-500">Cada fallo te quita un café. Sin café, Oposita no estudia…</p>

      <div className="mt-4 rounded-xl bg-white/90 p-4 shadow-md ring-1 ring-black/5">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">{item.articleLabel}</span>
        <p className="mt-2 font-hand-kalam text-[18px] leading-[1.6] text-[#2b3a8f]">
          {hintParts[0]}
          <span className="mx-1 inline-block min-w-[70px] rounded bg-amber-200/70 px-2 text-center font-bold tracking-widest text-amber-900">
            {over ? item.word : "?".repeat(Math.min(item.word.length, 9))}
          </span>
          {hintParts[1]}
        </p>
      </div>

      <div key={shake} className={`mt-5 flex flex-wrap justify-center gap-1.5 ${lives < MAX && shake ? "shake" : ""}`}>
        {letters.map((ch, i) => {
          const shown = guessed.includes(normChar(ch));
          return (
            <span
              key={i}
              className={`flex h-12 w-9 items-center justify-center border-b-4 font-hand-caveat text-[34px] font-bold ${
                shown ? "border-emerald-600 text-[#2b3a8f]" : lost ? "border-rose-500 text-rose-600" : "border-stone-400 text-transparent"
              }`}
            >
              {shown || lost ? ch : "_"}
            </span>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-1.5">
        {ALPHABET.map((l) => {
          const used = guessed.includes(l);
          const hit = used && letters.some((ch) => normChar(ch) === l);
          return (
            <button
              key={l}
              type="button"
              disabled={used || over}
              onClick={() => guess(l)}
              className={`h-10 w-9 rounded-lg font-hand-caveat text-[22px] font-bold shadow-sm ring-1 transition-all ${
                used
                  ? hit
                    ? "bg-emerald-200 text-emerald-800 ring-emerald-500/40"
                    : "bg-rose-100 text-rose-300 ring-rose-300/40"
                  : "bg-white text-amber-900 ring-black/10 hover:-translate-y-0.5 hover:bg-amber-50"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      {over && (
        <div className="pop-in mt-5 text-center">
          <p className={`font-hand-caveat text-[30px] font-bold leading-none ${solved ? "text-emerald-700" : "text-rose-700"}`}>
            {solved ? "¡Muy bien! 🎉" : `Era «${item.word}»`}
          </p>
          <button type="button" onClick={nextWord} className="btn-primary-hand mt-3 rounded-full px-6 py-2.5 font-bold text-white">
            {wi + 1 >= words.length ? "Ver resultado" : "Siguiente palabra"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Ordena la frase                                                 */
/* ------------------------------------------------------------------ */

interface Chip {
  id: number;
  word: string;
}

function makeChips(words: string[]): Chip[] {
  const chips = words.map((w, i) => ({ id: i, word: w }));
  let s = shuffle(chips);
  for (let t = 0; t < 6 && s.every((c, i) => c.id === i); t++) s = shuffle(chips);
  return s;
}

function OrdenaGame({ sentences, onFinish }: { sentences: OrderItem[]; onFinish: (r: GameResult) => void }) {
  const [si, setSi] = useState(0);
  const [pool, setPool] = useState<Chip[]>(() => makeChips(sentences[0].words));
  const [placed, setPlaced] = useState<Chip[]>([]);
  const [tries, setTries] = useState(0);
  const [state, setState] = useState<"playing" | "ok" | "fail">("playing");
  const [shake, setShake] = useState(0);
  const [outcomes, setOutcomes] = useState<boolean[]>([]);

  const item = sentences[si];

  const place = (c: Chip) => {
    if (state !== "playing") return;
    setPool((p) => p.filter((x) => x.id !== c.id));
    setPlaced((p) => [...p, c]);
  };
  const unplace = (c: Chip) => {
    if (state !== "playing") return;
    setPlaced((p) => p.filter((x) => x.id !== c.id));
    setPool((p) => [...p, c]);
  };

  const check = () => {
    const ok = placed.every((c, i) => c.id === i) && placed.length === item.words.length;
    if (ok) {
      setState("ok");
      return;
    }
    const t = tries + 1;
    setTries(t);
    setShake((s) => s + 1);
    if (t >= 2) {
      setPlaced(item.words.map((w, i) => ({ id: i, word: w })));
      setPool([]);
      setState("fail");
    }
  };

  const next = () => {
    const out = [...outcomes, state === "ok"];
    setOutcomes(out);
    if (si + 1 >= sentences.length) {
      const answers: AnswerDetail[] = sentences.map((s, i) => ({
        qid: `o${i}`,
        articleId: s.articleId,
        articleLabel: s.articleLabel,
        chosen: null,
        correct: out[i],
      }));
      const ok = out.filter(Boolean).length;
      onFinish({ score: ok, wrong: sentences.length - ok, total: sentences.length, answers });
      return;
    }
    const nx = sentences[si + 1];
    setSi(si + 1);
    setPool(makeChips(nx.words));
    setPlaced([]);
    setTries(0);
    setState("playing");
  };

  const reshuffle = () => {
    if (state !== "playing") return;
    setPool(shuffle([...pool, ...placed]));
    setPlaced([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
          Frase {si + 1}/{sentences.length}
        </span>
        <span className="text-sm font-bold text-stone-500">Intento {Math.min(tries + 1, 2)}/2</span>
      </div>
      <p className="mt-2 text-[13px] text-stone-500">
        Toca las palabras en el orden correcto para reconstruir el texto de <strong>{item.articleLabel}</strong>.
      </p>

      <div
        key={shake}
        className={`paper-lines-sm mt-3 min-h-[118px] rounded-xl p-3 shadow-inner ring-2 ${
          state === "ok" ? "ring-emerald-500" : state === "fail" ? "ring-rose-500" : "ring-amber-600/30"
        } ${shake && state === "playing" ? "shake" : ""}`}
        style={{ ["--paper-bg" as string]: "#fffdf4", ["--paper-line" as string]: "rgba(96,140,220,0.22)" }}
      >
        {placed.length === 0 && <p className="pt-2 text-center italic text-stone-400">Tu frase aparecerá aquí…</p>}
        <div className="flex flex-wrap gap-1.5">
          {placed.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => unplace(c)}
              className={`rounded-lg px-2.5 py-1 font-hand-kalam text-[16px] shadow-sm ring-1 transition-all ${
                state === "ok" ? "bg-emerald-100 text-emerald-900 ring-emerald-400" : state === "fail" ? "bg-rose-50 text-rose-900 ring-rose-300" : "bg-amber-100 text-amber-950 ring-amber-500/40 hover:-translate-y-0.5"
              }`}
            >
              {c.word}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex min-h-[64px] flex-wrap gap-1.5 rounded-xl bg-stone-100/80 p-3 ring-1 ring-black/5">
        {pool.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => place(c)}
            className="rounded-lg bg-white px-2.5 py-1 font-hand-kalam text-[16px] text-[#2b3a8f] shadow-sm ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:bg-sky-50"
          >
            {c.word}
          </button>
        ))}
        {pool.length === 0 && state === "playing" && <p className="text-sm italic text-stone-400">¡Todas colocadas! Pulsa «Comprobar».</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {state === "playing" ? (
          <>
            <button
              type="button"
              onClick={reshuffle}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm ring-1 ring-black/10 hover:-rotate-1"
            >
              <Shuffle className="h-4 w-4" /> Reiniciar
            </button>
            <button
              type="button"
              onClick={check}
              disabled={pool.length > 0}
              className="btn-primary-hand rounded-full px-6 py-2.5 font-bold text-white disabled:opacity-40"
            >
              Comprobar
            </button>
          </>
        ) : (
          <div className="pop-in text-center">
            <p className={`font-hand-caveat text-[30px] font-bold leading-none ${state === "ok" ? "text-emerald-700" : "text-rose-700"}`}>
              {state === "ok" ? "¡Perfecto! 🎉" : "Esta era la frase correcta"}
            </p>
            <button type="button" onClick={next} className="btn-primary-hand mt-3 rounded-full px-6 py-2.5 font-bold text-white">
              {si + 1 >= sentences.length ? "Ver resultado" : "Siguiente frase"}
            </button>
          </div>
        )}
      </div>
      {state === "playing" && tries === 1 && <p className="mt-2 text-center text-sm font-bold text-rose-700">Casi… ¡un último intento!</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Contenedor común                                                   */
/* ------------------------------------------------------------------ */

interface GameModalProps {
  lawId: number;
  kind: Exclude<AttemptKind, "test">;
  scope: Scope;
  onClose: () => void;
  onSaved: () => void;
}

const BLURB: Record<string, string> = {
  vf: "Tienes 60 segundos: ¿verdadero o falso? Cada acierto suma, cada fallo rompe la racha.",
  parejas: "Empareja cada artículo con lo que regula. Memoria y artículos, todo en uno.",
  ahorcado: "Adivina la palabra clave del artículo letra a letra antes de quedarte sin café.",
  ordena: "Reconstruye el texto literal de la ley colocando las palabras en orden.",
};

export default function GameModal({ lawId, kind, scope, onClose, onSaved }: GameModalProps) {
  const info = KIND_INFO[kind];
  const [run, setRun] = useState(0);
  const [data, setData] = useState<GenData | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<(GameResult & { seconds: number; grade: number }) | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    oposita({ focus: true });
    return () => oposita({ focus: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    setResult(null);
    api<GenData>(`/api/laws/${lawId}/generate`, { method: "POST", json: { kind, scope } })
      .then((d) => {
        if (cancelled) return;
        startRef.current = Date.now();
        setData(d);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "No se pudo preparar el juego"));
    return () => {
      cancelled = true;
    };
  }, [lawId, kind, scope, run]);

  const handleFinish = useCallback(
    async (r: GameResult) => {
      const seconds = r.seconds ?? Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
      const grade = gradeOf({ kind, score: r.score, wrong: r.wrong, total: r.total });
      setResult({ ...r, seconds, grade });
      oposita(
        grade >= 7
          ? { say: "¡Qué máquina! 🎉", mood: "cheer" }
          : grade >= 5
            ? { say: "¡Bien jugado! Un repaso más y lo clavas.", mood: "cheer" }
            : { say: "Casi… ¡la próxima sale mejor!", mood: "think" },
      );
      if (r.total > 0) {
        try {
          await api(`/api/laws/${lawId}/attempts`, {
            method: "POST",
            json: {
              kind,
              title: info.label,
              scope: data?.scopeLabel ?? "Toda la ley",
              score: r.score,
              wrong: r.wrong,
              blank: 0,
              total: r.total,
              durationSec: seconds,
              answers: r.answers,
            },
          });
          onSaved();
        } catch {
          /* el resultado se muestra igualmente */
        }
      }
    },
    [kind, lawId, info.label, data, onSaved],
  );

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="fade-in fixed inset-0 bg-stone-900/65 backdrop-blur-[3px]" onClick={onClose} />
      <div className="relative mx-auto flex min-h-full w-full max-w-xl items-center px-3 py-6">
        <div
          className="paper-lines-lg pop-in relative w-full overflow-hidden rounded-[8px] p-5 shadow-2xl ring-1 ring-black/15 sm:p-7"
          style={{ ["--paper-bg" as string]: "#fffdf4", ["--paper-line" as string]: "rgba(96,140,220,0.18)" }}
        >
          <div className="tape left-1/2 top-[-8px]" style={{ backgroundColor: "rgba(251,191,36,0.5)", transform: "translateX(-50%) rotate(-2deg)" }} />
          <button
            type="button"
            aria-label="Cerrar juego"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-stone-600 shadow ring-1 ring-black/10 transition-transform hover:rotate-90 hover:text-rose-700"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-hand-caveat pr-10 text-[34px] font-bold leading-none text-amber-950">
            {info.emoji} {info.label}
          </h2>
          {data && !result && <p className="mt-0.5 text-[12px] uppercase tracking-[0.12em] text-stone-500">{data.scopeLabel}</p>}

          <div className="mt-4">
            {error ? (
              <div className="rounded-xl bg-rose-50 p-4 text-center ring-1 ring-rose-200">
                <p className="text-[15px] text-rose-800">{error}</p>
                <button type="button" onClick={onClose} className="btn-primary-hand mt-3 rounded-full px-5 py-2 font-bold text-white">
                  Volver
                </button>
              </div>
            ) : !data ? (
              <div className="flex flex-col items-center gap-2 py-10 text-amber-800">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="font-hand-caveat text-[24px] font-bold">Preparando el juego con tu ley…</p>
              </div>
            ) : result ? (
              <div className="pop-in text-center">
                <p className="font-hand-caveat text-[76px] font-bold leading-none" style={{ color: result.grade >= 5 ? "#15803d" : "#b91c1c" }}>
                  {fmtGrade(result.grade)}
                </p>
                <p className="-mt-1 text-[12px] font-bold uppercase tracking-wide text-stone-500">sobre 10</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">✔ {result.score} aciertos</span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">✖ {result.wrong} fallos</span>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">⏱ {fmtDuration(result.seconds)}</span>
                </div>
                {result.total === 0 && <p className="mt-2 text-sm italic text-stone-500">No llegaste a responder ninguna… ¡prueba otra vez!</p>}
                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRun((r) => r + 1)}
                    className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-white"
                  >
                    <RotateCcw className="h-4 w-4" /> Jugar otra vez
                  </button>
                  <button type="button" onClick={onClose} className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-bold text-stone-600 shadow-sm ring-1 ring-black/10">
                    <Check className="h-4 w-4" /> Terminar
                  </button>
                </div>
              </div>
            ) : (
              <div key={run}>
                <p className="mb-3 text-[13px] italic text-stone-500">{BLURB[kind]}</p>
                {kind === "vf" && data.items && <VfGame items={data.items} onFinish={handleFinish} />}
                {kind === "parejas" && data.pairs && <ParejasGame pairs={data.pairs} onFinish={handleFinish} />}
                {kind === "ahorcado" && data.words && <AhorcadoGame words={data.words} onFinish={handleFinish} />}
                {kind === "ordena" && data.sentences && <OrdenaGame sentences={data.sentences} onFinish={handleFinish} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
