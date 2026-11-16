"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ExternalLink,
  Gamepad2,
  ListChecks,
  Loader2,
  NotebookPen,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { api, oposita } from "@/lib/client";
import { folderStyle, type ArticleItem, type LawListItem } from "@/lib/lawStyle";
import { opoList } from "@/lib/catalog";
import type { Scope } from "@/lib/quizTypes";
import type { StatsSummary } from "@/lib/stats";
import ConfirmDialog from "@/components/ConfirmDialog";
import LawTests from "@/components/law/LawTests";
import LawGames from "@/components/law/LawGames";
import LawNotes from "@/components/law/LawNotes";
import LawArticles from "@/components/law/LawArticles";
import LawStats from "@/components/law/LawStats";
import { blocksOf } from "@/components/law/ScopePicker";

type LawRow = Omit<LawListItem, "stats">;
type Tab = "tests" | "juegos" | "apuntes" | "articulos" | "stats";

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: "tests", label: "Tests", icon: ListChecks },
  { id: "juegos", label: "Juegos", icon: Gamepad2 },
  { id: "apuntes", label: "Apuntes", icon: NotebookPen },
  { id: "articulos", label: "Artículos", icon: BookOpen },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
];

function EditLawDialog({ law, onClose, onSaved }: { law: LawRow; onClose: () => void; onSaved: (l: LawRow) => void }) {
  const [name, setName] = useState(law.name);
  const [shortName, setShortName] = useState(law.shortName);
  const [opos, setOpos] = useState(law.opos);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await api<LawRow>(`/api/laws/${law.id}`, { method: "PATCH", json: { name, shortName, opos } });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fade-in absolute inset-0 bg-stone-900/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="pop-in relative w-full max-w-md rounded-xl bg-[#faf3e0] p-6 shadow-2xl ring-1 ring-black/20">
        <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 text-stone-500 ring-1 ring-black/10 hover:text-rose-700">
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-hand-caveat text-[30px] font-bold leading-none text-amber-950">Editar carpeta</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="font-hand-caveat text-[19px] font-semibold text-amber-900">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-paper mt-1 w-full px-3 py-2 text-[14px]" />
          </div>
          <div>
            <label className="font-hand-caveat text-[19px] font-semibold text-amber-900">Siglas</label>
            <input value={shortName} onChange={(e) => setShortName(e.target.value)} className="input-paper mt-1 w-full px-3 py-2 text-[14px]" maxLength={40} />
          </div>
          <div>
            <label className="font-hand-caveat text-[19px] font-semibold text-amber-900">Oposiciones (separadas por comas)</label>
            <input value={opos} onChange={(e) => setOpos(e.target.value)} className="input-paper mt-1 w-full px-3 py-2 text-[14px]" />
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
        <button type="button" onClick={save} disabled={saving || !name.trim()} className="btn-primary-hand mt-5 flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-white disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
        </button>
      </div>
    </div>
  );
}

