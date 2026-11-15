import { CalendarDays, Eye, PenLine, Star, Trash2 } from "lucide-react";
import {
  formatDate,
  getCategory,
  getFont,
  getInk,
  getPaper,
  rotationFor,
  tagList,
  type NoteItem,
} from "@/lib/apuntes";
import PaperContent, { FONT_SCALE } from "./PaperContent";

interface NoteCardProps {
  note: NoteItem;
  index: number;
  onView: (note: NoteItem) => void;
  onEdit: (note: NoteItem) => void;
  onDelete: (note: NoteItem) => void;
  onToggleFav: (note: NoteItem) => void;
}

/** Tarjeta-post-it de un apunte sobre el escritorio. */
export default function NoteCard({ note, index, onView, onEdit, onDelete, onToggleFav }: NoteCardProps) {
  const paper = getPaper(note.paperColor);
  const ink = getInk(note.inkColor);
  const category = getCategory(note.category);
  const rot = rotationFor(note.id);
  const tags = tagList(note.tags).slice(0, 3);
  const titleScale = FONT_SCALE[note.fontStyle] ?? 1;

  return (
    <article
      className="note-in group relative mb-6 break-inside-avoid cursor-pointer transition-transform duration-300 hover:z-10 hover:scale-[1.02] hover:!rotate-0"
      style={
        {
          "--rot": `${rot}deg`,
          transform: `rotate(${rot}deg)`,
          animationDelay: `${Math.min(index, 10) * 60}ms`,
        } as React.CSSProperties
      }
      onClick={() => onView(note)}
    >
      <div
        className="paper-lines-sm relative overflow-hidden rounded-[4px] rounded-tl-[10px] shadow-[0_10px_24px_-8px_rgba(80,55,15,0.4)] ring-1 ring-black/10 transition-shadow duration-300 group-hover:shadow-[0_22px_38px_-10px_rgba(80,55,15,0.5)]"
        style={
          {
            "--paper-bg": paper.bg,
            "--paper-line": paper.line,
          } as React.CSSProperties
        }
      >
        {/* Cinta washi */}
        <div
          className="tape left-1/2 top-[-9px] z-10"
          style={{ backgroundColor: category.tape, transform: "translateX(-50%) rotate(-3deg)" }}
        />

        <div className="relative px-5 pb-4 pt-8">
          {/* Rama + favorito */}
          <div className="flex items-start justify-between gap-2">
            <span
              className="inline-flex -rotate-2 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ring-1 ring-black/5"
              style={{ backgroundColor: category.bg, color: category.text }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.dot }} />
              {note.category}
            </span>
            <button
              type="button"
              aria-label={note.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav(note);
              }}
              className="rounded-full p-1 text-amber-500 transition-transform hover:scale-125 active:scale-95"
            >
              <Star
                className={`h-5 w-5 ${note.isFavorite ? "fill-amber-400 text-amber-500" : "text-stone-400"}`}
              />
            </button>
          </div>

          {/* Título con la letra del propio apunte */}
          <h3
            className={`${getFont(note.fontStyle).className} mt-1.5 font-bold leading-[1.08]`}
            style={{
              color: ink.hex,
              fontSize: `${29 * titleScale}px`,
            }}
          >
            {note.title}
          </h3>
          <p className="mt-0.5 text-[12px] uppercase tracking-[0.12em] text-stone-500">
            {note.lawName}
            {note.article ? ` · ${note.article}` : ""}
          </p>

          {/* Vista previa del contenido con desvanecido */}
          <div className="relative mt-2">
            <PaperContent
              content={note.content}
              fontStyle={note.fontStyle}
              inkHex={ink.hex}
              size="sm"
              maxLines={6}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
              style={{ background: `linear-gradient(to bottom, transparent, ${paper.bg})` }}
            />
          </div>

          {/* Pie: fecha, etiquetas y acciones */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-stone-400/40 pt-2.5">
            <span className="flex items-center gap-1 text-[11px] text-stone-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(note.createdAt)}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Leer apunte"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(note);
                }}
                className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-white/70 hover:text-amber-800"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Editar apunte"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-white/70 hover:text-amber-800"
              >
                <PenLine className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Borrar apunte"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note);
                }}
                className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-rose-100 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <p className="mt-1.5 truncate text-[11px] italic text-stone-400">
              {tags.map((t) => `#${t}`).join("  ")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
