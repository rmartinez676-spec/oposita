"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MousePointerClick,
  Shuffle,
  X,
} from "lucide-react";
import { getCategory, type NoteItem } from "@/lib/apuntes";
import NoteSheet from "./NoteSheet";
import { CurvedArrow, ScaleDoodle } from "./Doodles";

interface StudyModeProps {
  notes: NoteItem[];
  onClose: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Modo repaso: tarjetas que se voltean para memorizar cada apunte. */
export default function StudyMode({ notes, onClose }: StudyModeProps) {
  const [deck, setDeck] = useState<NoteItem[]>(() => shuffle(notes));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = deck[Math.min(index, deck.length - 1)];

  const go = useCallback(
    (dir: 1 | -1) => {
      setFlipped(false);
      window.setTimeout(() => {
        setIndex((i) => (i + dir + deck.length) % deck.length);
      }, 120);
    },
    [deck.length],
  );

  const reshuffle = useCallback(() => {
    setFlipped(false);
    setDeck((d) => shuffle(d));
    setIndex(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  const progress = useMemo(
    () => (deck.length ? ((index + 1) / deck.length) * 100 : 0),
    [index, deck.length],
  );

  if (!current) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[3px]" onClick={onClose} />
        <div className="pop-in relative rounded-2xl bg-[#fffdf4] p-8 text-center shadow-2xl">
          <p className="font-hand-caveat text-3xl font-bold text-amber-950">No hay apuntes para repasar…</p>
          <p className="mt-1 text-stone-500">Escribe tu primer apunte y vuelve aquí.</p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary-hand mt-4 rounded-full px-5 py-2 font-bold text-white"
          >
            Volver al cuaderno
          </button>
        </div>
      </div>
    );
  }

  const category = getCategory(current.category);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fade-in fixed inset-0 bg-stone-900/65 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center px-3 py-8">
        {/* Cabecera del repaso */}
        <div className="pop-in mb-5 flex w-full items-center justify-between gap-3 text-white">
          <p className="flex items-center gap-2 font-hand-caveat text-[26px] font-bold leading-none">
            <GraduationCap className="h-7 w-7 text-amber-300" />
            Modo repaso
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reshuffle}
              className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-bold text-stone-700 shadow-md ring-1 ring-black/10 transition-all hover:-translate-y-0.5"
            >
              <Shuffle className="h-4 w-4" /> Mezclar
            </button>
            <button
              type="button"
              aria-label="Cerrar repaso"
              onClick={onClose}
              className="rounded-full bg-stone-800 p-2.5 text-white shadow-md ring-1 ring-white/20 transition-transform hover:rotate-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-5 w-full max-w-md">
          <div className="h-2.5 overflow-hidden rounded-full bg-white/25 ring-1 ring-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-center text-sm text-amber-100/90">
            Tarjeta {index + 1} de {deck.length}
            {flipped ? " · ¡A memorizar!" : " · Piensa la respuesta antes de girar"}
          </p>
        </div>

        {/* La tarjeta que se voltea */}
        <div className="perspective-1400 w-full max-w-xl">
          <div
            className={`flip-inner preserve-3d relative h-[430px] w-full cursor-pointer sm:h-[460px] ${
              flipped ? "flipped" : ""
            }`}
            onClick={() => setFlipped((f) => !f)}
          >
            {/* Cara frontal: la pregunta */}
            <div className="backface-hidden absolute inset-0">
              <div
                className="paper-lines-lg relative flex h-full flex-col items-center justify-center overflow-hidden rounded-[6px] px-8 py-10 text-center shadow-[0_24px_50px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/15"
                style={
                  {
                    "--paper-bg": "#fef6c8",
                    "--paper-line": "rgba(202, 138, 4, 0.18)",
                  } as React.CSSProperties
                }
              >
                <div
                  className="tape left-1/2 top-[-8px]"
                  style={{ backgroundColor: category.tape, transform: "translateX(-50%) rotate(-2deg)" }}
                />
                <span
                  className="inline-flex -rotate-2 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-sm ring-1 ring-black/5"
                  style={{ backgroundColor: category.bg, color: category.text }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.dot }} />
                  {current.category}
                </span>
                <ScaleDoodle className="mt-5 h-12 w-12 text-amber-700/70" />
                <p className="mt-3 text-[13px] uppercase tracking-[0.16em] text-stone-500">
                  {current.lawName}
                  {current.article ? ` · ${current.article}` : ""}
                </p>
                <h3 className="font-hand-caveat mt-1 text-[38px] font-bold leading-[1.05] text-[#2b3a8f] sm:text-[44px]">
                  {current.title}
                </h3>
                <p className="mt-3 max-w-sm text-[15px] italic leading-snug text-stone-500">
                  ¿Serías capaz de desarrollar este apunte sin mirar? Recita los puntos clave en voz alta…
                </p>
                <p className="mt-6 flex items-center gap-2 text-sm font-bold text-amber-700">
                  <MousePointerClick className="h-4 w-4" />
                  Toca la tarjeta para ver el apunte
                </p>
                <CurvedArrow className="absolute bottom-5 right-6 h-8 w-12 rotate-[160deg] text-amber-600/70" />
              </div>
            </div>

            {/* Cara trasera: el apunte */}
            <div className="backface-hidden face-back absolute inset-0">
              <div className="nice-scroll h-full overflow-y-auto rounded-[6px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.55)]">
                <NoteSheet note={current} compact />
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="pop-in mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex items-center gap-1 rounded-full bg-white/90 py-2.5 pl-3 pr-4 font-bold text-stone-700 shadow-md ring-1 ring-black/10 transition-all hover:-translate-y-0.5"
          >
            <ChevronLeft className="h-5 w-5" /> Anterior
          </button>
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="btn-primary-hand rounded-full px-6 py-2.5 font-bold text-white"
          >
            {flipped ? "Ver pregunta" : "Ver apunte"}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex items-center gap-1 rounded-full bg-white/90 py-2.5 pl-4 pr-3 font-bold text-stone-700 shadow-md ring-1 ring-black/10 transition-all hover:-translate-y-0.5"
          >
            Siguiente <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-3 text-xs text-amber-100/70">
          Atajos: ← → para moverte · espacio para girar la tarjeta
        </p>
      </div>
    </div>
  );
}
