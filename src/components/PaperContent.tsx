import { Fragment } from "react";
import { getFont } from "@/lib/apuntes";
import { StarDoodle } from "./Doodles";

/** Cada letra manuscrita tiene un tamaño óptico distinto: compensamos. */
export const FONT_SCALE: Record<string, number> = {
  caveat: 1,
  kalam: 0.78,
  patrick: 0.74,
  shadows: 0.92,
};

/** Pinta el mini-lenguaje de los apuntes: **negrita** y ==rotulador==. */
function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyBase}-${i}`} className="squiggle font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
      return (
        <span key={`${keyBase}-${i}`} className="marker">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>;
  });
}

interface PaperContentProps {
  content: string;
  fontStyle: string;
  inkHex: string;
  size?: "sm" | "lg";
  maxLines?: number;
}

/**
 * Renderiza el texto del apunte como si estuviera escrito a mano:
 * líneas "- " con flecha, líneas "! " como aviso importante en rojo
 * y párrafos normales, todo alineado con las rayas del papel.
 */
export default function PaperContent({
  content,
  fontStyle,
  inkHex,
  size = "lg",
  maxLines,
}: PaperContentProps) {
  const font = getFont(fontStyle);
  const baseSize = size === "lg" ? 27 : 21;
  const lineHeight = size === "lg" ? 34 : 26;
  const scale = FONT_SCALE[fontStyle] ?? 1;

  let lines = content.split("\n");
  if (maxLines) lines = lines.slice(0, maxLines);

  return (
    <div
      className={font.className}
      style={{ color: inkHex, fontSize: `${baseSize * scale}px`, lineHeight: `${lineHeight}px` }}
    >
      {lines.map((raw, i) => {
        const t = raw.trim();
        if (!t) {
          return <div key={i} style={{ height: `${lineHeight * 0.55}px` }} aria-hidden="true" />;
        }
        if (t.startsWith("!")) {
          const txt = t.replace(/^!\s*/, "");
          return (
            <p key={i} className="flex items-start gap-[0.35em] font-bold" style={{ color: "#b91c1c" }}>
              <StarDoodle className="mt-[0.32em] h-[0.8em] w-[0.8em] shrink-0 -rotate-12" />
              <span>{renderInline(txt, `l${i}`)}</span>
            </p>
          );
        }
        if (t.startsWith("- ") || t.startsWith("• ")) {
          const txt = t.slice(2);
          return (
            <p key={i} className="flex items-start gap-[0.3em] pl-[0.15em]">
              <span className="shrink-0 font-bold text-amber-600">→</span>
              <span>{renderInline(txt, `l${i}`)}</span>
            </p>
          );
        }
        if (t.startsWith("# ")) {
          const txt = t.slice(2);
          return (
            <p key={i} className="pt-[0.2em] font-bold" style={{ fontSize: "1.18em" }}>
              <span className="squiggle-blue">{renderInline(txt, `l${i}`)}</span>
            </p>
          );
        }
        return <p key={i}>{renderInline(t, `l${i}`)}</p>;
      })}
    </div>
  );
}
