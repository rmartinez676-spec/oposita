"use client";

import { useMemo, useState } from "react";
import { CheckSquare, ChevronDown, ListChecks, NotebookPen, Search, Square, X } from "lucide-react";
import type { ArticleItem } from "@/lib/lawStyle";
import { labelOfArticle } from "@/lib/lawParser";

function ArticleBody({ body }: { body: string }) {
  return (
    <div className="space-y-1.5 text-[14.5px] leading-relaxed text-stone-700">
      {body.split("\n").map((p, i) => {
        const m = p.match(/^(\d{1,2}[.)]|[a-zñ]\))\s+([\s\S]*)$/i);
        if (m) {
          const letter = /^[a-zñ]\)/i.test(m[1]);
          return (
            <p key={i} className={letter ? "pl-7" : "pl-1"}>
              <span className="mr-1.5 font-bold text-amber-800">{m[1]}</span>
              {m[2]}
            </p>
          );
        }
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
}

function ArticleCard({ a, selected, onToggle }: { a: ArticleItem; selected: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const first = a.body.split("\n")[0] ?? "";
  return (
    <li className={`rounded-lg shadow-sm ring-1 transition-colors ${selected ? "bg-amber-50 ring-2 ring-amber-500" : "bg-white/85 ring-black/5"}`}>
      <div className="flex items-start">
        <button
          type="button"
          onClick={onToggle}
          aria-label={selected ? "Quitar de la selección" : "Añadir a la selección"}
          aria-pressed={selected}
          className="shrink-0 rounded-l-lg p-3 text-amber-700 hover:bg-amber-100"
        >
          {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-stone-400" />}
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-start gap-3 py-2.5 pr-3.5 text-left">
          <span className="mt-0.5 shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[12px] font-bold text-amber-900">
            {a.kind === "articulo" ? `Art. ${a.number}` : a.number.replace("Disposición ", "Disp. ")}
          </span>
          <span className="min-w-0 flex-1">
            {a.rubric && <span className="block text-[14px] font-bold leading-tight text-stone-800">{a.rubric}</span>}
            {!open && <span className="line-clamp-1 text-[13px] text-stone-500">{first}</span>}
          </span>
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="fade-in border-t border-dashed border-stone-300 px-4 py-3">
          <ArticleBody body={a.body} />
        </div>
      )}
    </li>
  );
}

interface LawArticlesProps {
  articles: ArticleItem[];
  onNotesBlock: (block: string) => void;
  onTestBlock: (block: string) => void;
  onNotesSelection: (ids: number[]) => void;
  onTestSelection: (ids: number[]) => void;
}

export default function LawArticles({ articles, onNotesBlock, onTestBlock, onNotesSelection, onTestSelection }: LawArticlesProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(() => new Set([articles[0]?.block ?? ""]));

  const groups = useMemo(() => {
    const out: { block: string; items: ArticleItem[] }[] = [];
    for (const a of articles) {
      const g = out[out.length - 1];
      if (g && g.block === a.block) g.items.push(a);
      else out.push({ block: a.block, items: [a] });
    }
    return out;
  }, [articles]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return null;
    return articles.filter((a) => `${labelOfArticle(a)} ${a.rubric} ${a.body}`.toLowerCase().includes(q));
  }, [articles, q]);

  const toggleBlock = (b: string) =>
    setOpenBlocks((s) => {
      const n = new Set(s);
      if (n.has(b)) n.delete(b);
      else n.add(b);
      return n;
    });

  const toggleOne = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleMany = (items: ArticleItem[]) =>
    setSelected((s) => {
      const n = new Set(s);
      const all = items.every((i) => n.has(i.id));
      for (const i of items) {
        if (all) n.delete(i.id);
        else n.add(i.id);
      }
      return n;
    });

  const ids = [...selected];
  const shown = results ? results.slice(0, 80) : [];

  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <label className="input-paper flex min-w-[260px] max-w-xl flex-1 items-center gap-2 px-4 py-2.5">
          <Search className="h-4.5 w-4.5 shrink-0 text-amber-700" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca una palabra o artículo (ej. «plazo», «Art. 14»)…"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-stone-400"
          />
          {query && (
            <button type="button" aria-label="Limpiar" onClick={() => setQuery("")}>
              <X className="h-4 w-4 text-stone-400 hover:text-rose-600" />
            </button>
          )}
        </label>
      </div>
      <p className="mt-2 text-[13px] text-stone-500">
        Marca con la casilla los artículos que quieras y genera <strong>apuntes o un test solo de tu selección</strong>.
      </p>

      {results ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-hand-caveat text-[24px] font-semibold text-amber-900/80">
              {results.length > 80 ? `${results.length} resultados (se muestran 80)` : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
            </p>
            {results.length > 0 && (
              <button
                type="button"
                onClick={() => toggleMany(results)}
                className="rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-amber-900 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
              >
                {results.every((r) => selected.has(r.id)) ? "Quitar todos los resultados" : `Seleccionar los ${results.length} resultados`}
              </button>
            )}
          </div>
          <ul className="mt-2 space-y-2">
            {shown.map((a) => (
              <ArticleCard key={a.id} a={a} selected={selected.has(a.id)} onToggle={() => toggleOne(a.id)} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map((g) => {
            const open = openBlocks.has(g.block);
            const all = g.items.every((i) => selected.has(i.id));
            const some = g.items.some((i) => selected.has(i.id));
            return (
              <section key={g.block || "sin"} className="rounded-xl bg-[#fffdf4]/90 p-3 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMany(g.items)}
                    title={all ? "Quitar todo el bloque" : "Seleccionar todo el bloque"}
                    aria-label={all ? "Quitar todo el bloque de la selección" : "Seleccionar todo el bloque"}
                    className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
                  >
                    {all ? <CheckSquare className="h-5 w-5" /> : <Square className={`h-5 w-5 ${some ? "text-amber-500" : "text-stone-400"}`} />}
                  </button>
                  <button type="button" onClick={() => toggleBlock(g.block)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <ChevronDown className={`h-5 w-5 shrink-0 text-amber-700 transition-transform ${open ? "" : "-rotate-90"}`} />
                    <span className="font-hand-caveat truncate text-[24px] font-bold leading-tight text-amber-950">{g.block || "Texto de la ley"}</span>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{g.items.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNotesBlock(g.block)}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-amber-900 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
                  >
                    <NotebookPen className="h-3.5 w-3.5" /> Apuntes
                  </button>
                  <button
                    type="button"
                    onClick={() => onTestBlock(g.block)}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-teal-800 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
                  >
                    <ListChecks className="h-3.5 w-3.5" /> Test
                  </button>
                </div>
                {open && (
                  <ul className="mt-3 space-y-2">
                    {g.items.map((a) => (
                      <ArticleCard key={a.id} a={a} selected={selected.has(a.id)} onToggle={() => toggleOne(a.id)} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {ids.length > 0 && (
        <div className="pop-in fixed bottom-4 left-1/2 z-40 flex w-[min(96vw,640px)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#fffdf4] px-4 py-3 shadow-[0_18px_40px_-10px_rgba(80,55,15,0.65)] ring-2 ring-amber-500">
          <span className="font-hand-caveat text-[24px] font-bold leading-none text-amber-950">
            {ids.length} {ids.length === 1 ? "artículo" : "artículos"} elegidos
          </span>
          <button
            type="button"
            onClick={() => onNotesSelection(ids)}
            className="btn-primary-hand flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-bold text-white"
          >
            <NotebookPen className="h-4 w-4" /> Generar apuntes
          </button>
          <button
            type="button"
            onClick={() => onTestSelection(ids)}
            className="flex items-center gap-1.5 rounded-full bg-teal-700 px-4 py-2 text-[14px] font-bold text-white shadow-[0_3px_0_#115e59] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
          >
            <ListChecks className="h-4 w-4" /> Test de la selección
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-full bg-white px-3 py-2 text-[13px] font-bold text-stone-500 shadow-sm ring-1 ring-black/10 hover:text-rose-700"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}
