"use client";

import { useState } from "react";
import {
  Check,
  Clock3,
  Copy,
  PenLine,
  Printer,
  Star,
  Trash2,
  Type,
  X,
} from "lucide-react";
import {
  formatDate,
  getInk,
  getPaper,
  readingMinutes,
  wordCount,
  type NoteItem,
} from "@/lib/apuntes";
import NoteSheet from "./NoteSheet";

interface NoteViewerProps {
  note: NoteItem;
  onClose: () => void;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
  onToggleFav: (note: NoteItem) => void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Abre una ventana con la hoja lista para imprimir. */
function printNote(note: NoteItem) {
  const paper = getPaper(note.paperColor);
  const ink = getInk(note.inkColor);
  const fontFamily =
    {
      caveat: "'Caveat', cursive",
      kalam: "'Kalam', cursive",
      patrick: "'Patrick Hand', cursive",
      shadows: "'Shadows Into Light Two', cursive",
    }[note.fontStyle] ?? "'Caveat', cursive";

  const body = note.content
    .split("\n")
    .map((raw) => {
      const t = raw.trim();
      if (!t) return `<div style="height:12px"></div>`;
      let html = escapeHtml(t)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/==([^=]+)==/g, `<span style="background:rgba(253,224,71,.55);padding:0 4px;border-radius:3px">$1</span>`);
      if (t.startsWith("!")) {
        return `<p style="color:#b91c1c;font-weight:700;margin:0 0 6px">★ ${html.replace(/^!\s*/, "")}</p>`;
      }
      if (t.startsWith("- ") || t.startsWith("• ")) {
        return `<p style="margin:0 0 6px;padding-left:20px">→ ${html.slice(2)}</p>`;
      }
      return `<p style="margin:0 0 6px">${html}</p>`;
    })
    .join("");

  const doc = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>${escapeHtml(note.title)} · Apuntes de Leyes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Kalam:wght@400;700&family=Patrick+Hand&family=Shadows+Into+Light+Two&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 28px; background: #e9e2d0; }
  .sheet { max-width: 720px; margin: 0 auto; padding: 40px 44px 40px 76px; border-radius: 6px;
    box-shadow: 0 10px 30px rgba(80,55,15,.35);
    background-color: ${paper.bg};
    background-image:
      linear-gradient(to right, transparent 56px, rgba(248,113,113,.55) 56px, rgba(248,113,113,.55) 57.5px, transparent 57.5px),
      repeating-linear-gradient(to bottom, transparent 0, transparent 33px, ${paper.line} 33px, ${paper.line} 34px);
    font-family: ${fontFamily}; color: ${ink.hex}; }
  .law { font-family: 'Patrick Hand', cursive; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: #78716c; }
  h1 { font-size: 42px; line-height: 1.05; margin: 6px 0 18px; }
  .content { font-size: 25px; line-height: 34px; }
  .foot { margin-top: 26px; font-family: 'Patrick Hand', cursive; font-size: 12px; color: #a8a29e; display:flex; justify-content: space-between; }
  @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; } }
</style></head>
<body>
  <div class="sheet">
    <div class="law">${escapeHtml(note.lawName)}${note.article ? ` · ${escapeHtml(note.article)}` : ""} — ${escapeHtml(note.category)}</div>
    <h1>${escapeHtml(note.title)}</h1>
    <div class="content">${body}</div>
    <div class="foot"><span>Apuntes de Leyes · ${formatDate(note.createdAt)}</span><span>— fin del apunte —</span></div>
  </div>
</body></html>`;

  const w = window.open("", "_blank", "width=860,height=1000");
  if (!w) return;
  w.document.write(doc);
  w.document.close();
  w.focus();
  window.setTimeout(() => w.print(), 400);
}

export default function NoteViewer({ note, onClose, onEdit, onDelete, onToggleFav }: NoteViewerProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(
        `${note.title}\n${note.lawName}${note.article ? ` · ${note.article}` : ""}\n\n${note.content}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const actionBtn =
    "flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-bold text-stone-700 shadow-md ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:text-amber-900";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fade-in fixed inset-0 bg-stone-900/60 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative mx-auto w-full max-w-3xl px-3 py-6 sm:py-10">
        {/* Barra de acciones */}
        <div className="pop-in mb-4 flex flex-wrap items-center justify-center gap-2">
          <button type="button" className={actionBtn} onClick={() => onToggleFav(note)}>
            <Star
              className={`h-4 w-4 ${note.isFavorite ? "fill-amber-400 text-amber-500" : "text-stone-400"}`}
            />
            {note.isFavorite ? "Favorito" : "Favorito"}
          </button>
          <button
            type="button"
            className={actionBtn}
            onClick={() => {
              onEdit(note);
            }}
          >
            <PenLine className="h-4 w-4" /> Editar
          </button>
          <button type="button" className={actionBtn} onClick={copyText}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "¡Copiado!" : "Copiar texto"}
          </button>
          <button type="button" className={actionBtn} onClick={() => printNote(note)}>
            <Printer className="h-4 w-4" /> Imprimir
          </button>
          {confirmDelete ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-sm font-bold text-white shadow-md ring-1 ring-rose-800 transition-all hover:-translate-y-0.5"
              onClick={() => onDelete(note)}
            >
              <Trash2 className="h-4 w-4" /> ¿Seguro? Borrar
            </button>
          ) : (
            <button
              type="button"
              className={`${actionBtn} hover:!text-rose-700`}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> Borrar
            </button>
          )}
          <button
            type="button"
            aria-label="Cerrar"
            className="rounded-full bg-stone-800 p-2.5 text-white shadow-md transition-transform hover:rotate-90"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* La hoja */}
        <div className="pop-in -rotate-[0.3deg]">
          <NoteSheet note={note} />
        </div>

        {/* Metadatos de estudio */}
        <div className="pop-in mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px] text-stone-200">
          <span className="flex items-center gap-1.5 rounded-full bg-stone-800/70 px-3 py-1.5 ring-1 ring-white/10">
            <Type className="h-3.5 w-3.5" /> {wordCount(note.content)} palabras
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-stone-800/70 px-3 py-1.5 ring-1 ring-white/10">
            <Clock3 className="h-3.5 w-3.5" /> {readingMinutes(note.content)} min de repaso
          </span>
          <span className="rounded-full bg-stone-800/70 px-3 py-1.5 ring-1 ring-white/10">
            Última tinta: {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
