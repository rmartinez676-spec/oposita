"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ListChecks, NotebookPen, Search, X } from "lucide-react";
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

function ArticleCard({ a }: { a: ArticleItem }) {
  const [open, setOpen] = useState(false);
  const first = a.body.split("\n")[0] ?? "";
  return (
    <li className="rounded-lg bg-white/85 shadow-sm ring-1 ring-black/5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-3.5 py-2.5 text-left">
        <span className="mt-0.5 shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[12px] font-bold text-amber-900">
          {a.kind === "articulo" ? `Art. ${a.number}` : a.number.replace("Disposición ", "Disp. ")}
        </span>
        <span className="min-w-0 flex-1">
          {a.rubric && <span className="block text-[14px] font-bold leading-tight text-stone-800">{a.rubric}</span>}
          {!open && <span className="line-clamp-1 text-[13px] text-stone-500">{first}</span>}
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
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
}

export default function LawArticles({ articles, onNotesBlock, onTestBlock }: LawArticlesProps) {
  const [query, setQuery] = useState("");
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
    return articles
      .filter((a) => `${labelOfArticle(a)} ${a.rubric} ${a.body}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [articles, q]);

  const toggle = (b: string) =>
    setOpenBlocks((s) => {
      const n = new Set(s);
      if (n.has(b)) n.delete(b);
      else n.add(b);
      return n;
    });

  return (
    <div>
      <label className="input-paper flex max-w-xl items-center gap-2 px-4 py-2.5">
        <Search className="h-4.5 w-4.5 shrink-0 text-amber-700" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca una palabra, un artículo (ej. «plazo», «Art. 14»)…"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-stone-400"
        />
        {query && (
          <button type="button" aria-label="Limpiar" onClick={() => setQuery("")}>
            <X className="h-4 w-4 text-stone-400 hover:text-rose-600" />
          </button>
        )}
      </label>

      {results ? (
        <div className="mt-5">
          <p className="font-hand-caveat text-[24px] font-semibold text-amber-900/80">
            {results.length === 60 ? "60+ resultados" : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
          </p>
          <ul className="mt-2 space-y-2">
            {results.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {groups.map((g) => {
            const open = openBlocks.has(g.block);
            return (
              <section key={g.block || "sin"} className="rounded-xl bg-[#fffdf4]/90 p-3 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => toggle(g.block)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
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
                      <ArticleCard key={a.id} a={a} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
