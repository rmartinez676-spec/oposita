"use client";

import { useMemo } from "react";
import type { ArticleItem } from "@/lib/lawStyle";
import type { Scope } from "@/lib/quizTypes";

export function blocksOf(articles: ArticleItem[]): { name: string; count: number }[] {
  const out: { name: string; count: number }[] = [];
  for (const a of articles) {
    const last = out[out.length - 1];
    if (last && last.name === a.block) last.count++;
    else out.push({ name: a.block, count: 1 });
  }
  return out;
}

interface ScopePickerProps {
  articles: ArticleItem[];
  value: Scope;
  onChange: (s: Scope) => void;
  allowRange?: boolean;
}

export default function ScopePicker({ articles, value, onChange, allowRange = true }: ScopePickerProps) {
  const blocks = useMemo(() => blocksOf(articles), [articles]);
  const numbers = useMemo(
    () => articles.filter((a) => a.kind === "articulo").map((a) => parseInt(a.number, 10)).filter(Number.isFinite),
    [articles],
  );
  const min = numbers.length ? Math.min(...numbers) : 1;
  const max = numbers.length ? Math.max(...numbers) : 1;

  const modes: { id: Scope["mode"]; label: string; show: boolean }[] = [
    {
      id: "ids",
      label: `Mi selección (${value.ids?.length ?? 0} ${(value.ids?.length ?? 0) === 1 ? "artículo" : "artículos"})`,
      show: value.mode === "ids",
    },
    { id: "all", label: "Toda la ley", show: true },
    { id: "block", label: "Por título / bloque", show: blocks.length > 1 },
    { id: "range", label: "Rango de artículos", show: allowRange && numbers.length > 3 },
  ];

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-[13px] font-bold shadow-sm ring-1 transition-all hover:-rotate-1 ${
      active ? "bg-amber-500 text-white ring-amber-700/40" : "bg-white/85 text-stone-600 ring-black/10 hover:text-amber-900"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {modes
          .filter((m) => m.show)
          .map((m) => (
            <button
              key={m.id}
              type="button"
              className={chip(value.mode === m.id)}
              onClick={() => {
                if (m.id === "ids") return;
                if (m.id === "all") onChange({ mode: "all" });
                else if (m.id === "block") onChange({ mode: "block", block: value.block ?? blocks[0]?.name ?? "" });
                else onChange({ mode: "range", from: value.from ?? min, to: value.to ?? Math.min(max, min + 29) });
              }}
            >
              {m.label}
            </button>
          ))}
      </div>

      {value.mode === "block" && (
        <select
          className="input-paper mt-2.5 w-full cursor-pointer px-3 py-2 text-sm"
          value={value.block ?? ""}
          onChange={(e) => onChange({ mode: "block", block: e.target.value })}
          aria-label="Elige el título o bloque"
        >
          {blocks.map((b) => (
            <option key={b.name} value={b.name}>
              {(b.name || "Texto de la ley").slice(0, 90)} ({b.count})
            </option>
          ))}
        </select>
      )}

      {value.mode === "range" && (
        <div className="mt-2.5 flex items-center gap-2 text-sm text-stone-600">
          <span>Del artículo</span>
          <input
            type="number"
            min={min}
            max={max}
            value={value.from ?? min}
            onChange={(e) => onChange({ ...value, mode: "range", from: Number(e.target.value) })}
            className="input-paper w-24 px-3 py-1.5"
          />
          <span>al</span>
          <input
            type="number"
            min={min}
            max={max}
            value={value.to ?? max}
            onChange={(e) => onChange({ ...value, mode: "range", to: Number(e.target.value) })}
            className="input-paper w-24 px-3 py-1.5"
          />
          <span className="text-xs text-stone-400">
            (de {min} a {max})
          </span>
        </div>
      )}
    </div>
  );
}
