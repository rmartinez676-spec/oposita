"use client";

import { useMemo } from "react";
import { BarChart3, Clock3, Flame, Target, Trophy } from "lucide-react";
import { fmtDuration, fmtGrade, KIND_INFO, type AttemptKind } from "@/lib/quizTypes";
import { dailyCounts, streakDays, type StatsSummary } from "@/lib/stats";

interface LawStatsProps {
  stats: StatsSummary | null;
  loading: boolean;
  onFallos: () => void;
}

export default function LawStats({ stats, loading, onFallos }: LawStatsProps) {
  const last = useMemo(() => (stats?.points ?? []).slice(-20), [stats]);
  const daily = useMemo(() => dailyCounts(stats?.points ?? [], 14), [stats]);
  const streak = useMemo(() => streakDays(stats?.points ?? []), [stats]);
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));

  if (loading && !stats) {
    return <div className="h-64 animate-pulse rounded-lg bg-white/60" />;
  }
  if (!stats || stats.attempts === 0) {
    return (
      <div className="pop-in mx-auto max-w-lg -rotate-1 rounded-lg bg-[#fef6c8] p-8 text-center shadow-lg ring-1 ring-black/5">
        <BarChart3 className="mx-auto h-10 w-10 text-amber-700/70" />
        <p className="font-hand-caveat mt-1 text-[34px] font-bold leading-none text-amber-950">Todavía no hay estadísticas</p>
        <p className="mt-1.5 text-[14px] text-stone-600">Haz tu primer test o juego de esta ley y aquí verás tu evolución, tus mejores notas y los artículos que más se te atragantan.</p>
      </div>
    );
  }

  const kpis = [
    { icon: Target, label: "tests y juegos", value: stats.attempts, bg: "#fef6c8", rot: "-2deg" },
    { icon: Trophy, label: "nota media", value: fmtGrade(stats.avgGrade), bg: "#dcfce7", rot: "1.6deg" },
    { icon: Trophy, label: "mejor nota", value: fmtGrade(stats.bestGrade), bg: "#dbeafe", rot: "-1.2deg" },
    { icon: Flame, label: "días de racha", value: streak, bg: "#ffedd5", rot: "2deg" },
    { icon: Clock3, label: "tiempo de estudio", value: fmtDuration(stats.totalSeconds), bg: "#ede9fe", rot: "-1.6deg" },
  ];

  const trend = last.length >= 4 ? last.slice(-3).reduce((s, p) => s + p.grade, 0) / 3 - last.slice(-6, -3).reduce((s, p) => s + p.grade, 0) / Math.max(1, last.slice(-6, -3).length) : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="relative px-3 pb-3 pt-5 text-center shadow-[0_8px_16px_-6px_rgba(80,55,15,0.45)] ring-1 ring-black/5" style={{ backgroundColor: k.bg, transform: `rotate(${k.rot})` }}>
              <div className="tape left-1/2 top-[-9px]" style={{ backgroundColor: "rgba(255,255,255,0.55)", transform: "translateX(-50%) rotate(-2deg) scale(0.55)", transformOrigin: "top center" }} />
              <Icon className="mx-auto h-4 w-4 text-stone-500" />
              <p className="font-hand-caveat text-[34px] font-bold leading-none text-stone-800">{k.value}</p>
              <p className="text-[11px] uppercase tracking-wide text-stone-500">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Evolución */}
        <section className="rounded-lg bg-[#fffdf4] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">Evolución de tus notas</h3>
            {trend !== null && (
              <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${trend >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                {trend >= 0 ? "▲ Subiendo" : "▼ Bajando"} {Math.abs(trend).toLocaleString("es-ES", { maximumFractionDigits: 1 })} pts
              </span>
            )}
          </div>
          <div className="relative mt-4 h-44">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-amber-600/40" />
            <span className="absolute -top-1 right-0 text-[10px] font-bold text-amber-700/70">aprobado: 5</span>
            <div className="absolute inset-0 flex items-end gap-1.5">
              {last.map((p, i) => (
                <div key={p.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${p.title} · ${fmtGrade(p.grade)} · ${new Date(p.createdAt).toLocaleDateString("es-ES")}`}>
                  <span className="text-[10px] font-bold text-stone-500">{fmtGrade(p.grade)}</span>
                  <div
                    className={`bar-grow w-full max-w-[34px] rounded-t-md ${p.grade >= 5 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-gradient-to-t from-rose-600 to-rose-400"}`}
                    style={{ height: `${Math.max(4, (p.grade / 10) * 78)}%`, animationDelay: `${i * 40}ms` }}
                  />
                  <span className="text-[13px] leading-none">{KIND_INFO[p.kind as AttemptKind]?.emoji ?? "📝"}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-stone-400">Tus últimos {last.length} intentos (de izquierda a derecha, del más antiguo al más reciente)</p>
        </section>

        {/* Precisión + modalidades */}
        <section className="rounded-lg bg-[#fffdf4] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10">
          <h3 className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">Precisión</h3>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="relative h-24 w-24 shrink-0 rounded-full shadow-inner"
              style={{ background: `conic-gradient(#16a34a ${stats.accuracy * 3.6}deg, #fecaca 0)` }}
            >
              <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-[#fffdf4] font-hand-caveat text-[30px] font-bold text-stone-800">
                {stats.accuracy}%
              </div>
            </div>
            <p className="text-[13px] leading-snug text-stone-600">
              <strong>{stats.questionsCorrect}</strong> aciertos de <strong>{stats.questionsAnswered}</strong> preguntas respondidas.
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {stats.byKind.map((k) => (
              <li key={k.kind} className="flex items-center gap-2 text-[13px]">
                <span className="w-6 text-center text-[18px]">{KIND_INFO[k.kind as AttemptKind]?.emoji}</span>
                <span className="w-28 shrink-0 truncate font-bold text-stone-700">{KIND_INFO[k.kind as AttemptKind]?.label}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${(k.avgGrade / 10) * 100}%` }} />
                </div>
                <span className="w-16 text-right text-stone-500">
                  {fmtGrade(k.avgGrade)} <span className="text-[11px]">({k.count})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Artículos flojos */}
        <section className="rounded-lg bg-[#fff0f4] p-5 shadow-[0_14px_28px_-12px_rgba(131,24,67,0.35)] ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-hand-caveat text-[28px] font-bold leading-none text-rose-950">Tus artículos flojos</h3>
            {stats.weak.length > 0 && (
              <button
                type="button"
                onClick={onFallos}
                className="flex items-center gap-1.5 rounded-full bg-teal-700 px-4 py-2 text-[13px] font-bold text-white shadow-[0_3px_0_#115e59] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
              >
                <Target className="h-4 w-4" /> Repasarlos con un test
              </button>
            )}
          </div>
          {stats.weak.length === 0 ? (
            <p className="mt-3 text-[14px] italic text-stone-600">Sin fallos registrados todavía. ¡O has estudiado muy bien o aún no has jugado lo suficiente!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.weak.map((w) => (
                <li key={w.articleId} className="flex items-center gap-3 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-black/5">
                  <span className="w-24 shrink-0 truncate rounded-md bg-rose-100 px-2 py-0.5 text-center text-[12px] font-bold text-rose-900">{w.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600" style={{ width: `${Math.max(8, w.rate * 100)}%` }} />
                  </div>
                  <span className="shrink-0 text-[12px] text-stone-600">
                    {w.wrong} de {w.seen} fallos
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actividad */}
        <section className="rounded-lg bg-[#fffdf4] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10">
          <h3 className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">Actividad · 14 días</h3>
          <div className="mt-4 flex h-28 items-end gap-1.5">
            {daily.map((d, i) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.count}`}>
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
        </section>
      </div>
    </div>
  );
}