export default function LawPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [law, setLaw] = useState<LawRow | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("tests");
  const [testPreset, setTestPreset] = useState<{ scope: Scope; key: number } | null>(null);
  const [notePreset, setNotePreset] = useState<{ scope: Scope; key: number } | null>(null);
  const [autoFallos, setAutoFallos] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api<StatsSummary>(`/api/laws/${id}/stats`));
    } catch {
      /* se queda como estaba */
    } finally {
      setStatsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("Esa carpeta no existe");
      setLoading(false);
      return;
    }
    api<{ law: LawRow; articles: ArticleItem[] }>(`/api/laws/${id}`)
      .then((d) => {
        setLaw(d.law);
        setArticles(d.articles);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo abrir la carpeta"))
      .finally(() => setLoading(false));
    loadStats();
    oposita({ focus: false });
  }, [id, loadStats]);

  const removeLaw = async () => {
    setDeleting(false);
    try {
      await api(`/api/laws/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar la carpeta");
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 pt-8 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-amber-200/60" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-white/50" />
      </main>
    );
  }

  if (error || !law) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 pt-10 sm:px-6">
        <div className="pop-in mx-auto max-w-md -rotate-1 rounded-lg bg-[#fffdf4] p-8 text-center shadow-xl ring-1 ring-black/10">
          <p className="font-hand-caveat text-3xl font-bold text-rose-700">Carpeta no encontrada</p>
          <p className="mt-1 text-stone-500">{error || "No existe o no es tuya."}</p>
          <Link href="/" className="btn-primary-hand mt-4 inline-block rounded-full px-5 py-2 font-bold text-white">
            Volver a mi mesa
          </Link>
        </div>
      </main>
    );
  }

  const st = folderStyle(law.color);
  const opos = opoList(law.opos);
  const blocks = blocksOf(articles).filter((b) => b.name).length;
  const articlesOnly = articles.filter((a) => a.kind === "articulo").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-5 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-amber-800 hover:-translate-x-0.5 hover:text-amber-950">
        <ArrowLeft className="h-4 w-4" /> Mi mesa de estudio
      </Link>

      {/* Cabecera de carpeta */}
      <header className="relative mt-3 pt-9">
        <div className="absolute left-6 top-0 flex h-10 items-center gap-1.5 rounded-t-xl px-5 text-[14px] font-bold" style={{ background: st.tab, color: st.ink }}>
          <span className="text-[18px]">{law.icon}</span> {law.shortName || "Ley"}
        </div>
        <div
          className="relative rounded-[4px_22px_22px_22px] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.55)] ring-1 ring-black/10 sm:p-6"
          style={{ background: `linear-gradient(165deg, ${st.body}, ${st.tab})` }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-hand-caveat text-[34px] font-bold leading-[1.05] sm:text-[44px]" style={{ color: st.ink }}>
                {law.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-bold ring-1 ring-black/5" style={{ color: st.ink }}>
                  {articlesOnly} artículos{articles.length > articlesOnly ? ` + ${articles.length - articlesOnly} disposiciones` : ""}
                </span>
                {blocks > 0 && (
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-bold ring-1 ring-black/5" style={{ color: st.ink }}>
                    {blocks} {blocks === 1 ? "título" : "títulos"}
                  </span>
                )}
                <span className="rounded-full bg-white/70 px-3 py-1 text-[12px] font-bold ring-1 ring-black/5" style={{ color: st.ink }}>
                  Rama: {law.branch}
                </span>
                {opos.map((o) => (
                  <span key={o} className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-bold text-teal-800 ring-1 ring-teal-700/20">
                    {o}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {law.boeId && (
                <a
                  href={`https://www.boe.es/buscar/act.php?id=${law.boeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-2 text-[13px] font-bold text-stone-700 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
                >
                  <ExternalLink className="h-4 w-4" /> BOE
                </a>
              )}
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-2 text-[13px] font-bold text-stone-700 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1">
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button type="button" onClick={() => setDeleting(true)} className="flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-2 text-[13px] font-bold text-rose-700 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1">
                <Trash2 className="h-4 w-4" /> Borrar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Pestañas */}
      <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1" aria-label="Secciones de la carpeta">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold shadow-sm ring-1 transition-all hover:-rotate-1 ${
                active ? "bg-amber-500 text-white shadow-[0_3px_0_#92400e] ring-amber-700/40" : "bg-white/85 text-stone-600 ring-black/10 hover:text-amber-900"
              }`}
            >
              <Icon className="h-4.5 w-4.5" /> {t.label}
            </button>
          );
        })}
      </nav>

      <section className="mt-6">
        {tab === "tests" && (
          <LawTests
            law={law}
            articles={articles}
            preset={testPreset}
            autoFallos={autoFallos}
            onAutoHandled={() => setAutoFallos(false)}
            onChanged={loadStats}
          />
        )}
        {tab === "juegos" && <LawGames lawId={law.id} articles={articles} stats={stats} onChanged={loadStats} />}
        {tab === "apuntes" && <LawNotes law={law} articles={articles} preset={notePreset} onChanged={() => {}} />}
        {tab === "articulos" && (
          <LawArticles
            articles={articles}
            onNotesBlock={(block) => {
              setNotePreset({ scope: { mode: "block", block }, key: Date.now() });
              setTab("apuntes");
            }}
            onTestBlock={(block) => {
              setTestPreset({ scope: { mode: "block", block }, key: Date.now() });
              setTab("tests");
            }}
          />
        )}
        {tab === "stats" && (
          <LawStats
            stats={stats}
            loading={statsLoading}
            onFallos={() => {
              setAutoFallos(true);
              setTab("tests");
            }}
          />
        )}
      </section>

      {editing && (
        <EditLawDialog
          law={law}
          onClose={() => setEditing(false)}
          onSaved={(l) => {
            setLaw(l);
            setEditing(false);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Borrar esta carpeta?"
          message="Se borrarán la ley, sus tests, juegos y estadísticas. Los apuntes que escribiste se conservan en tu cuaderno."
          confirmLabel="Sí, borrar carpeta"
          onConfirm={removeLaw}
          onCancel={() => setDeleting(false)}
        />
      )}
    </main>
  );
}
