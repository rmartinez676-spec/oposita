/* ------------------------------------------------------------------ */
/*  Analizador de leyes: texto plano (PDF/TXT/BOE) → artículos         */
/* ------------------------------------------------------------------ */

export interface ParsedArticle {
  kind: "articulo" | "disposicion";
  number: string;
  block: string;
  chapter: string;
  rubric: string;
  body: string;
  position: number;
}

export interface ParsedLaw {
  suggestedName: string;
  articles: ParsedArticle[];
}

const ORDINALS = new Set([
  "primero", "primera", "primer", "segundo", "segunda", "tercero", "tercera", "tercer", "cuarto", "cuarta",
  "quinto", "quinta", "sexto", "sexta", "séptimo", "septimo", "séptima", "septima", "octavo", "octava",
  "noveno", "novena", "décimo", "decimo", "décima", "decima", "undécimo", "undécima", "duodécimo", "duodécima",
  "preliminar", "único", "unico", "única", "unica",
]);

const SUFFIXES = "bis|ter|qu[aá]ter|quinquies|sexies|septies|octies|nonies|decies|undecies|duodecies|terdecies";

function isHeadingNum(tokenRaw: string): boolean {
  const t = tokenRaw.replace(/[.ªº°:,;]+$/g, "").replace(/[–—-]+$/g, "");
  if (!t) return false;
  if (/^\d+$/.test(t)) return true;
  if (/^[IVXLCDM]+$/.test(t)) return true;
  return ORDINALS.has(t.toLowerCase());
}

interface HeadingMatch {
  level: 1 | 2 | 3;
  kind: string;
  num: string;
  rest: string;
}

function matchHeading(line: string): HeadingMatch | null {
  const m = line.match(/^(libro|t[ií]tulo|cap[ií]tulo|secci[oó]n|subsecci[oó]n)\s+(\S+)\s*(.*)$/iu);
  if (!m) return null;
  const tokRaw = m[2];
  if (!isHeadingNum(tokRaw)) return null;
  let rest = m[3].trim();
  const hadPunct = /[.:–—-]$/.test(tokRaw.replace(/[ªº°]+$/g, "")) || /^[.:–—-]/.test(rest);
  rest = rest.replace(/^[.:–—-]+\s*/, "");
  if (!hadPunct && rest && /^\p{Ll}/u.test(rest)) return null;
  const kindLower = m[1].toLowerCase();
  const level: 1 | 2 | 3 = /^(libro|t[ií]tulo)$/.test(kindLower) ? 1 : /^cap/.test(kindLower) ? 2 : 3;
  const num = tokRaw.replace(/[:,;]+$/g, "").replace(/\.$/, "").replace(/[–—-]+$/g, "");
  const kind = kindLower.charAt(0).toUpperCase() + kindLower.slice(1);
  return { level, kind, num, rest };
}

interface ArticleMatch {
  number: string;
  rest: string;
}

function matchArticle(line: string): ArticleMatch | null {
  const m = line.match(/^(?:art[ií]culo|art\.)\s+(\d+(?:\.\d+)?|[uú]nic[oa])(?![\p{L}\d])(.*)$/iu);
  if (!m) return null;
  let number = m[1];
  let rest = m[2];
  const suf = rest.match(new RegExp(`^\\s*(${SUFFIXES})(?![\\p{L}])(.*)$`, "iu"));
  if (suf) {
    number += ` ${suf[1].toLowerCase()}`;
    rest = suf[2];
  }
  const punct = rest.match(/^\s*([.\-–—:]+)/);
  rest = rest.replace(/^\s*[.\-–—:]*\s*/, "").trim();
  if (!punct && rest) {
    if (!/^[A-ZÁÉÍÓÚÑ]/.test(rest)) return null;
  }
  if (rest.startsWith(",")) return null;
  return { number, rest };
}

