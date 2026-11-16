"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Flame,
  FolderPlus,
  Library,
  NotebookPen,
  Search,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { api, oposita } from "@/lib/client";
import { opoList } from "@/lib/catalog";
import { folderStyle, type LawListItem } from "@/lib/lawStyle";
import { dailyCounts, streakDays, type StatsSummary } from "@/lib/stats";
import { fmtDuration } from "@/lib/quizTypes";
import LawFolderCard from "@/components/LawFolderCard";
import AddLawDialog from "@/components/AddLawDialog";
import { ScaleDoodle, SquiggleLine } from "@/components/Doodles";

export default function DashboardPage() {
  const router = useRouter();
  const [laws, setLaws] = useState<LawListItem[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [opoFilter, setOpoFilter] = useState("todas");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      // Las leyes son lo importante: si las estadísticas fallan, la mesa se ve igual.
      const l = await api<LawListItem[]>("/api/laws");
      setLaws(l);
      try {
        setStats(await api<StatsSummary>("/api/stats"));
      } catch {
        setStats(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo abrir tu mesa de estudio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || error) return;
    oposita({ focus: false });
    if (laws.length === 0) {
      const t = window.setTimeout(
        () => oposita({ say: "¡Empecemos! Elige tu oposición y añade sus leyes.", mood: "cheer" }),
        2800,
      );
      return () => window.clearTimeout(t);
    }
  }, [loading, error, laws.length]);

  const allOpos = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of laws) for (const o of opoList(l.opos)) map.set(o, (map.get(o) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [laws]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return laws.filter((l) => {
      if (opoFilter !== "todas" && !opoList(l.opos).includes(opoFilter)) return false;
      if (!q) return true;
      return `${l.name} ${l.shortName} ${l.opos} ${l.branch}`.toLowerCase().includes(q);
    });
  }, [laws, search, opoFilter]);

  const daily = useMemo(() => dailyCounts(stats?.points ?? [], 14), [stats]);
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const streak = useMemo(() => streakDays(stats?.points ?? []), [stats]);
  const totalArticles = laws.reduce((s, l) => s + l.articleCount, 0);

  const suggestion = useMemo(() => {
    if (!laws.length) return null;
    const never = laws.find((l) => l.stats.attempts === 0);
    if (never) {
      return { law: never, text: `Aún no has hecho ningún test de ${never.shortName || never.name}. ¡Estrena la carpeta!` };
    }
    const weakest = [...laws].sort((a, b) => a.stats.avgGrade - b.stats.avgGrade)[0];
    if (weakest.stats.avgGrade < 6) {
      return {
        law: weakest,
        text: `Tu nota media en ${weakest.shortName || weakest.name} es un ${weakest.stats.avgGrade.toLocaleString("es-ES")}: toca reforzarla.`,
      };
    }
    const oldest = [...laws].sort((a, b) => +new Date(a.stats.lastAt ?? 0) - +new Date(b.stats.lastAt ?? 0))[0];
    return { law: oldest, text: `Hace tiempo que no repasas ${oldest.shortName || oldest.name}. ¡Que no se te olvide!` };
  }, [laws]);

  const kpis = [
    { icon: Library, label: "leyes en la mesa", value: laws.length, bg: "#fef6c8", rot: "-2deg" },
    { icon: NotebookPen, label: "artículos", value: totalArticles.toLocaleString("es-ES"), bg: "#dbeafe", rot: "1.6deg" },
    { icon: Target, label: "tests y juegos", value: stats?.attempts ?? 0, bg: "#ffe4ec", rot: "-1.2deg" },
    { icon: Trophy, label: "nota media", value: stats?.attempts ? stats.avgGrade.toLocaleString("es-ES") : "–", bg: "#dcfce7", rot: "2deg" },
    { icon: Flame, label: stats && streak === 1 ? "día de racha" : "días de racha", value: streak, bg: "#ffedd5", rot: "-1.6deg" },
    { icon: Timer, label: "tiempo de estudio", value: fmtDuration(stats?.totalSeconds ?? 0), bg: "#ede9fe", rot: "1.2deg" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-20 pt-7 sm:px-6">
      {/* ------------------------------ Cabecera ------------------------------ */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="hidden h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-amber-500 shadow-[0_6px_0_#92400e,0_14px_24px_rgba(146,64,14,0.35)] sm:flex">
            <ScaleDoodle className="h-10 w-10 text-amber-50" />
          </div>
          <div>
            <h1 className="font-hand-caveat text-[48px] font-bold leading-[0.9] text-amber-950 sm:text-[60px]">
              Mi mesa de estudio
            </h1>
            <SquiggleLine className="mt-1 h-3 w-56 text-rose-500" />
            <p className="mt-1.5 max-w-lg text-[15px] leading-snug text-stone-600">
              Una carpeta por cada ley de tu oposición, con sus tests, apuntes completos, juegos y estadísticas.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/oposiciones"
            className="flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-[15px] font-bold text-white shadow-[0_3px_0_#115e59,0_8px_14px_rgba(17,94,89,0.3)] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
          >
            <Search className="h-4.5 w-4.5" /> Buscar mi oposición
          </Link>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white"
          >
            <FolderPlus className="h-4.5 w-4.5" /> Añadir ley
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("oposita-upload"))}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
          >
            <Upload className="h-4.5 w-4.5" /> Subir apuntes (PDF)
          </button>
        </div>
      </header>

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[4px_20px_20px_20px] bg-amber-200/60 ring-1 ring-black/5" />
          ))}
        </div>
      ) : error ? (
        <div className="pop-in mx-auto mt-10 max-w-md -rotate-1 rounded-lg bg-[#fffdf4] p-8 text-center shadow-xl ring-1 ring-black/10">
          <p className="font-hand-caveat text-3xl font-bold text-rose-700">¡Se cayó la mesa!</p>
          <p className="mt-1 text-stone-500">{error}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="btn-primary-hand rounded-full px-5 py-2 font-bold text-white"
            >
              Reintentar
            </button>
            <Link
              href="/diagnostico"
              className="rounded-full bg-white px-5 py-2 font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
            >
              Ver diagnóstico
            </Link>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-stone-500">
            El diagnóstico comprueba la base de datos y el BOE en el servidor y te dice qué arreglar.
          </p>
        </div>
      ) : laws.length === 0 ? (
        /* ------------------------------ Bienvenida ------------------------------ */
        <section className="mt-10">
          <div className="pop-in relative mx-auto max-w-3xl rotate-[-0.4deg] rounded-lg bg-[#fffdf4] px-6 py-10 text-center shadow-[0_20px_40px_-12px_rgba(80,55,15,0.45)] ring-1 ring-black/10 sm:px-12">
            <div className="tape left-1/2 top-[-10px]" style={{ backgroundColor: "rgba(251, 191, 36, 0.5)", transform: "translateX(-50%) rotate(-2deg)" }} />
            <h2 className="font-hand-caveat text-[42px] font-bold leading-none text-amber-950">¡Hola, opositor/a!</h2>
            <p className="mx-auto mt-2 max-w-xl text-[16px] leading-snug text-stone-600">
              Tu mesa está vacía. En tres pasos tendrás todo listo para estudiar las leyes de <strong>tu</strong> oposición:
            </p>
            <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
              {[
                { n: "1", t: "Elige tu oposición", d: "Mira qué leyes suelen entrar en cada una, o añade las tuyas.", bg: "#fef6c8" },
                { n: "2", t: "Añade las leyes", d: "Directo del BOE con un clic, o sube tu PDF o tu texto.", bg: "#dbeafe" },
                { n: "3", t: "Estudia y mide", d: "Genera apuntes completos, tests y juegos. Mira cómo mejoras.", bg: "#dcfce7" },
              ].map((s, i) => (
                <div
                  key={s.n}
                  className="relative rounded-md p-4 shadow-md ring-1 ring-black/5"
                  style={{ backgroundColor: s.bg, transform: `rotate(${i === 1 ? 1.4 : i === 0 ? -1.4 : -0.6}deg)` }}
                >
                  <span className="font-hand-caveat text-[40px] font-bold leading-none text-amber-700/80">{s.n}</span>
                  <p className="font-hand-caveat text-[24px] font-bold leading-tight text-stone-800">{s.t}</p>
                  <p className="mt-0.5 text-[14px] leading-snug text-stone-600">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/oposiciones"
                className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-3 text-[16px] font-bold text-white"
              >
                <Search className="h-5 w-5" /> Buscar mi oposición
              </Link>
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[16px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
              >
                <FolderPlus className="h-5 w-5" /> Subir una ley
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("oposita-upload"))}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[16px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
              >
                <Upload className="h-5 w-5" /> Subir mis apuntes (PDF)
              </button>
            </div>
            <p className="mt-4 text-[12px] leading-snug text-stone-500">
              ¿Subiste leyes desde otro navegador u otra opción y no las ves? Cada código de estudio tiene su propia
              mesa: pulsa la <strong>llave</strong> de la barra de arriba y pega tu código para traerlas aquí.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* ------------------------------ Post-its ------------------------------ */}
          <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className="relative px-3 pb-3 pt-5 text-center shadow-[0_8px_16px_-6px_rgba(80,55,15,0.45)] ring-1 ring-black/5"
                  style={{ backgroundColor: k.bg, transform: `rotate(${k.rot})` }}
                >
                  <div
                    className="tape left-1/2 top-[-9px]"
                    style={{ backgroundColor: "rgba(255,255,255,0.55)", transform: "translateX(-50%) rotate(-2deg) scale(0.55)", transformOrigin: "top center" }}
                  />
                  <Icon className="mx-auto h-4 w-4 text-stone-500" />
                  <p className="font-hand-caveat text-[34px] font-bold leading-none text-stone-800">{k.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-stone-500">{k.label}</p>
                </div>
              );
            })}
          </section>

          {/* ------------------------------ Hoy te toca + actividad ------------------------------ */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {suggestion && (
              <div
                className="relative -rotate-[0.5deg] rounded-lg p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10"
                style={{ background: folderStyle(suggestion.law.color).soft }}
              >
                <div className="tape left-8 top-[-9px]" style={{ backgroundColor: "rgba(244, 114, 182, 0.45)", transform: "rotate(-4deg)" }} />
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  <Sparkles className="h-4 w-4 text-amber-600" /> Oposita te recomienda
                </p>
                <h2 className="font-hand-caveat mt-1 text-[34px] font-bold leading-[1.05] text-amber-950">Hoy te toca…</h2>
                <p className="mt-1 text-[15px] leading-snug text-stone-700">{suggestion.text}</p>
                <Link
                  href={`/leyes/${suggestion.law.id}`}
                  className="btn-primary-hand mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white"
                >
                  Abrir {suggestion.law.shortName || "la carpeta"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <div className="rounded-lg bg-[#fffdf4] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10">
              <p className="font-hand-caveat text-[26px] font-bold leading-none text-amber-950">Tu actividad · 14 días</p>
              <div className="mt-4 flex h-28 items-end gap-1.5">
                {daily.map((d, i) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.count} intentos`}>
                    <div className="flex h-24 w-full items-end">
                      <div
                        className={`w-full rounded-t-md ${d.count ? "bar-grow bg-gradient-to-t from-amber-600 to-amber-400" : "bg-stone-200/70"}`}
                        style={{ height: d.count ? `${Math.max(14, (d.count / maxDaily) * 100)}%` : "6%", animationDelay: `${i * 35}ms` }}
                      />
                    </div>
                    <span className="text-[11px] uppercase text-stone-400">{d.label}</span>
                  </div>
                ))}
              </div>
              {stats && stats.attempts === 0 && (
                <p className="mt-2 text-center text-sm italic text-stone-500">Haz tu primer test y verás aquí tu progreso.</p>
              )}
            </div>
          </section>

          {/* ------------------------------ Carpetas ------------------------------ */}
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-hand-caveat text-[36px] font-bold leading-none text-amber-950">Mis carpetas de leyes</h2>
              <label className="input-paper flex min-w-[220px] items-center gap-2 px-3.5 py-2">
                <Search className="h-4 w-4 shrink-0 text-amber-700" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ley…"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-stone-400"
                />
                {search && (
                  <button type="button" aria-label="Limpiar" onClick={() => setSearch("")}>
                    <X className="h-4 w-4 text-stone-400 hover:text-rose-600" />
                  </button>
                )}
              </label>
            </div>

            {allOpos.length > 0 && (
              <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                {[["todas", laws.length] as [string, number], ...allOpos].map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setOpoFilter(name)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold shadow-sm ring-1 transition-all hover:-rotate-1 ${
                      opoFilter === name ? "bg-amber-500 text-white ring-amber-700/40" : "bg-white/85 text-stone-600 ring-black/10"
                    }`}
                  >
                    {name === "todas" ? "Todas" : name}
                    <span className={`rounded-full px-1.5 text-[11px] ${opoFilter === name ? "bg-white/25" : "bg-amber-100 text-amber-800"}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="mx-auto mt-8 max-w-md rotate-1 rounded-lg bg-[#fef6c8] px-8 py-8 text-center shadow-lg ring-1 ring-black/5">
                <p className="font-hand-caveat text-[30px] font-bold leading-none text-amber-950">Ninguna carpeta coincide</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setOpoFilter("todas");
                  }}
                  className="btn-primary-hand mt-4 rounded-full px-5 py-2 font-bold text-white"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((l, i) => (
                  <LawFolderCard key={l.id} law={l} index={i} />
                ))}
                <button
                  type="button"
                  onClick={() => setAdding(true)}
                  className="note-in mt-8 flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-[4px_20px_20px_20px] border-2 border-dashed border-amber-700/40 bg-white/40 p-6 text-amber-800 transition-all hover:-rotate-1 hover:bg-white/70"
                >
                  <FolderPlus className="h-10 w-10" />
                  <span className="font-hand-caveat text-[28px] font-bold leading-none">Añadir otra ley</span>
                  <span className="text-sm text-stone-500">Del BOE, PDF o texto</span>
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <footer className="mt-14 text-center">
        <p className="text-[13px] leading-snug text-stone-500">
          ¿Algo no carga o no descarga las leyes?{" "}
          <Link
            href="/diagnostico"
            className="font-bold text-amber-800 underline decoration-dashed underline-offset-2"
          >
            Abre el diagnóstico
          </Link>{" "}
          y te dice exactamente qué arreglar en tu despliegue.
        </p>
      </footer>

      {adding && (
        <AddLawDialog
          defaultOpo={opoFilter !== "todas" ? opoFilter : ""}
          onClose={() => setAdding(false)}
          onCreated={(id) => {
            setAdding(false);
            router.push(`/leyes/${id}`);
          }}
        />
      )}
    </main>
  );
}
