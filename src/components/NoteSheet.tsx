import { Scale } from "lucide-react";
import { formatDate, getCategory, getFont, getInk, getPaper, tagList } from "@/lib/apuntes";
import PaperContent, { FONT_SCALE } from "./PaperContent";
import { SquiggleLine } from "./Doodles";

export interface SheetData {
  title: string;
  lawName: string;
  article: string;
  category: string;
  content: string;
  paperColor: string;
  fontStyle: string;
  inkColor: string;
  tags?: string;
  createdAt?: string;
}

interface NoteSheetProps {
  note: SheetData;
  compact?: boolean;
}

/** La hoja de cuaderno completa: anillas, margen rojo, cinta y manuscrito. */
export default function NoteSheet({ note, compact = false }: NoteSheetProps) {
  const paper = getPaper(note.paperColor);
  const ink = getInk(note.inkColor);
  const font = getFont(note.fontStyle);
  const category = getCategory(note.category);
  const titleScale = FONT_SCALE[note.fontStyle] ?? 1;
  const tags = tagList(note.tags ?? "");

  return (
    <div
      className="paper-lines-lg paper-margin relative overflow-hidden rounded-[4px] rounded-tl-[10px] shadow-[0_18px_40px_-12px_rgba(80,55,15,0.45)] ring-1 ring-black/10"
      style={
        {
          "--paper-bg": paper.bg,
          "--paper-line": paper.line,
        } as React.CSSProperties
      }
    >
      {/* Cinta washi superior */}
      <div
        className="tape left-1/2 top-[-8px] z-10 -translate-x-1/2"
        style={{ backgroundColor: category.tape, transform: "translateX(-50%) rotate(-2deg)" }}
      />

      {/* Agujeros de anillas */}
      {!compact && (
        <div className="pointer-events-none absolute bottom-0 left-[13px] top-0 z-10 flex flex-col justify-evenly py-8">
          {[0, 1, 2, 3].map((h) => (
            <span
              key={h}
              className="block h-4 w-4 rounded-full bg-[#e3d5b3] shadow-[inset_0_2px_4px_rgba(70,45,5,0.5)] ring-1 ring-black/15"
            />
          ))}
        </div>
      )}

      <div className="relative py-7 pl-[64px] pr-6 sm:py-9 sm:pl-[68px] sm:pr-10">
        {/* Cabecera: ley + rama */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[13px] uppercase tracking-[0.14em] text-stone-500">
            <Scale className="h-4 w-4 text-amber-700" />
            <span>
              {note.lawName || "Sin ley asignada"}
              {note.article ? ` · ${note.article}` : ""}
            </span>
          </p>
          <span
            className="inline-flex -rotate-2 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: category.bg, color: category.text }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.dot }} />
            {note.category}
          </span>
        </div>

        {/* Título manuscrito */}
        <h2
          className={`${font.className} mt-2 font-bold leading-[1.05]`}
          style={{ color: ink.hex, fontSize: `${(compact ? 34 : 44) * titleScale}px` }}
        >
          {note.title || "Apunte sin título"}
        </h2>
        <SquiggleLine className="mt-1 h-3 w-44 text-rose-500/80" />

        {/* Cuerpo */}
        <div className="mt-4">
          <PaperContent
            content={note.content || "…"}
            fontStyle={note.fontStyle}
            inkHex={ink.hex}
            size="lg"
          />
        </div>

        {/* Pie de hoja */}
        <div className="mt-7 flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-stone-400/40 pt-3">
          <div className="text-xs text-stone-500">
            {note.createdAt ? <span>Escrito el {formatDate(note.createdAt)}</span> : <span>Borrador</span>}
            {tags.length > 0 && (
              <span className="ml-2 text-stone-400">{tags.map((t) => `#${t}`).join("  ")}</span>
            )}
          </div>
          <span className={`${font.className} text-lg leading-none text-stone-400`}>— fin del apunte —</span>
        </div>
      </div>
    </div>
  );
}
