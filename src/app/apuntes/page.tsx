"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  Eraser,
  GraduationCap,
  Loader2,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { CATEGORIES, formatDate, wordCount, type NoteDraft, type NoteItem } from "@/lib/apuntes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { api, wsFetch } from "@/lib/client";
import type { LawListItem } from "@/lib/lawStyle";
import AddLawDialog from "@/components/AddLawDialog";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import NoteViewer from "@/components/NoteViewer";
import StudyMode from "@/components/StudyMode";
import { ScaleDoodle, SquiggleLine } from "@/components/Doodles";

type SortKey = "recientes" | "antiguos" | "az" | "favoritos";

export default function HomePage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Todas");
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recientes");
  const [laws, setLaws] = useState<LawListItem[]>([]);
  const [lawFilter, setLawFilter] = useState<string>("todas");
  const [addingLaw, setAddingLaw] = useState(false);
  const router = useRouter();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [viewingId, setViewingId] = useState<number | null>(null);
  const [studyOpen, setStudyOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NoteItem | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  /* ------------------------------ Carga ------------------------------ */
  const loadNotes = useCallback(async () => {
    try {
      setLoadError("");
      api<LawListItem[]>("/api/laws")
        .then(setLaws)
        .catch(() => {});
      const data = await api<NoteItem[]>("/api/notes");
      setNotes(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "No se pudo abrir el cuaderno.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  /* ------------------------------ Acciones ---------------------------- */
  const handleSave = async (draft: NoteDraft, id: number | null) => {
    setSaving(true);
    try {
      const res = await wsFetch(id ? `/api/notes/${id}` : "/api/notes", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error("bad");
      const saved = (await res.json()) as NoteItem;
      setNotes((prev) =>
        id ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev],
      );
      setEditorOpen(false);
      setEditing(null);
      showToast(id ? "Apunte retocado y guardado" : "¡Apunte pegado en el cuaderno!");
    } catch {
      showToast("Uy, el boli falló: no se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleFav = async (note: NoteItem) => {
    const next = !note.isFavorite;
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, isFavorite: next } : n)));
    try {
      const res = await wsFetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (!res.ok) throw new Error("bad");
    } catch {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, isFavorite: !next } : n)));
      showToast("No se pudo marcar el favorito");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      const res = await wsFetch(`/api/notes/${target.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("bad");
      setNotes((prev) => prev.filter((n) => n.id !== target.id));
      if (viewingId === target.id) setViewingId(null);
      showToast("Hoja arrancada del cuaderno");
    } catch {
      showToast("La hoja se resiste: no se pudo borrar");
    }
  };

  const seedExamples = async () => {
    try {
      const res = await wsFetch("/api/notes/seed", { method: "POST" });
      if (!res.ok) throw new Error("bad");
      const data = (await res.json()) as NoteItem[];
      setNotes(data);
      showToast("Apuntes de ejemplo copiados en tu cuaderno");
    } catch {
      showToast("No se pudieron cargar los ejemplos");
    }
  };

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (note: NoteItem) => {
    setEditing(note);
    setEditorOpen(true);
  };

  /* ----------------------------- Filtrado ----------------------------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = notes.filter((n) => {
      if (category !== "Todas" && n.category !== category) return false;
      if (favOnly && !n.isFavorite) return false;
      if (lawFilter === "sin" && n.lawId !== null) return false;
      if (lawFilter !== "todas" && lawFilter !== "sin" && String(n.lawId) !== lawFilter) return false;
      if (!q) return true;
      const haystack = [n.title, n.lawName, n.article, n.category, n.content, n.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sort === "recientes") return +new Date(b.createdAt) - +new Date(a.createdAt);
      if (sort === "antiguos") return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === "az") return a.title.localeCompare(b.title, "es");
      return Number(b.isFavorite) - Number(a.isFavorite) || +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return list;
  }, [notes, search, category, favOnly, sort, lawFilter]);

  const stats = useMemo(() => {
    const totalWords = notes.reduce((acc, n) => acc + wordCount(n.content), 0);
    return {
      total: notes.length,
      favs: notes.filter((n) => n.isFavorite).length,
      branches: new Set(notes.map((n) => n.category)).size,
      words: totalWords,
      last: notes.length
        ? formatDate(notes.reduce((a, b) => (+new Date(a.createdAt) > +new Date(b.createdAt) ? a : b)).createdAt)
        : "—",
    };
  }, [notes]);

  const viewing = viewingId !== null ? (notes.find((n) => n.id === viewingId) ?? null) : null;
  const filtersActive = search.trim() !== "" || category !== "Todas" || favOnly;

  const clearFilters = () => {
    setSearch("");
    setCategory("Todas");
    setFavOnly(false);
  };

  /* ------------------------------- Render ------------------------------ */
  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-16 sm:px-6">
      {/* ------------------------------ Cabecera ------------------------------ */}
      <header className="pb-2 pt-8 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="hidden h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-amber-500 shadow-[0_6px_0_#92400e,0_14px_24px_rgba(146,64,14,0.35)] sm:flex">
              <ScaleDoodle className="h-10 w-10 text-amber-50" />
            </div>
            <div>
              <h1 className="font-hand-caveat text-[52px] font-bold leading-[0.9] text-amber-950 sm:text-[64px]">
                Mi cuaderno
              </h1>
              <SquiggleLine className="mt-1 h-3 w-56 text-rose-500" />
              <p className="mt-1.5 max-w-md text-[15px] leading-snug text-stone-600">
                Tus apuntes escritos a mano: los que redactas tú y los que Oposita genera a partir de tus leyes.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAddingLaw(true)}
                  className="btn-primary-hand flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-bold text-white"
                >
                  <FolderPlus className="h-4 w-4" /> Añadir una ley
                </button>
                <Link
                  href="/oposiciones"
                  className="flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-[14px] font-bold text-white shadow-[0_3px_0_#115e59] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
                >
                  <Search className="h-4 w-4" /> Añadir el temario de mi oposición
                </Link>
              </div>
            </div>
          </div>

          {/* Post-its de estadísticas */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "apuntes", value: stats.total, bg: "#fef6c8", rot: "-2deg" },
              { label: "favoritos", value: stats.favs, bg: "#ffe4ec", rot: "1.6deg" },
              { label: "ramas", value: stats.branches, bg: "#dcfce7", rot: "-1.2deg" },
              { label: "palabras de tinta", value: stats.words, bg: "#dbeafe", rot: "2deg" },
            ].map((s) => (
              <div
                key={s.label}
                className="relative w-[104px] px-2 pb-2.5 pt-4 text-center shadow-[0_8px_16px_-6px_rgba(80,55,15,0.45)] ring-1 ring-black/5"
                style={{ backgroundColor: s.bg, transform: `rotate(${s.rot})` }}
              >
                <div className="tape left-1/2 top-[-9px] scale-[0.55]" style={{ backgroundColor: "rgba(255,255,255,0.55)", transform: "translateX(-50%) rotate(-2deg) scale(0.55)", transformOrigin: "top center" }} />
                <p className="font-hand-caveat text-[30px] font-bold leading-none text-stone-800">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-stone-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* --------------------------- Barra de herramientas --------------------------- */}
      <div className="sticky top-3 z-30 mt-4 rounded-[20px] bg-[#fffaf0]/92 p-3 shadow-[0_12px_28px_-10px_rgba(80,55,15,0.4)] ring-1 ring-amber-900/15 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="input-paper flex min-w-[210px] flex-1 items-center gap-2 px-3.5 py-2">
            <Search className="h-4.5 w-4.5 shrink-0 text-amber-700" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca por ley, artículo, etiqueta…"
              className="w-full bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400"
            />
            {search && (
              <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch("")}>
                <X className="h-4 w-4 text-stone-400 hover:text-rose-600" />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => setFavOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold shadow-sm ring-1 transition-all hover:-rotate-1 ${
              favOnly
                ? "bg-amber-300 text-amber-900 ring-amber-600/50"
                : "bg-white/85 text-stone-600 ring-black/10 hover:text-amber-800"
            }`}
          >
            <Star className={`h-4 w-4 ${favOnly ? "fill-amber-500 text-amber-600" : ""}`} />
            Favoritos
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input-paper cursor-pointer px-3 py-2 text-sm text-stone-700"
            aria-label="Ordenar apuntes"
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="az">A → Z</option>
            <option value="favoritos">Favoritos primero</option>
          </select>

          {laws.length > 0 && (
            <select
              value={lawFilter}
              onChange={(e) => setLawFilter(e.target.value)}
              className="input-paper max-w-[200px] cursor-pointer px-3 py-2 text-sm text-stone-700"
              aria-label="Filtrar por carpeta de ley"
            >
              <option value="todas">Todas las carpetas</option>
              <option value="sin">Sin carpeta</option>
              {laws.map((l) => (
                <option key={l.id} value={String(l.id)}>
                  {l.shortName || l.name}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto flex gap-2.5">
            <button
              type="button"
              onClick={() => setStudyOpen(true)}
              className="flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_#115e59,0_8px_14px_rgba(17,94,89,0.3)] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
            >
              <GraduationCap className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Modo repaso</span>
              <span className="sm:hidden">Repaso</span>
            </button>
            <button
              type="button"
              onClick={openNew}
              className="btn-primary-hand flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white"
            >
              <Plus className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Nuevo apunte</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Filtros por rama */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {[{ name: "Todas", dot: "#d97706", bg: "#fef3c7", text: "#92400e", tape: "" }, ...CATEGORIES].map(
            (c) => {
              const active = category === c.name;
              const count =
                c.name === "Todas" ? notes.length : notes.filter((n) => n.category === c.name).length;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
                  style={
                    active
                      ? { backgroundColor: c.dot, color: "#fff", borderColor: "transparent", ["--tw-ring-color" as string]: "transparent" }
                      : { backgroundColor: "rgba(255,255,255,0.8)", color: "#57534e", ["--tw-ring-color" as string]: "rgba(0,0,0,0.08)" }
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: active ? "#fff" : c.dot }}
                  />
                  {c.name}
                  <span
                    className="rounded-full px-1.5 text-[11px]"
                    style={{
                      backgroundColor: active ? "rgba(255,255,255,0.25)" : c.bg,
                      color: active ? "#fff" : c.text,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* ------------------------------ Contenido ------------------------------ */}
      <section className="mt-8">
        {loading ? (
          <div>
            <p className="flex items-center gap-2 font-hand-caveat text-[26px] font-semibold text-amber-900">
              <NotebookPen className="pencil-write h-6 w-6 text-amber-700" />
              Abriendo tu cuaderno…
            </p>
            <div className="mt-5 columns-1 gap-6 sm:columns-2 xl:columns-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="mb-6 h-56 animate-pulse break-inside-avoid rounded-lg bg-[#fffdf4] p-5 shadow-md ring-1 ring-black/5"
                  style={{ transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)` }}
                >
                  <div className="h-4 w-24 rounded bg-stone-200" />
                  <div className="mt-4 h-7 w-3/4 rounded bg-stone-200" />
                  <div className="mt-4 space-y-2.5">
                    <div className="h-3.5 w-full rounded bg-stone-100" />
                    <div className="h-3.5 w-5/6 rounded bg-stone-100" />
                    <div className="h-3.5 w-4/6 rounded bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="pop-in mx-auto max-w-md -rotate-1 rounded-lg bg-[#fffdf4] p-8 text-center shadow-xl ring-1 ring-black/10">
            <p className="font-hand-caveat text-3xl font-bold text-rose-700">No he podido abrir el cuaderno</p>
            <p className="mt-1 text-stone-500">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadNotes();
              }}
              className="btn-primary-hand mt-4 rounded-full px-5 py-2 font-bold text-white"
            >
              Recoger y reintentar
            </button>
          </div>
        ) : notes.length === 0 ? (
          /* Cuaderno totalmente vacío */
          <div className="pop-in relative mx-auto max-w-lg rotate-[-0.6deg] rounded-lg bg-[#fffdf4] px-8 py-12 text-center shadow-[0_20px_40px_-12px_rgba(80,55,15,0.45)] ring-1 ring-black/10">
            <div className="tape left-1/2 top-[-10px]" style={{ backgroundColor: "rgba(251, 191, 36, 0.5)", transform: "translateX(-50%) rotate(-2deg)" }} />
            <ScaleDoodle className="mx-auto h-16 w-16 text-amber-600/80" />
            <h2 className="font-hand-caveat mt-3 text-[38px] font-bold leading-none text-amber-950">
              Tu cuaderno está en blanco
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-stone-500">
              Todavía no hay ninguna hoja escrita. Estrena el boli con tu primer apunte o copia los de ejemplo para
              ver cómo queda la letra.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={openNew}
                className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-white"
              >
                <Plus className="h-4 w-4" /> Escribir mi primer apunte
              </button>
              <button
                type="button"
                onClick={seedExamples}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
              >
                <Sparkles className="h-4 w-4" /> Cargar apuntes de ejemplo
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          /* Sin resultados con los filtros actuales */
          <div className="pop-in mx-auto max-w-md rotate-1 rounded-lg bg-[#fef6c8] px-8 py-10 text-center shadow-[0_16px_32px_-10px_rgba(80,55,15,0.45)] ring-1 ring-black/5">
            <BookOpen className="mx-auto h-10 w-10 text-amber-700/70" />
            <h2 className="font-hand-caveat mt-2 text-[32px] font-bold leading-none text-amber-950">
              Nada por esta página…
            </h2>
            <p className="mt-1.5 text-stone-600">
              Ningún apunte coincide con la búsqueda. Prueba con otra palabra o limpia los filtros.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="btn-primary-hand mx-auto mt-5 flex items-center gap-2 rounded-full px-5 py-2 font-bold text-white"
            >
              <Eraser className="h-4 w-4" /> Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 font-hand-caveat text-[24px] font-semibold text-amber-900/80">
              {filtered.length} {filtered.length === 1 ? "apunte" : "apuntes"}
              {filtersActive ? " con estos filtros" : " en el cuaderno"}
              {stats.last !== "—" && !filtersActive && (
                <span className="text-stone-500"> · último escrito el {stats.last}</span>
              )}
            </p>
            <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
              {filtered.map((note, i) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  index={i}
                  onView={(n) => setViewingId(n.id)}
                  onEdit={openEdit}
                  onDelete={(n) => setPendingDelete(n)}
                  onToggleFav={toggleFav}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* -------------------------------- Pie -------------------------------- */}
      <footer className="mt-14 text-center">
        <SquiggleLine className="mx-auto h-2.5 w-40 text-amber-700/50" />
        <p className="mt-2 font-hand-caveat text-[22px] text-stone-500">
          Estudia un artículo cada día… ¡y no te olvides el rotulador!
        </p>
      </footer>

      {/* ------------------------------ Diálogos ------------------------------ */}
      {editorOpen && (
        <NoteEditor
          laws={laws}
          initial={editing}
          saving={saving}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      {addingLaw && (
        <AddLawDialog
          onClose={() => setAddingLaw(false)}
          onCreated={(id) => {
            setAddingLaw(false);
            router.push(`/leyes/${id}`);
          }}
        />
      )}

      {viewing && (
        <NoteViewer
          note={viewing}
          onClose={() => setViewingId(null)}
          onEdit={(n) => openEdit(n)}
          onDelete={(n) => setPendingDelete(n)}
          onToggleFav={toggleFav}
        />
      )}

      {studyOpen && <StudyMode notes={filtered} onClose={() => setStudyOpen(false)} />}

      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fade-in absolute inset-0 bg-stone-900/55 backdrop-blur-[2px]" onClick={() => setPendingDelete(null)} />
          <div className="pop-in relative w-full max-w-sm -rotate-1 rounded-lg bg-[#fff0f4] p-6 text-center shadow-2xl ring-1 ring-black/10">
            <div className="tape left-1/2 top-[-10px]" style={{ backgroundColor: "rgba(244, 114, 182, 0.45)", transform: "translateX(-50%) rotate(-2deg) scale(0.9)" }} />
            <Trash2 className="mx-auto h-9 w-9 text-rose-600" />
            <h3 className="font-hand-caveat mt-1 text-[30px] font-bold leading-tight text-stone-800">
              ¿Arrancamos esta hoja?
            </h3>
            <p className="mt-1 text-[15px] text-stone-600">
              «{pendingDelete.title}» desaparecerá del cuaderno para siempre. La papelera no perdona…
            </p>
            <div className="mt-5 flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-full bg-white px-4 py-2 font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
              >
                Mejor no
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-rose-600 px-4 py-2 font-bold text-white shadow-[0_3px_0_#881337,0_8px_14px_rgba(136,19,55,0.3)] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
              >
                Sí, arrancar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------- Toast -------------------------------- */}
      {toast && (
        <div className="toast-up fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#fef6c8] px-4 py-2.5 font-bold text-amber-900 shadow-[0_14px_28px_-8px_rgba(80,55,15,0.55)] ring-1 ring-amber-600/20">
          {toast.includes("no") || toast.includes("Uy") || toast.includes("resiste") ? (
            <X className="h-4.5 w-4.5 text-rose-600" />
          ) : (
            <Check className="h-4.5 w-4.5 text-emerald-600" />
          )}
          {toast}
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )}
    </main>
  );
}
