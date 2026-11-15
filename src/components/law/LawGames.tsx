"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { KIND_INFO, type AttemptKind, type Scope } from "@/lib/quizTypes";
import type { ArticleItem } from "@/lib/lawStyle";
import type { StatsSummary } from "@/lib/stats";
import ScopePicker from "./ScopePicker";
import GameModal from "@/components/games/Games";

type GameKind = Exclude<AttemptKind, "test">;

const GAMES: { kind: GameKind; desc: string; tag: string; bg: string; tape: string }[] = [
  { kind: "vf", desc: "60 segundos, afirmaciones de la ley y tu racha de aciertos. ¿Verdadero o falso?", tag: "Reflejos", bg: "#fef6c8", tape: "rgba(250,204,21,0.5)" },
  { kind: "parejas", desc: "Une cada artículo con lo que regula. Entrena la memoria visual.", tag: "Memoria", bg: "#dbeafe", tape: "rgba(96,165,250,0.5)" },
  { kind: "ahorcado", desc: "Adivina la palabra clave de un artículo antes de quedarte sin café.", tag: "Vocabulario", bg: "#ffe4ec", tape: "rgba(244,114,182,0.5)" },
  { kind: "ordena", desc: "Reconstruye el texto literal de la ley colocando las palabras en orden.", tag: "Literalidad", bg: "#dcfce7", tape: "rgba(74,222,128,0.5)" },
];

interface LawGamesProps {
  lawId: number;
  articles: ArticleItem[];
  stats: StatsSummary | null;
  onChanged: () => void;
}

export default function LawGames({ lawId, articles, stats, onChanged }: LawGamesProps) {
  const [scope, setScope] = useState<Scope>({ mode: "all" });
  const [playing, setPlaying] = useState<GameKind | null>(null);

  return (
    <div>
      <div className="relative max-w-3xl rounded-lg bg-[#fffdf4] p-4 shadow-[0_10px_22px_-10px_rgba(80,55,15,0.45)] ring-1 ring-black/10">
        <p className="font-hand-caveat text-[24px] font-bold leading-none text-amber-950">¿Con qué parte de la ley quieres jugar?</p>
        <div className="mt-2.5">
          <ScopePicker articles={articles} value={scope} onChange={setScope} />
        </div>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        {GAMES.map((g, i) => {
          const info = KIND_INFO[g.kind];
          const k = stats?.byKind.find((x) => x.kind === g.kind);
          return (
            <article
              key={g.kind}
              className="note-in relative rounded-md p-5 shadow-[0_12px_24px_-10px_rgba(80,55,15,0.5)] ring-1 ring-black/10"
              style={{ background: g.bg, transform: `rotate(${i % 2 ? 0.8 : -0.8}deg)`, animationDelay: `${i * 70}ms`, ["--rot" as string]: `${i % 2 ? 0.8 : -0.8}deg` }}
            >
              <div className="tape left-1/2 top-[-9px]" style={{ backgroundColor: g.tape, transform: "translateX(-50%) rotate(-2deg)" }} />
              <div className="flex items-start gap-3">
                <span className="flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white/80 text-[32px] shadow ring-1 ring-black/5">
                  {info.emoji}
                </span>
                <div>
                  <h3 className="font-hand-caveat text-[30px] font-bold leading-none text-stone-800">{info.label}</h3>
                  <span className="mt-1 inline-block rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-stone-600">{g.tag}</span>
                </div>
              </div>
              <p className="mt-2.5 text-[14px] leading-snug text-stone-700">{g.desc}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPlaying(g.kind)}
                  className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white"
                >
                  <Play className="h-4 w-4" /> Jugar
                </button>
                <p className="text-right text-[12px] text-stone-600">
                  {k ? (
                    <>
                      <strong>{k.count}</strong> {k.count === 1 ? "partida" : "partidas"} · media <strong>{k.avgGrade.toLocaleString("es-ES")}</strong>
                    </>
                  ) : (
                    "Aún sin jugar"
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {playing && (
        <GameModal
          lawId={lawId}
          kind={playing}
          scope={scope}
          onClose={() => {
            setPlaying(null);
            onChanged();
          }}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