function matchDisposition(line: string): { label: string; rest: string } | null {
  const m = line.match(/^disposici[oó]n\s+(adicional|transitoria|derogatoria|final)(?![\p{L}\d])(.*)$/iu);
  if (!m) return null;
  const type = m[1].toLowerCase();
  let rest = m[2];
  let label = `Disposición ${type}`;
  const num = rest.match(/^\s+([\p{L}\d]+)(?:\s+(bis|ter))?(?![\p{L}\d])(.*)$/iu);
  if (num && isHeadingNum(num[1].replace(/\./g, ""))) {
    label += ` ${num[1].toLowerCase()}${num[2] ? ` ${num[2].toLowerCase()}` : ""}`;
    rest = num[3];
  }
  const punct = /^\s*[.\-–—:]/.test(rest);
  rest = rest.replace(/^\s*[.\-–—:]*\s*/, "").trim();
  if (!punct && rest && /^\p{Ll}/u.test(rest)) return null;
  return { label, rest };
}

function matchGroupClose(line: string): boolean {
  if (/^disposiciones\s+(adicionales|transitorias|derogatorias|finales)\s*$/i.test(line)) return true;
  if (/^(anexo|ap[eé]ndice)\b/i.test(line) && line.length < 70) return true;
  if (/^(pre[aá]mbulo|exposici[oó]n de motivos)\s*$/i.test(line)) return true;
  if (/^(por tanto,? mando|por tanto,?$|mando a todos|madrid, a \d|palacio de|dado en )/i.test(line)) return true;
  return false;
}

function isStructural(line: string): boolean {
  return !!(matchArticle(line) || matchDisposition(line) || matchHeading(line) || matchGroupClose(line));
}

const NOISE: RegExp[] = [
  /^p[áa]gina\s+\d+(\s+de\s+\d+)?$/i,
  /^p[áa]g\.\s*\d+/i,
  /^\d{1,4}$/,
  /^cve:/i,
  /^verificable en/i,
  /^bolet[ií]n oficial del estado$/i,
  /^legislaci[oó]n consolidada$/i,
  /^«?boe»?\s+n[úu]m\.?\s*\d+/i,
  /sec\.\s*[ivx]+\.\s*p[áa]g\./i,
  /^[-–—_=*.\s]{3,}$/,
  /^texto consolidado/i,
  /^[úu]ltima modificaci[oó]n/i,
];

function startsListMarker(l: string): boolean {
  return /^(\d{1,2}[.)]\s|[a-zñ]\)\s|[ivx]+\)\s|[-•·–]\s)/i.test(l);
}

function reflow(lines: string[]): string[] {
  const out: string[] = [];
  let prevJoinable = false;
  for (const l of lines) {
    if (!l) {
      prevJoinable = false;
      continue;
    }
    const structural = isStructural(l);
    if (!structural && !startsListMarker(l) && prevJoinable && out.length) {
      const last = out[out.length - 1];
      out[out.length - 1] = /-$/.test(last) && /^\p{Ll}/u.test(l) ? last.slice(0, -1) + l : `${last} ${l}`;
    } else {
      out.push(l);
    }
    prevJoinable = !structural && !/[.:;!?»”"')]$/.test(l);
  }
  return out;
}

function needsReflow(lines: string[]): boolean {
  // Señal clara de texto "partido" por el ancho de página: una línea sin punto final seguida de otra en minúscula
  let contin = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    if (
      a.length > 40 &&
      !/[.:;!?»”"')]$/.test(a) &&
      /^\p{Ll}/u.test(b) &&
      !startsListMarker(b) &&
      !isStructural(a) &&
      !isStructural(b)
    ) {
      contin++;
    }
  }
  if (contin >= 2 && contin / Math.max(1, lines.length) > 0.04) return true;

  const sample = lines.filter((l) => l.length > 45 && !isStructural(l));
  if (sample.length < 8) return false;
  const ended = sample.filter((l) => /[.:;!?»”"')]$/.test(l)).length;
  return ended / sample.length < 0.7;
}

export function cleanLawText(raw: string): string[] {
  const t = raw
    .replace(/\r\n?/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\u200b\u00ad\ufeff]/g, "")
    .replace(/\*\*/g, "")
    .replace(/==/g, "=");
  const lines = t
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .map((l) => (NOISE.some((r) => r.test(l)) ? "" : l));
  const nonEmpty = lines.filter(Boolean);
  return needsReflow(nonEmpty) ? reflow(lines) : nonEmpty;
}

function looksLikeRubric(s: string, strict: boolean): boolean {
  const words = s.trim().split(/\s+/).length;
  if (!s || /[,;:]/.test(s)) return false;
  if (/^(\d{1,2}[.)]|[a-zñ]\))\s/i.test(s)) return false;
  if (strict) return s.length <= 90 && words <= 12;
  return s.length <= 130 && words <= 16;
}

