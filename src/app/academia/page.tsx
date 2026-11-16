"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, School, Upload } from "lucide-react";
import { api } from "@/lib/client";
import type { NoteDraft, NoteItem } from "@/lib/apuntes";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import NoteViewer from "@/components/NoteViewer";
import UploadNotesDialog from "@/components/UploadNotesDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import { SquiggleLine } from "@/components/Doodles";

/** Documentos de la academia: los PDF/TXT que subes, convertidos en hojas. */
export default function AcademiaPage() {
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<NoteItem | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setNotes(await api<NoteItem[]>("/api/notes"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar tus documentos");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onImported = () => load();
    window.addEventListener("oposita-notes-imported", onImported);
    return () => window.removeEventListener("oposita-notes-imported", onImported);
  }, [load]);

  const docs = useMemo(
    () => (notes ?? []).filter((n) => n.tags.split(",").map((t) => t.trim()).includes("importado")),
    [notes],
  );

  const viewing = viewingId !== null ? (notes ?? []).find((n) => n.id === viewingId) ?? null : null;

  const toggleFav = async (note: NoteItem) => {
    const next = !note.isFavorite;
    setNotes((prev) => (prev ?? []).map((n) => (n.id === note.id ? { ...n, isFavorite: next } : n)));
    try {
      await api(`/api/notes/${note.id}`, { method: "PATCH", json: { isFavorite: next } });
    } catch {
      setNotes((prev) => (prev ?? []).map((n) => (n.id === note.id ? { ...n, isFavorite: !next } : n)));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete;
    setToDelete(null);
    try {
      await api(`/api/notes/${target.id}`, { method: "DELETE" });
      setNotes((prev) => (prev ?? []).filter((n) => n.id !== target.id));
      if (viewingId === target.id) setViewingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-20 pt-7 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="hidden h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-teal-700 shadow-[0_6px_0_#115e59,0_14px_24px_rgba(17,94,89,0.35)] sm:flex">
            <School className="h-9 w-9 text-teal-50" />
          </div>
          <div>
            <h1 className="font-hand-caveat text-[48px] font-bold leading-[0.9] text-amber-950 sm:text-[58px]">Academia</h1>
            <SquiggleLine className="mt-1 h-3 w-40 text-teal-600" />
            <p className="mt-1.5 max-w-xl text-[15px] leading-snug text-stone-600">
              Aquí viven los documentos de tu academia: cada PDF o TXT que subes queda como un documento completo,
              con sus temas en el orden original, listo para leer, repasar y editar. Puedes subir varios a la vez.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-3 text-[16px] font-bold text-white"
        >
          <Upload className="h-5 w-5" /> Subir PDF de la academia
        </button>
      </header>

      {error && (
        <div className="pop-in mt-6 max-w-lg rounded-lg bg-[#fff0f4] p-4 shadow ring-1 ring-rose-300">
          <p className="text-[14px] leading-snug text-rose-800">{error}</p>
          <button type="button" onClick={load} className="btn-primary-hand mt-3 rounded-full px-4 py-1.5 text-sm font-bold text-white">
            Reintentar
          </button>
        </div>
      )}

      {notes === null ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-white/60" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="pop-in mx-auto mt-10 flex max-w-xl -rotate-[0.5deg] flex-col items-center gap-2 rounded-xl border-2 border-dashed border-teal-700/40 bg-white/60 px-8 py-12 text-center shadow-sm transition-all hover:bg-white"
        >
          <Upload className="h-10 w-10 text-teal-700" />
          <span className="font-hand-caveat text-[32px] font-bold leading-none text-amber-950">
            Todavía no hay documentos de la academia
          </span>
          <span className="text-[14px] leading-snug text-stone-600">
            Suelta aquí los PDF de tus apuntes (varios a la vez) o toca para elegirlos. Cada uno queda como un
            documento completo y ordenado. También vale un .txt con el texto pegado.
          </span>
        </button>
      ) : (
        <>
          <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.14em] text-stone-400">
            {docs.length} {docs.length === 1 ? "documento" : "documentos"} · {docs.reduce((s, n) => s + n.content.split(/\s+/).length, 0).toLocaleString("es-ES")} palabras
          </p>
          <div className="mt-4 columns-1 gap-6 sm:columns-2 xl:columns-3">
            {docs.map((n, i) => (
              <NoteCard
                key={n.id}
                note={n}
                index={i}
                onView={(x) => setViewingId(x.id)}
                onEdit={(x) => setEditing(x)}
                onDelete={(x) => setToDelete(x)}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        </>
      )}

      <p className="mt-10 text-center text-[13px] text-stone-500">
          ¿Buscas tus apuntes escritos a mano o los generados desde una ley?{" "}
        <Link href="/apuntes" className="font-bold text-amber-800 underline decoration-dashed underline-offset-2">
          Están en el Cuaderno
        </Link>
        .
      </p>

      {uploadOpen && (
        <UploadNotesDialog
          onClose={() => setUploadOpen(false)}
          onImported={(created) => {
            setNotes((prev) => [...created, ...(prev ?? [])]);
            setUploadOpen(false);
          }}
        />
      )}

      {viewing && (
        <NoteViewer
          note={viewing}
          onClose={() => setViewingId(null)}
          onEdit={(n) => setEditing(n)}
          onDelete={(n) => setToDelete(n)}
          onToggleFav={toggleFav}
        />
      )}

      {editing && (
        <NoteEditor
          initial={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={async (draft: NoteDraft, id: number | null) => {
            if (!id) return;
            setSaving(true);
            try {
              const saved = await api<NoteItem>(`/api/notes/${id}`, { method: "PATCH", json: draft });
              setNotes((prev) => (prev ?? []).map((n) => (n.id === saved.id ? saved : n)));
              setEditing(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo guardar");
            } finally {
              setSaving(false);
            }
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Borrar este documento?"
          message={`«${toDelete.title}» desaparecerá de Academia y del Cuaderno.`}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {notes === null && !error && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando tus documentos…
        </p>
      )}
    </main>
  );
}
