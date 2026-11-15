"use client";

import { useState } from "react";
import { Check, Highlighter, Lightbulb, Loader2, Star, X } from "lucide-react";
import {
  CATEGORIES,
  FONT_STYLES,
  INK_COLORS,
  PAPER_COLORS,
  type NoteDraft,
  type NoteItem,
} from "@/lib/apuntes";
import NoteSheet from "./NoteSheet";

interface NoteEditorProps {
  initial: NoteItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: NoteDraft, id: number | null) => void;
  /** Carpetas de ley disponibles para vincular el apunte */
  laws?: { id: number; name: string; shortName: string; branch?: string }[];
  defaultLawId?: number | null;
}

const inputCls =
  "input-paper w-full px-3.5 py-2 text-[15px] text-stone-800 placeholder:text-stone-400";
const labelCls = "font-hand-caveat text-[19px] font-semibold leading-none text-amber-900";

export default function NoteEditor({ initial, saving, onClose, onSave, laws = [], defaultLawId = null }: NoteEditorProps) {
  const startLaw = initial ? initial.lawId : defaultLawId;
  const startLawObj = laws.find((l) => l.id === startLaw);
  const [draft, setDraft] = useState<NoteDraft>({
    lawId: startLaw ?? null,
    title: initial?.title ?? "",
    lawName: initial?.lawName ?? startLawObj?.name ?? "",
    article: initial?.article ?? "",
    category: initial?.category ?? startLawObj?.branch ?? "Constitucional",
    content: initial?.content ?? "",
    paperColor: initial?.paperColor ?? "crema",
    fontStyle: initial?.fontStyle ?? "caveat",
    inkColor: initial?.inkColor ?? "azul",
    isFavorite: initial?.isFavorite ?? false,
    tags: initial?.tags ?? "",
  });
  const [error, setError] = useState("");

  const set = <K extends keyof NoteDraft>(key: K, value: NoteDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setError("");
  };

  const handleSave = () => {
    if (!draft.title.trim()) {
      setError("Ponle un título a tu apunte, anda.");
      return;
    }
    if (!draft.content.trim()) {
      setError("El papel está en blanco: escribe al menos una línea.");
      return;
    }
    onSave({ ...draft, title: draft.title.trim(), content: draft.content.trim() }, initial?.id ?? null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center p-3 sm:p-5">
      <div className="fade-in absolute inset-0 bg-stone-900/55 backdrop-blur-[3px]" onClick={onClose} />

      <div className="pop-in relative flex w-full max-w-6xl flex-col overflow-hidden rounded-[18px] bg-[#faf3e0] shadow-2xl ring-1 ring-black/20">
        {/* Cabecera del editor */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-amber-900/20 px-5 py-3.5">
          <h2 className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">
            {initial ? "Retocar el apunte" : "Nuevo apunte a mano"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => set("isFavorite", !draft.isFavorite)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-2 ${
                draft.isFavorite
                  ? "bg-amber-300 text-amber-900"
                  : "bg-white/80 text-stone-500 hover:text-amber-700"
              }`}
            >
              <Star className={`h-4 w-4 ${draft.isFavorite ? "fill-amber-500 text-amber-600" : ""}`} />
              Favorito
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar editor"
              className="rounded-full bg-white/80 p-2 text-stone-600 shadow-sm ring-1 ring-black/10 transition-transform hover:rotate-90 hover:text-rose-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo: formulario + vista previa */}
        <div className="grid flex-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          {/* ------------------------- Formulario ------------------------- */}
          <div className="nice-scroll space-y-4 overflow-visible p-5 sm:p-6 lg:overflow-y-auto">
            <div>
              <label className={labelCls} htmlFor="f-title">
                Título del apunte
              </label>
              <input
                id="f-title"
                className={`${inputCls} font-hand-caveat mt-1 text-[19px] font-semibold`}
                placeholder="Ej.: Tutela judicial efectiva"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={90}
              />
            </div>

            {laws.length > 0 && (
              <div>
                <label className={labelCls} htmlFor="f-folder">
                  Carpeta de ley
                </label>
                <select
                  id="f-folder"
                  className={`${inputCls} mt-1 cursor-pointer`}
                  value={draft.lawId ?? ""}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const law = laws.find((l) => l.id === id);
                    setDraft((d) => ({
                      ...d,
                      lawId: id,
                      lawName: law && !d.lawName ? law.name : d.lawName,
                      category: law?.branch && !initial ? law.branch : d.category,
                    }));
                  }}
                >
                  <option value="">— Sin carpeta (solo en el cuaderno) —</option>
                  {laws.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.shortName ? `${l.shortName} · ` : ""}
                      {l.name.length > 70 ? `${l.name.slice(0, 70)}…` : l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="f-law">
                  Ley o norma
                </label>
                <input
                  id="f-law"
                  className={`${inputCls} mt-1`}
                  placeholder="Constitución Española"
                  value={draft.lawName}
                  onChange={(e) => set("lawName", e.target.value)}
                  maxLength={80}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="f-article">
                  Artículo
                </label>
                <input
                  id="f-article"
                  className={`${inputCls} mt-1`}
                  placeholder="Art. 24"
                  value={draft.article}
                  onChange={(e) => set("article", e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="f-category">
                  Rama del Derecho
                </label>
                <select
                  id="f-category"
                  className={`${inputCls} mt-1 cursor-pointer`}
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="f-tags">
                  Etiquetas
                </label>
                <input
                  id="f-tags"
                  className={`${inputCls} mt-1`}
                  placeholder="examen, test, repaso"
                  value={draft.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="f-content">
                Contenido del apunte
              </label>
              <textarea
                id="f-content"
                className={`${inputCls} nice-scroll mt-1 min-h-[190px] resize-y leading-relaxed`}
                placeholder={
                  "Escribe como en tu cuaderno…\n- Usa guiones para enumerar ideas\n==Subraya lo clave con rotulador==\n**Negrita** para conceptos\n! Empieza con ! lo que cae seguro en el examen"
                }
                value={draft.content}
                onChange={(e) => set("content", e.target.value)}
              />
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-100/80 px-3 py-2 text-[13px] leading-snug text-amber-900 ring-1 ring-amber-600/20">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  <strong>Trucos de formato:</strong> <code className="rounded bg-white/70 px-1">==texto==</code>{" "}
                  rotulador · <code className="rounded bg-white/70 px-1">**texto**</code> negrita subrayada ·{" "}
                  <code className="rounded bg-white/70 px-1">- texto</code> lista con flecha ·{" "}
                  <code className="rounded bg-white/70 px-1">! texto</code> aviso importante en rojo.
                </p>
              </div>
            </div>

            {/* Papel */}
            <div>
              <span className={labelCls}>Tipo de papel</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {PAPER_COLORS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("paperColor", p.id)}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm shadow-sm ring-1 transition-all hover:-rotate-2 ${
                      draft.paperColor === p.id
                        ? "bg-white font-bold text-amber-900 ring-2 ring-amber-600"
                        : "bg-white/70 text-stone-600 ring-black/10"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full ring-1 ring-black/15"
                      style={{ backgroundColor: p.swatch }}
                    />
                    {p.name}
                    {draft.paperColor === p.id && <Check className="h-3.5 w-3.5 text-amber-700" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Letra y tinta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className={labelCls}>Tu letra</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FONT_STYLES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => set("fontStyle", f.id)}
                      className={`${f.className} rounded-xl px-2 py-1.5 text-lg shadow-sm ring-1 transition-all hover:-rotate-1 ${
                        draft.fontStyle === f.id
                          ? "bg-white font-bold text-amber-900 ring-2 ring-amber-600"
                          : "bg-white/70 text-stone-600 ring-black/10"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={labelCls}>Color del boli</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INK_COLORS.map((ink) => (
                    <button
                      key={ink.id}
                      type="button"
                      title={ink.name}
                      aria-label={ink.name}
                      onClick={() => set("inkColor", ink.id)}
                      className={`h-9 w-9 rounded-full shadow-inner ring-2 ring-offset-2 ring-offset-[#faf3e0] transition-transform hover:scale-110 ${
                        draft.inkColor === ink.id ? "ring-amber-700" : "ring-black/10"
                      }`}
                      style={{ background: `radial-gradient(circle at 32% 30%, ${ink.hex}cc, ${ink.hex})` }}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-xs italic text-stone-500">
                  {INK_COLORS.find((i) => i.id === draft.inkColor)?.name}
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------ Vista previa ------------------------ */}
          <div className="nice-scroll relative overflow-visible p-5 sm:p-6 lg:overflow-y-auto">
            <p className="mb-3 flex items-center gap-1.5 text-sm italic text-stone-500">
              <Highlighter className="h-4 w-4 text-amber-600" />
              Así quedará en tu cuaderno:
            </p>
            <div className="-rotate-[0.4deg]">
              <NoteSheet
                note={{
                  title: draft.title,
                  lawName: draft.lawName,
                  article: draft.article,
                  category: draft.category,
                  content: draft.content,
                  paperColor: draft.paperColor,
                  fontStyle: draft.fontStyle,
                  inkColor: draft.inkColor,
                  tags: draft.tags,
                }}
              />
            </div>
          </div>
        </div>

        {/* Pie del editor */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-amber-900/20 px-5 py-3.5">
          <p className="text-sm text-rose-700">{error || " "}</p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/85 px-5 py-2.5 text-[15px] font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1 hover:text-stone-900"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary-hand flex items-center gap-2 rounded-full px-6 py-2.5 text-[15px] font-bold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Guardando…" : initial ? "Guardar cambios" : "Pegar en el cuaderno"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
