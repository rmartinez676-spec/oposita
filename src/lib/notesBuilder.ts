/* ------------------------------------------------------------------ */
/*  Generador de apuntes completos a partir de los artículos de la ley  */
/* ------------------------------------------------------------------ */

import { articleLabel, extractFacts, findTargets, snippet, stripMarker, type ArticleLite, type Fact } from "./generator";

export interface GeneratedNote {
  title: string;
  article: string;
  content: string;
  tags: string;
}

export type NoteDetail = "completo" | "esquema";

/** Marca cifras/plazos con rotulador (==…==) y órganos con negrita subrayada (**…**). */
function highlight(text: string, seenEntities?: Set<string>): string {
  const targets = findTargets(text).filter((t) => t.kind !== "termino");
  let out = "";
  let pos = 0;
  for (const t of targets) {
    out += text.slice(pos, t.start);
    if (t.kind === "entidad") {
      const key = t.text.toLowerCase();
      if (seenEntities && seenEntities.has(key)) out += t.text;
      else {
        seenEntities?.add(key);
        out += `**${t.text}**`;
      }
    } else {
      out += `==${t.text}==`;
    }
    pos = t.end;
  }
  return out + text.slice(pos);
}

function hasKeyFigure(f: Fact): boolean {
  return f.targets.some((t) => t.kind === "numero" || t.kind === "digito" || t.kind === "fraccion");
}

function rangeLabel(arts: ArticleLite[]): string {
  const only = arts.filter((a) => a.kind === "articulo");
  if (!only.length) return arts.length === 1 ? arts[0].number : `${arts.length} disposiciones`;
  const first = only[0].number;
  const last = only[only.length - 1].number;
  return first === last ? `Art. ${first}` : `Arts. ${first}–${last}`;
}

function noteFromChunk(
  shortName: string,
  blockLabel: string,
  arts: ArticleLite[],
  part: number,
  parts: number,
  detail: NoteDetail,
): GeneratedNote {
  const lines: string[] = [];
  const range = rangeLabel(arts);
  lines.push(`# ${blockLabel || "Texto de la ley"}`);
  lines.push(
    `${shortName} · ${range} · ${arts.length} ${arts.length === 1 ? "artículo" : "artículos"}${detail === "esquema" ? " · esquema de ideas clave" : " · texto completo ordenado"}`,
  );

  const chapters: { name: string; first: ArticleLite; last: ArticleLite }[] = [];
  for (const a of arts) {
    if (!a.chapter) continue;
    const c = chapters[chapters.length - 1];
    if (c && c.name === a.chapter) c.last = a;
    else chapters.push({ name: a.chapter, first: a, last: a });
  }
  if (chapters.length > 1) {
    lines.push("");
    lines.push("# Estructura");
    for (const c of chapters) {
      lines.push(`- **${c.name.length > 90 ? snippet(c.name, 90) : c.name}** → ${rangeLabel([c.first, c.last])}`);
    }
  }
  lines.push("");

  const keyFacts: Fact[] = [];
  const entityCount = new Map<string, Set<string>>();

  for (const a of arts) {
    const label = articleLabel(a);
    const seenEntities = new Set<string>();
    lines.push(`# ${label}${a.rubric ? ` · ${a.rubric}` : ""}`);
    const facts = extractFacts(a);

    for (const f of facts) {
      if (hasKeyFigure(f)) keyFacts.push(f);
      for (const t of f.targets) {
        if (t.kind !== "entidad") continue;
        const set = entityCount.get(t.text) ?? new Set<string>();
        set.add(a.kind === "articulo" ? a.number : label);
        entityCount.set(t.text, set);
      }
    }

    if (detail === "completo") {
      for (const para of a.body.split("\n")) {
        const raw = para.trim();
        if (!raw) continue;
        const m = raw.match(/^(\d{1,2}[.)]|[a-zñ]\))\s+([\s\S]*)$/i);
        if (m) {
          lines.push(`- ${m[1]} ${highlight(m[2], seenEntities)}`);
        } else if (/^[-•·–]\s/.test(raw)) {
          lines.push(`- ${highlight(raw.replace(/^[-•·–]\s+/, ""), seenEntities)}`);
        } else {
          lines.push(highlight(raw, seenEntities));
        }
      }
    } else {
      // Esquema: UNA sola idea clave por artículo, recortada. Nada de copiar la ley.
      const key =
        facts.find((f) => f.targets.some((t) => t.kind === "numero" || t.kind === "digito" || t.kind === "fraccion")) ??
        facts.find((f) => f.targets.some((t) => t.kind === "entidad")) ??
        facts[0];
      if (key) {
        lines.push(`- ${highlight(snippet(key.text, 150), seenEntities)}`);
      } else {
        const first = stripMarker((a.body.split("\n")[0] ?? "").trim()).text;
        if (first) lines.push(`- ${highlight(snippet(first, 150), seenEntities)}`);
      }
    }

    if (detail === "completo") {
      const figs = facts.filter(hasKeyFigure).slice(0, 2);
      for (const f of figs) {
        lines.push(`! Ojo al dato (${f.label}): ${highlight(snippet(f.text, 170))}`);
      }
    }
    lines.push("");
  }

  if (detail === "completo") {
    const figures = keyFacts.slice(0, 30);
    if (figures.length) {
      lines.push("# Cifras y plazos clave");
      for (const f of figures) lines.push(`- ${f.label} → ${highlight(snippet(f.text, 150))}`);
      lines.push("");
    }

    const ents = [...entityCount.entries()]
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 14);
    if (ents.length) {
      lines.push("# Órganos y figuras que aparecen");
      for (const [name, set] of ents) {
        const nums = [...set].slice(0, 7).join(", ");
        lines.push(`- **${name}** → ${nums}${set.size > 7 ? "…" : ""}`);
      }
      lines.push("");
    }
  }

  lines.push("! Repasa en voz alta y haz el test de este bloque antes de pasar al siguiente.");

  const baseTitle = blockLabel ? `${shortName} · ${blockLabel}` : `${shortName} · ${range}`;
  const title = snippet(baseTitle, 105) + (parts > 1 ? ` (${part}/${parts})` : "");
  return {
    title,
    article: range,
    content: lines.join("\n").trim(),
    tags: `autogenerado, ${shortName}`,
  };
}

export function buildNotes(
  law: { name: string; shortName: string },
  articles: ArticleLite[],
  opts: { detail: NoteDetail; maxPerNote?: number },
): GeneratedNote[] {
  const shortName = law.shortName || law.name;
  const max = opts.maxPerNote ?? 22;
  const groups: { block: string; arts: ArticleLite[] }[] = [];
  for (const a of articles) {
    const g = groups[groups.length - 1];
    if (g && g.block === a.block) g.arts.push(a);
    else groups.push({ block: a.block, arts: [a] });
  }
  const notes: GeneratedNote[] = [];
  for (const g of groups) {
    const parts = Math.max(1, Math.ceil(g.arts.length / max));
    const size = Math.ceil(g.arts.length / parts);
    for (let p = 0; p < parts; p++) {
      const chunk = g.arts.slice(p * size, (p + 1) * size);
      if (chunk.length) notes.push(noteFromChunk(shortName, g.block, chunk, p + 1, parts, opts.detail));
    }
  }
  return notes;
}