function suggestName(lines: string[]): string {
  const head = lines.slice(0, 40);
  const re = /^(ley\s+org[aá]nica|ley|real\s+decreto(?:-ley|\s+legislativo)?|decreto|constituci[oó]n|c[oó]digo|reglamento|orden|estatuto|texto\s+refundido)\b/i;
  for (const l of head) {
    if (re.test(l) && l.length <= 220 && !isStructural(l)) return l.replace(/\.$/, "");
  }
  const first = head.find((l) => l.length >= 5 && l.length <= 140 && !isStructural(l));
  return first ? first.replace(/\.$/, "") : "";
}

interface Draft {
  kind: "articulo" | "disposicion";
  number: string;
  block: string;
  chapter: string;
  rest: string;
  paras: string[];
}

export function parseLaw(raw: string): ParsedLaw {
  const lines = cleanLawText(raw);
  const articles: ParsedArticle[] = [];
  let block = "";
  let chapterBase = "";
  let chapter = "";
  let cur: Draft | null = null;

  const flush = () => {
    if (!cur) return;
    let rubric = "";
    let paras = cur.paras;
    const rest = cur.rest;
    if (rest) {
      if (looksLikeRubric(rest, false) && paras.length > 0) {
        rubric = rest.replace(/\.$/, "");
      } else {
        paras = [rest, ...paras];
      }
    } else if (paras.length >= 2 && looksLikeRubric(paras[0], true)) {
      rubric = paras[0].replace(/\.$/, "");
      paras = paras.slice(1);
    }
    const body = paras.join("\n").trim();
    if (body || rubric) {
      articles.push({
        kind: cur.kind,
        number: cur.number,
        block: cur.block,
        chapter: cur.chapter,
        rubric,
        body,
        position: articles.length,
      });
    }
    cur = null;
  };

  let firstArticleSeen = false;
  const preLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const art = matchArticle(line);
    if (art) {
      flush();
      firstArticleSeen = true;
      cur = { kind: "articulo", number: art.number, block, chapter, rest: art.rest, paras: [] };
      continue;
    }

    const disp = matchDisposition(line);
    if (disp) {
      flush();
      firstArticleSeen = true;
      cur = { kind: "disposicion", number: disp.label, block: "Disposiciones", chapter: "", rest: disp.rest, paras: [] };
      continue;
    }

    const head = matchHeading(line);
    if (head) {
      flush();
      let name = head.rest;
      if (!name) {
        const next = lines[i + 1];
        if (next && next.length <= 200 && !isStructural(next) && !/[:]$/.test(next) && !startsListMarker(next)) {
          name = next;
          i++;
        }
      }
      const numLabel =
        /^\d/.test(head.num) || /^[IVXLCDM]+$/.test(head.num)
          ? head.num
          : head.num.charAt(0).toUpperCase() + head.num.slice(1).toLowerCase();
      const sep = /[ªº°]$/.test(numLabel) ? " " : ". ";
      const label = `${head.kind} ${numLabel}${name ? `${sep}${name}` : ""}`;
      if (head.level === 1) {
        block = label;
        chapterBase = "";
        chapter = "";
      } else if (head.level === 2) {
        chapterBase = label;
        chapter = label;
      } else {
        chapter = chapterBase ? `${chapterBase} — ${label}` : label;
      }
      continue;
    }

    if (matchGroupClose(line)) {
      flush();
      continue;
    }

    if (cur) cur.paras.push(line);
    else if (!firstArticleSeen) preLines.push(line);
  }
  flush();

  return { suggestedName: suggestName(preLines.length ? preLines : lines), articles };
}

/** Etiqueta corta: "Art. 14" o "Disposición adicional primera". */
export function labelOfArticle(a: { kind: string; number: string }): string {
  return a.kind === "articulo" ? `Art. ${a.number}` : a.number;
}
