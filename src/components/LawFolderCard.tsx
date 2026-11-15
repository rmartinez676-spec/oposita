import Link from "next/link";
import { CalendarClock, FileText, NotebookPen, Target } from "lucide-react";
import { folderStyle, type LawListItem } from "@/lib/lawStyle";
import { opoList } from "@/lib/catalog";

export function timeAgo(iso: string | null): string {
  if (!iso) return "sin practicar";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 2) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function LawFolderCard({ law, index }: { law: LawListItem; index: number }) {
  const st = folderStyle(law.color);
  const opos = opoList(law.opos);
  const mastery = Math.min(100, Math.round((law.stats.avgGrade / 10) * 100));
  const barColor = mastery >= 70 ? "#16a34a" : mastery >= 50 ? "#d97706" : "#dc2626";

  return (
    <Link
      href={`/leyes/${law.id}`}
      className="folder-card note-in group relative block pt-8"
      style={{ animationDelay: `${Math.min(index, 9) * 60}ms`, ["--rot" as string]: "0deg" }}
    >
      <div
        className="absolute left-5 top-0 z-10 flex h-10 max-w-[72%] items-center gap-1.5 rounded-t-xl px-4 text-[14px] font-bold"
        style={{ background: st.tab, color: st.ink, boxShadow: "0 -2px 5px rgba(0,0,0,0.06)" }}
      >
        <span className="text-[17px]">{law.icon}</span>
        <span className="truncate">{law.shortName || law.name}</span>
      </div>

      <div className="absolute inset-x-4 top-6 h-20 rotate-[-1.6deg] rounded-md bg-white shadow ring-1 ring-black/5" />
      <div className="absolute inset-x-5 top-5 h-20 rotate-[1deg] rounded-md bg-[#fffdf4] shadow ring-1 ring-black/5" />

      <div
        className="relative rounded-[4px_20px_20px_20px] p-5 pt-6 ring-1 ring-black/10"
        style={{
          background: `linear-gradient(165deg, ${st.body}, ${st.tab})`,
          boxShadow: "0 10px 22px -10px rgba(80,55,15,0.55), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <h3 className="font-hand-caveat line-clamp-2 min-h-[58px] text-[28px] font-bold leading-[1.04]" style={{ color: st.ink }}>
          {law.name}
        </h3>

        {opos.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {opos.slice(0, 2).map((o) => (
              <span
                key={o}
                className="max-w-full truncate rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-black/5"
                style={{ color: st.ink }}
              >
                {o}
              </span>
            ))}
            {opos.length > 2 && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold" style={{ color: st.ink }}>
                +{opos.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: FileText, value: law.articleCount, label: "artículos" },
            { icon: Target, value: law.stats.attempts, label: "tests y juegos" },
            { icon: NotebookPen, value: law.stats.notes, label: "apuntes" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-lg bg-white/60 px-1 py-1.5 ring-1 ring-black/5">
                <Icon className="mx-auto h-3.5 w-3.5 opacity-60" style={{ color: st.ink }} />
                <p className="font-hand-caveat text-[24px] font-bold leading-none text-stone-800">{s.value}</p>
                <p className="text-[10px] uppercase leading-tight tracking-wide text-stone-600">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[12px] font-bold" style={{ color: st.ink }}>
            <span>{law.stats.attempts ? `Nota media ${law.stats.avgGrade.toLocaleString("es-ES")}` : "Aún sin notas"}</span>
            <span className="flex items-center gap-1 font-normal opacity-80">
              <CalendarClock className="h-3 w-3" />
              {timeAgo(law.stats.lastAt)}
            </span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/70 ring-1 ring-black/5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${law.stats.attempts ? Math.max(mastery, 4) : 0}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
