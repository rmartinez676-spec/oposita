"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, FolderPlus, Loader2, Plus, Search, X } from "lucide-react";
import { api, oposita } from "@/lib/client";
import { CATALOG_LAWS, normalizeSearch, OPOSICIONES, type Oposicion } from "@/lib/catalog";
import type { LawListItem } from "@/lib/lawStyle";
import AddLawDialog from "@/components/AddLawDialog";
import { SquiggleLine } from "@/components/Doodles";

type Status = "loading" | "error";

export default function OposicionesPage() {
  const router = useRouter();
  const [mine, setMine] = useState<LawListItem[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todas");
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [batch, setBatch] = useState<{ opo: string; done: number; total: number } | null>(null);
  const [custom, setCustom] = useState(false);
  const [lawOpo, setLawOpo] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    try {
      setMine(await api<LawListItem[]>("/api/laws"));
    } catch {
      /* sin conexión: seguimos mostrando el catálogo */
    }
  }, []);

  useEffect(() => {
    refresh();
    oposita({ focus: false });
  }, [refresh]);

  const have = useMemo(() => new Set(mine.map((l) => l.boeId).filter(Boolean)), [mine]);
  const groups = useMemo(() => ["Todas", ...new Set(OPOSICIONES.map((o) => o.group))], []);
  const q = normalizeSearch(query);

  const optsFor = useCallback((lawKey: string) => OPOSICIONES.filter((o) => o.laws.includes(lawKey)), []);

  const matchingOpos = useMemo(() => {
    return OPOSICIONES.filter((o) => {
      if (group !== "Todas" && o.group !== group) return false;
      if (!q) return true;
      return normalizeSearch(`${o.name} ${o.group} ${o.aliases} ${o.description}`).includes(q);
    });
  }, [q, group]);

  const matchingLaws = useMemo(() => {
    if (!q) return [];
    return Object.values(CATALOG_LAWS).filter((l) =>
      normalizeSearch(`${l.name} ${l.shortName} ${l.topic}`).includes(q),
    );
  }, [q]);

  const addLaw = useCallback(
    async (lawKey: string, opoName: string): Promise<boolean> => {
      const cl = CATALOG_LAWS[lawKey];
      setStatus((s) => ({ ...s, [lawKey]: "loading" }));
      setErrors((e) => ({ ...e, [lawKey]: "" }));
      try {
        await api("/api/laws", {
          method: "POST",
          json: { boeId: cl.boeId, name: cl.name, shortName: cl.shortName, opos: opoName },
        });
        setStatus((s) => {
          const n = { ...s };
          delete n[lawKey];
          return n;
        });
        await refresh();
        return true;
      } catch (e) {
        setStatus((s) => ({ ...s, [lawKey]: "error" }));
        setErrors((er) => ({ ...er, [lawKey]: e instanceof Error ? e.message : "No se pudo añadir" }));
        return false;
      }
    },
    [refresh],
  );

  const addAll = async (opo: Oposicion) => {
    const pending = opo.laws.filter((k) => !have.has(CATALOG_LAWS[k].boeId));
    if (!pending.length) {
      router.push("/");
      return;
    }
    setBatch({ opo: opo.name, done: 0, total: pending.length });
    oposita({ say: `¡Preparando el temario de ${opo.name}! Ve a por un café ☕`, mood: "cheer" });
    let ok = 0;
    for (const key of pending) {
      const success = await addLaw(key, opo.name);
      if (success) ok++;
      setBatch((b) => (b ? { ...b, done: b.done + 1 } : b));
    }
    setBatch(null);
    oposita({
      say: ok === pending.length ? "¡Temario completo en tu mesa! Ahora a estudiar 💪" : `Añadí ${ok} de ${pending.length}. Reintenta las que fallaron.`,
      mood: ok === pending.length ? "cheer" : "think",
    });
  };

  const LawRow = ({ lawKey, opoName }: { lawKey: string; opoName: string }) => {
    const l = CATALOG_LAWS[lawKey];
    const owned = have.has(l.boeId);
    const st = status[lawKey];
    return (
      <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-black/5">
        <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[12px] font-bold text-amber-900">{l.shortName}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold leading-tight text-stone-800">{l.name}</p>
          <p className="truncate text-[12px] text-stone-500">{l.topic}</p>
          {st === "error" && (
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-rose-700">
              <AlertTriangle className="h-3 w-3" /> {errors[lawKey]}
            </p>
          )}
        </div>
        {owned ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-bold text-emerald-800">
            <Check className="h-3.5 w-3.5" /> En tu mesa
          </span>
        ) : (
          <button
            type="button"
            disabled={st === "loading" || !!batch}
            onClick={() => addLaw(lawKey, opoName)}
            className="btn-primary-hand flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white disabled:opacity-60"
          >
            {st === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {st === "loading" ? "Importando…" : st === "error" ? "Reintentar" : "Añadir"}
          </button>
        )}
      </li>
    );
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-7 sm:px-6">
      <header>
        <h1 className="font-hand-caveat text-[48px] font-bold leading-[0.9] text-amber-950 sm:text-[58px]">
          ¿Qué oposición preparas?
        </h1>
        <SquiggleLine className="mt-1 h-3 w-60 text-rose-500" />
        <p className="mt-2 max-w-2xl text-[15px] leading-snug text-stone-600">
          Busca tu oposición para ver las leyes que suelen entrar, o busca una ley y descubre en qué oposiciones cae. Con un
          clic se importa del BOE a tu mesa.
        </p>
        <p className="mt-1.5 flex max-w-2xl items-start gap-1.5 text-[13px] leading-snug text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Los temarios son orientativos y cambian en cada convocatoria: contrasta siempre con las bases oficiales y añade
          las leyes autonómicas o específicas que falten.
        </p>
      </header>

      {/* Buscador */}
      <div className="sticky top-[68px] z-30 mt-5 rounded-[20px] bg-[#fffaf0]/92 p-3 shadow-[0_12px_28px_-10px_rgba(80,55,15,0.4)] ring-1 ring-amber-900/15 backdrop-blur-md">
        <label className="input-paper flex items-center gap-2 px-4 py-2.5">
          <Search className="h-5 w-5 shrink-0 text-amber-700" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej.: auxiliar administrativo, guardia civil, Ley 39/2015, tráfico…"
            className="w-full bg-transparent text-[16px] outline-none placeholder:text-stone-400"
            autoFocus
          />
          {query && (
            <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery("")}>
              <X className="h-4.5 w-4.5 text-stone-400 hover:text-rose-600" />
            </button>
          )}
        </label>
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-bold shadow-sm ring-1 transition-all hover:-rotate-1 ${
                group === g ? "bg-amber-500 text-white ring-amber-700/40" : "bg-white/85 text-stone-600 ring-black/10"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {batch && (
        <div className="pop-in mt-5 rounded-xl bg-[#fef6c8] p-4 shadow-md ring-1 ring-amber-600/25">
          <p className="flex items-center gap-2 text-[15px] font-bold text-amber-900">
            <Loader2 className="h-4 w-4 animate-spin" />
            Importando el temario de {batch.opo}… ({batch.done}/{batch.total})
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(batch.done / batch.total) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-stone-500">Cada ley se descarga del BOE y se trocea en artículos. Puede tardar unos segundos por ley.</p>
        </div>
      )}

      {/* Resultados de leyes */}
      {q && matchingLaws.length > 0 && (
        <section className="mt-8">
          <h2 className="font-hand-caveat text-[32px] font-bold leading-none text-amber-950">Leyes que coinciden</h2>
          <ul className="mt-3 space-y-2.5">
            {matchingLaws.slice(0, 14).map((l) => {
              const opos = optsFor(l.key);
              const owned = have.has(l.boeId);
              const st = status[l.key];
              const selected = lawOpo[l.key] ?? opos[0]?.name ?? "";
              return (
                <li key={l.key} className="rounded-xl bg-white/80 p-3.5 shadow-sm ring-1 ring-black/5">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[12px] font-bold text-amber-900">{l.shortName}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-tight text-stone-800">{l.name}</p>
                      <p className="text-[12px] text-stone-500">{l.topic}</p>
                      {opos.length > 0 && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-stone-500">
                          Entra en:
                          {opos.map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => {
                                setQuery(o.name.split("(")[0].trim());
                                setOpenId(o.id);
                              }}
                              className="rounded-full bg-teal-50 px-2 py-0.5 font-bold text-teal-800 ring-1 ring-teal-700/15 hover:bg-teal-100"
                            >
                              {o.emoji} {o.name.split("(")[0].trim()}
                            </button>
                          ))}
                        </p>
                      )}
                      {st === "error" && <p className="mt-1 text-[12px] text-rose-700">{errors[l.key]}</p>}
                    </div>
                    {owned ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-bold text-emerald-800">
                        <Check className="h-3.5 w-3.5" /> En tu mesa
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {opos.length > 1 && (
                          <select
                            value={selected}
                            onChange={(e) => setLawOpo((s) => ({ ...s, [l.key]: e.target.value }))}
                            className="input-paper max-w-[170px] cursor-pointer px-2 py-1.5 text-[12px]"
                            aria-label="Oposición para la que la añades"
                          >
                            {opos.map((o) => (
                              <option key={o.id} value={o.name}>
                                {o.name.split("(")[0].trim()}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          disabled={st === "loading" || !!batch}
                          onClick={() => addLaw(l.key, selected)}
                          className="btn-primary-hand flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white disabled:opacity-60"
                        >
                          {st === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          {st === "loading" ? "Importando…" : "Añadir"}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Oposiciones */}
      <section className="mt-8">
        <h2 className="font-hand-caveat text-[32px] font-bold leading-none text-amber-950">
          {q ? "Oposiciones que coinciden" : "Oposiciones"}
        </h2>
        {matchingOpos.length === 0 ? (
          <div className="mt-4 rounded-lg bg-[#fef6c8] p-6 text-center shadow ring-1 ring-black/5">
            <p className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">No encuentro esa oposición…</p>
            <p className="mt-1 text-[14px] text-stone-600">
              No pasa nada: añade tus propias leyes (BOE, PDF o texto) y organízalas con el nombre de tu oposición.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {matchingOpos.map((o, i) => {
              const open = openId === o.id;
              const owned = o.laws.filter((k) => have.has(CATALOG_LAWS[k].boeId)).length;
              const complete = owned === o.laws.length;
              return (
                <article
                  key={o.id}
                  className="note-in relative rounded-lg bg-[#fffdf4] p-4 shadow-[0_10px_24px_-10px_rgba(80,55,15,0.45)] ring-1 ring-black/10"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms`, ["--rot" as string]: "0deg" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 -rotate-6 items-center justify-center rounded-xl bg-amber-100 text-[26px] shadow-sm ring-1 ring-amber-700/20">
                      {o.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-hand-caveat text-[26px] font-bold leading-[1.05] text-amber-950">{o.name}</h3>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400">{o.group}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[14px] leading-snug text-stone-600">{o.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : o.id)}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold text-amber-900 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
                    >
                      {o.laws.length} leyes · {open ? "ocultar" : "ver"}
                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      type="button"
                      disabled={!!batch}
                      onClick={() => addAll(o)}
                      className="btn-primary-hand flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white disabled:opacity-60"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      {complete ? "Ir a mi mesa" : owned > 0 ? `Añadir las ${o.laws.length - owned} que faltan` : "Añadir temario completo"}
                    </button>
                    {owned > 0 && (
                      <span className="text-[12px] font-bold text-emerald-700">
                        {owned}/{o.laws.length} en tu mesa
                      </span>
                    )}
                  </div>
                  {open && (
                    <ul className="pop-in mt-3 space-y-1.5">
                      {o.laws.map((k) => (
                        <LawRow key={k} lawKey={k} opoName={o.name} />
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Oposición propia */}
      <section className="relative mx-auto mt-12 max-w-2xl rotate-[-0.5deg] rounded-lg bg-[#dbeafe] p-6 text-center shadow-[0_14px_28px_-12px_rgba(30,58,138,0.4)] ring-1 ring-black/5">
        <div className="tape left-1/2 top-[-10px]" style={{ backgroundColor: "rgba(255,255,255,0.6)", transform: "translateX(-50%) rotate(-2deg)" }} />
        <h2 className="font-hand-caveat text-[34px] font-bold leading-none text-blue-950">¿Tu oposición no está o te faltan leyes?</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-snug text-stone-600">
          Sube tus propias leyes (estatuto de autonomía, normas locales, reglamentos…) y ponles el nombre de tu oposición:
          funcionan igual que las del catálogo.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setCustom(true)}
            className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-white"
          >
            <FolderPlus className="h-4.5 w-4.5" /> Añadir una ley a mano
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-blue-900 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
          >
            Ver mi mesa ({mine.length})
          </Link>
        </div>
      </section>

      {custom && (
        <AddLawDialog
          onClose={() => setCustom(false)}
          onCreated={(id) => {
            setCustom(false);
            router.push(`/leyes/${id}`);
          }}
        />
      )}
    </main>
  );
}
