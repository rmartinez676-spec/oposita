"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, NotebookPen, PenLine, Sparkles, Upload, X } from "lucide-react";
import { api, oposita } from "@/lib/client";
import type { NoteDraft, NoteItem } from "@/lib/apuntes";
import type { ArticleItem, LawListItem } from "@/lib/lawStyle";
import type { Scope } from "@/lib/quizTypes";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import NoteViewer from "@/components/NoteViewer";
import ConfirmDialog from "@/components/ConfirmDialog";
import UploadNotesDialog from "@/components/UploadNotesDialog";
import ScopePicker from "./ScopePicker";

type LawRow = Omit<LawListItem, "stats">;

interface LawNotesProps {
  law: LawRow;
  articles: ArticleItem[];
  preset: { scope: Scope; key: number } | null;
  onChanged: () => void;
}

export default function LawNotes({ law, articles, preset, onChanged }: LawNotesProps) {
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [scope, setScope] = useState<Scope>({ mode: "all" });
  const [detail, setDetail] = useState<"completo" | "esquema">("completo");
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<NoteItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setNotes(await api<NoteItem[]>(`/api/notes?lawId=${law.id}`));
    } catch {
      setNotes([]);
    }
  }, [law.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (preset) {
      setScope(preset.scope);
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [preset]);

  const flash = (ok: boolean, text: string) => {
    setNotice({ ok, text });
    window.setTimeout(() => setNotice(null), 5200);
  };

  const generate = async () => {
    setGenerating(true);
    setNotice(null);
    try {
      const created = await api<NoteItem[]>(`/api/laws/${law.id}/notes`, { method: "POST", json: { scope, detail } });
      setNotes((prev) => [...created, ...(prev ?? [])]);
      const words = created.reduce((s, n) => s + n.content.split(/\s+/).length, 0);
      flash(true, `¡${created.length} ${created.length === 1 ? "apunte creado" : "apuntes creados"}! ${words.toLocaleString("es-ES")} palabras de tinta.`);
      oposita({ say: "¡Apuntes listos! A subrayar se ha dicho ✏️", mood: "cheer" });
      onChanged();
    } catch (e) {
      flash(false, e instanceof Error ? e.message : "No se pudieron generar los apuntes");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (draft: NoteDraft, id: number | null) => {
    setSaving(true);
    try {
      const saved = await api<NoteItem>(id ? `/api/notes/${id}` : "/api/notes", { method: id ? "PATCH" : "POST", json: draft });
      setNotes((prev) => {
        const list = prev ?? [];
        if (saved.lawId !== law.id) return list.filter((n) => n.id !== saved.id);
        return id ? list.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...list];
      });
      setEditorOpen(false);
      setEditing(null);
      flash(true, id ? "Apunte guardado" : "¡Apunte pegado en la carpeta!");
      onChanged();
    } catch (e) {
      flash(false, e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

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
      onChanged();
    } catch (e) {
      flash(false, e instanceof Error ? e.message : "No se pudo borrar");
    }
  };

  const viewing = viewingId !== null ? (notes ?? []).find((n) => n.id === viewingId) ?? null : null;

  return (
    <div>
      <div ref={panelRef} className="relative max-w-3xl scroll-mt-28 rounded-lg bg-[#fffdf4] p-5 shadow-[0_14px_28px_-12px_rgba(80,55,15,0.5)] ring-1 ring-black/10">
        <div className="tape left-8 top-[-9px]" style={{ backgroundColor: "rgba(244,114,182,0.45)", transform: "rotate(-3deg)" }} />
        <h2 className="flex items-center gap-2 font-hand-caveat text-[34px] font-bold leading-none text-amber-950">
          <Sparkles className="h-6 w-6 text-amber-600" /> Apuntes completos con un clic
        </h2>
        <p className="mt-1.5 text-[14px] leading-snug text-stone-600">
          Oposita redacta un apunte por cada título o bloque con <strong>todo el texto ordenado</strong>: plazos y cifras con
          rotulador, órganos subrayados, avisos en rojo y una chuleta final de cifras y órganos.
        </p>

        <div className="mt-4">
          <p className="font-hand-caveat text-[20px] font-semibold leading-none text-amber-900">¿De qué parte de la ley?</p>
          <div className="mt-2">
            <ScopePicker articles={articles} value={scope} onChange={setScope} />
          </div>
          {scope.mode === "all" && articles.length > 1 && (
            <p className="mt-1.5 text-[12px] text-stone-500">Se creará un apunte por título (los más largos se dividen en varias hojas).</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { v: "completo" as const, l: "Apuntes completos", d: "Todo el texto, resaltado" },
            { v: "esquema" as const, l: "Esquema de ideas clave", d: "Solo lo esencial" },
          ].map((m) => (
            <button
              key={m.v}
              type="button"
              onClick={() => setDetail(m.v)}
              className={`rounded-xl px-4 py-2 text-left shadow-sm ring-1 transition-all hover:-rotate-1 ${detail === m.v ? "bg-white ring-2 ring-amber-600" : "bg-white/60 ring-black/10"}`}
            >
              <p className={`text-[14px] font-bold leading-tight ${detail === m.v ? "text-amber-900" : "text-stone-500"}`}>{m.l}</p>
              <p className="text-[11px] text-stone-500">{m.d}</p>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-3 text-[16px] font-bold text-white disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <NotebookPen className="h-5 w-5" />}
            {generating ? "Escribiendo a mano…" : "Generar apuntes"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
          >
            <PenLine className="h-4.5 w-4.5" /> Escribir un apunte propio
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[15px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
          >
            <Upload className="h-4.5 w-4.5" /> Subir mis apuntes (PDF)
          </button>
        </div>

        {notice && (
          <p className={`pop-in mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ring-1 ${notice.ok ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
            {notice.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {notice.text}
          </p>
        )}
      </div>

      <section className="mt-9">
        <h2 className="font-hand-caveat text-[34px] font-bold leading-none text-amber-950">
          Apuntes de esta carpeta {notes && notes.length > 0 && <span className="text-stone-400">({notes.length})</span>}
        </h2>
        {notes === null ? (
          <div className="mt-5 columns-1 gap-6 sm:columns-2 xl:columns-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="mb-6 h-56 animate-pulse break-inside-avoid rounded-lg bg-white/60" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-5 max-w-md rotate-1 rounded-lg bg-[#fef6c8] p-6 text-center shadow ring-1 ring-black/5">
            <p className="font-hand-caveat text-[30px] font-bold leading-none text-amber-950">Todavía no hay apuntes</p>
            <p className="mt-1 text-[14px] text-stone-600">Pulsa «Generar apuntes» y en unos segundos tendrás tu primera hoja escrita a mano.</p>
          </div>
        ) : (
          <div className="mt-6 columns-1 gap-6 sm:columns-2 xl:columns-3">
            {notes.map((n, i) => (
              <NoteCard
                key={n.id}
                note={n}
                index={i}
                onView={(x) => setViewingId(x.id)}
                onEdit={(x) => {
                  setEditing(x);
                  setEditorOpen(true);
                }}
                onDelete={(x) => setToDelete(x)}
                onToggleFav={toggleFav}
              />
            ))}
          </div>
        )}
      </section>

      {editorOpen && (
        <NoteEditor
          initial={editing}
          saving={saving}
          laws={[{ id: law.id, name: law.name, shortName: law.shortName, branch: law.branch }]}
          defaultLawId={law.id}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}

      {viewing && (
        <NoteViewer
          note={viewing}
          onClose={() => setViewingId(null)}
          onEdit={(n) => {
            setEditing(n);
            setEditorOpen(true);
          }}
          onDelete={(n) => setToDelete(n)}
          onToggleFav={toggleFav}
        />
      )}

      {uploadOpen && (
        <UploadNotesDialog
          lawId={law.id}
          lawName={law.shortName || law.name}
          onClose={() => setUploadOpen(false)}
          onImported={(created) => {
            setNotes((prev) => [...created, ...(prev ?? [])]);
            setUploadOpen(false);
            flash(true, `¡${created.length} ${created.length === 1 ? "hoja importada" : "hojas importadas"} de tu PDF!`);
            onChanged();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="¿Arrancamos esta hoja?"
          message={`«${toDelete.title}» desaparecerá del cuaderno para siempre.`}
          confirmLabel="Sí, arrancar"
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
