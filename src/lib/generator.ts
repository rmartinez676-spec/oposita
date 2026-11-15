/* ------------------------------------------------------------------ */
/*  Motor de generación: tests y juegos a partir del texto de la ley   */
/* ------------------------------------------------------------------ */

import type { Question, QuestionType } from "./quizTypes";

export interface ArticleLite {
  id: number;
  kind: string;
  number: string;
  block: string;
  chapter: string;
  rubric: string;
  body: string;
  position: number;
}

export function articleLabel(a: Pick<ArticleLite, "kind" | "number">, apartado?: string): string {
  if (a.kind !== "articulo") return a.number;
  return apartado ? `Art. ${a.number}.${apartado}` : `Art. ${a.number}`;
}

type TargetKind = "fraccion" | "numero" | "digito" | "entidad" | "termino";

export interface Target {
  start: number;
  end: number;
  text: string;
  kind: TargetKind;
}

export interface Fact {
  articleId: number;
  label: string;
  text: string;
  targets: Target[];
}

export interface Index {
  facts: Map<number, Fact[]>;
  vocab: string[];
  entities: string[];
}

/* ------------------------------ Aleatorio ------------------------------ */

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/* ------------------------------ Numerales ------------------------------ */

const NUMVAL: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiún: 21, veintiuno: 21, veintiuna: 21, veintidós: 22,
  veintidos: 22, veintitrés: 23, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiséis: 26,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200,
  trescientos: 300, cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700,
  ochocientos: 800, novecientos: 900, mil: 1000,
};

const TENS = ["treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const UNITS = ["un", "uno", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const HUNDREDS = ["ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
const SINGLES = [
  "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce",
  "quince", "dieciséis", "dieciseis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintidós", "veintidos",
  "veintitrés", "veintitres", "veinticuatro", "veinticinco", "veintiséis", "veintiseis", "veintisiete",
  "veintiocho", "veintinueve", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa",
  "cien", "mil",
];

const NUM_SRC =
  `(?:(?:${HUNDREDS.join("|")})(?:\\s+(?:${TENS.join("|")})(?:\\s+y\\s+(?:${UNITS.join("|")}))?|\\s+(?:${SINGLES.slice(0, 29).join("|")}))?` +
  `|(?:${TENS.join("|")})\\s+y\\s+(?:${UNITS.join("|")})` +
  `|${SINGLES.join("|")})`;

const NUM_RE = new RegExp(`(?<![\\p{L}])${NUM_SRC}(?![\\p{L}])`, "giu");
const FRAC_RE =
  /(?<![\p{L}])(?:mayor[ií]a\s+(?:absoluta|simple|cualificada|reforzada)|dos\s+tercios|tres\s+quintos|tres\s+cuartos|un\s+tercio|una\s+(?:quinta|cuarta)\s+parte|la\s+mitad|unanimidad)(?![\p{L}])/giu;
const DIGIT_RE =
  /(?<![\p{L}\d.,/])\d+(?=\s*(?:%|por\s+ciento|euros|€|d[ií]as|meses|años|horas|semanas|miembros|diputados|senadores|votos|ciudadanos|firmas|kil[oó]metros|metros))/giu;

function numeralValue(p: string): number {
  const words = p.toLowerCase().split(/\s+/).filter((w) => w !== "y");
  let total = 0;
  for (const w of words) {
    const v = NUMVAL[w];
    if (v === undefined) return 0;
    total += v;
  }
  return total;
}

const NUM_POOL: [string, number][] = [
  ["dos", 2], ["tres", 3], ["cuatro", 4], ["cinco", 5], ["seis", 6], ["siete", 7], ["ocho", 8], ["nueve", 9],
  ["diez", 10], ["once", 11], ["doce", 12], ["trece", 13], ["catorce", 14], ["quince", 15], ["dieciséis", 16],
  ["diecisiete", 17], ["dieciocho", 18], ["diecinueve", 19], ["veinte", 20], ["veinticinco", 25], ["treinta", 30],
  ["cuarenta", 40], ["cincuenta", 50], ["sesenta", 60], ["setenta", 70], ["ochenta", 80], ["noventa", 90],
  ["cien", 100], ["doscientos", 200], ["trescientos", 300], ["quinientos", 500], ["mil", 1000],
];

const FRACTIONS = [
  "mayoría absoluta", "mayoría simple", "mayoría cualificada", "dos tercios", "tres quintos", "tres cuartos",
  "un tercio", "una quinta parte", "la mitad", "unanimidad",
];

const DEFAULT_ENTITIES = [
  "Congreso de los Diputados", "Senado", "Consejo de Ministros", "Tribunal Supremo", "Tribunal Constitucional",
  "Defensor del Pueblo", "Consejo General del Poder Judicial", "Ministerio Fiscal", "Gobierno", "Rey",
  "Cortes Generales", "Presidente del Gobierno", "Tribunal de Cuentas", "Consejo de Estado",
];

const DET_LEAD = /^(?:(?:El|La|Los|Las|Un|Una|Unos|Unas|Del|Al|Lo)\s+)+/;
const START_STOP = new Set([
  "En", "Con", "Por", "Para", "Sin", "Si", "Cuando", "Se", "Todos", "Todas", "Todo", "Toda", "Cada", "Este", "Esta",
  "Estos", "Estas", "Dicho", "Dicha", "Asimismo", "Igualmente", "No", "Será", "Serán", "Podrá", "Podrán",
  "Corresponde", "Corresponderá", "Quienes", "Quien", "Tales", "Sus", "Su", "Así", "Como", "Durante", "Contra",
  "Ante", "Tras", "Hasta", "Desde", "Sobre", "Entre", "Según", "Mediante", "Salvo", "Respecto", "Dentro", "Fuera",
  "Ningún", "Ninguna", "Cualquier", "Las", "Los", "Quedan", "Queda", "Serán", "Deberá", "Deberán", "Tendrá",
  "Tendrán", "Estará", "Estarán", "Podrán", "Existirá", "Habrá", "Cuando", "Aquellos", "Aquellas", "Además",
  "También", "Una", "Uno", "Unos", "Unas", "Ello", "Ese", "Esa", "Sólo", "Solo", "Pero", "Sino", "Aunque",
  "Mientras", "Donde", "Cuyo", "Cuya", "Dichos", "Dichas", "Resto", "Ambas", "Ambos", "Otros", "Otras",
]);
const KNOWN_SINGLE = new Set([
  "Rey", "Gobierno", "Senado", "Congreso", "Estado", "Constitución", "Corona", "Parlamento", "Defensor",
  "Tribunal", "Consejo", "Cortes", "Ministerio", "Presidente", "Cámara", "Comisión", "Audiencia", "Diputación",
  "Administración", "Generalitat", "Ayuntamiento", "Delegación",
]);
const ENTITY_BAN = /^(Art[ií]culo|T[ií]tulo|Cap[ií]tulo|Secci[oó]n|Disposici[oó]n|Libro|Apartado|Anexo|Real|Decreto|Orden)\b/;

const STOP = new Set([
  "artículo", "artículos", "apartado", "apartados", "presente", "siguiente", "siguientes", "anterior", "anteriores",
  "correspondiente", "correspondientes", "establecido", "establecida", "establecidos", "establecidas", "conforme",
  "términos", "disposiciones", "disposición", "cualquier", "cualesquiera", "respectivamente", "asimismo",
  "mediante", "durante", "aquellos", "aquellas", "mientras", "aunque", "también", "particular", "general",
  "generales", "legalmente", "previsto", "prevista", "previstos", "previstas", "dispuesto", "dispuesta",
  "efectos", "ejercicio", "corresponderá", "corresponderán", "establecen", "establece", "determinen",
  "determine", "determinará", "determinarán", "podrán", "deberán", "tendrán", "respecto", "cuantos", "cuantas",
  "regulará", "regulará", "mismo", "misma", "mismos", "mismas", "carácter", "fueren", "hubiere", "hubiera",
  "supuesto", "supuestos", "referencia", "referido", "referida", "referidos", "referidas", "contenido",
  "ejercerá", "ejercerán", "adoptará", "adoptarán", "normativa", "legislación", "aplicación", "aplicable",
  "aplicables", "procederá", "procederán", "previamente", "posteriormente", "inmediatamente",
]);

/* ------------------------------ Frases ------------------------------ */

const ABBR_RE = /(?<![\p{L}])(art|arts|núm|núms|apdo|apdos|párr|pág|págs|pp|etc|cfr|vid|ss|nº)\.(?=\s)/giu;

export function splitSentences(par: string): string[] {
  const prot = par
    .replace(ABBR_RE, "$1§")
    .replace(/\.(?=[ºª°])/g, "§")
    .replace(/(\d)\.(\d)/g, "$1§$2");
  return prot
    .split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«"“(\d])|(?<=;)\s+/)
    .map((s) => s.replace(/§/g, ".").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function stripMarker(p: string): { num: string; text: string } {
  const n = p.match(/^(\d{1,2})[.)]\s+([\s\S]*)$/);
  if (n) return { num: n[1], text: n[2] };
  const l = p.match(/^[a-zñ]\)\s+([\s\S]*)$/i);
  if (l) return { num: "", text: l[1] };
  return { num: "", text: p.replace(/^[-•·–]\s+/, "") };
}

function validSentence(s: string): boolean {
  if (s.length < 45 || s.length > 320) return false;
  if (s.split(/\s+/).length < 7) return false;
  if (/[:]$/.test(s)) return false;
  if (/^\(?(derogad|suprimid|sin contenido|anulad)/i.test(s)) return false;
  const letters = s.replace(/[^\p{L}]/gu, "");
  const upper = letters.replace(/[^\p{Lu}]/gu, "");
  return letters.length > 0 && upper.length / letters.length < 0.5;
}

/* ------------------------------ Objetivos ------------------------------ */

export function findTargets(s: string): Target[] {
  const found: Target[] = [];
  const overlaps = (st: number, en: number) => found.some((t) => st < t.end && en > t.start);
  const add = (st: number, en: number, kind: TargetKind) => {
    if (en - st < 2 || overlaps(st, en)) return;
    found.push({ start: st, end: en, text: s.slice(st, en), kind });
  };

  for (const m of s.matchAll(FRAC_RE)) add(m.index!, m.index! + m[0].length, "fraccion");

  for (const m of s.matchAll(NUM_RE)) {
    const st = m.index!;
    const en = st + m[0].length;
    const v = numeralValue(m[0]);
    if (v < 2 || v === 21) continue;
    if (/^\s+mil(?![\p{L}])/iu.test(s.slice(en))) continue;
    add(st, en, "numero");
  }

  for (const m of s.matchAll(DIGIT_RE)) add(m.index!, m.index! + m[0].length, "digito");

  const ENTITY_RE =
    /(?<![\p{L}])[A-ZÁÉÍÓÚÑ][\p{Ll}]+(?:\s+(?:(?:de\s+la|de\s+los|de\s+las|del|de|y|para|en)\s+)?[A-ZÁÉÍÓÚÑ][\p{Ll}]+)*(?![\p{L}])/gu;
  for (const m of s.matchAll(ENTITY_RE)) {
    let st = m.index!;
    let txt = m[0];
    const atStart = s.slice(0, st).replace(/[(«"“¿¡\s]/g, "") === "";
    const lead = txt.match(DET_LEAD);
    if (lead) {
      st += lead[0].length;
      txt = txt.slice(lead[0].length);
    }
    if (!txt || txt.length < 3) continue;
    const words = txt.split(/\s+/);
    if (ENTITY_BAN.test(txt)) continue;
    if (atStart && !lead) {
      if (words.length < 2 && !KNOWN_SINGLE.has(txt)) continue;
      if (START_STOP.has(words[0])) continue;
    }
    if (words.length === 1 && START_STOP.has(txt)) continue;
    add(st, st + txt.length, "entidad");
  }

  for (const m of s.matchAll(/\p{L}{8,}/gu)) {
    const w = m[0];
    if (m.index === 0 || /^\p{Lu}/u.test(w)) continue;
    const prev = s[m.index! - 1];
    if (prev && /\p{L}/u.test(prev)) continue;
    if (STOP.has(w.toLowerCase())) continue;
    add(m.index!, m.index! + w.length, "termino");
  }

  return found.sort((a, b) => a.start - b.start);
}

/* ------------------------------ Hechos e índice ------------------------------ */

export function extractFacts(a: ArticleLite): Fact[] {
  const facts: Fact[] = [];
  let apartado = "";
  for (const para of a.body.split("\n")) {
    const { num, text } = stripMarker(para.trim());
    if (num) apartado = num;
    const label = articleLabel(a, apartado || undefined);
    for (const s of splitSentences(text)) {
      if (!validSentence(s)) continue;
      facts.push({ articleId: a.id, label, text: s, targets: findTargets(s) });
    }
  }
  return facts;
}

export function buildIndex(all: ArticleLite[]): Index {
  const facts = new Map<number, Fact[]>();
  const vocab = new Set<string>();
  const ents = new Set<string>();
  for (const a of all) {
    const fs = extractFacts(a);
    facts.set(a.id, fs);
    for (const f of fs) for (const t of f.targets) if (t.kind === "entidad") ents.add(t.text);
    for (const m of a.body.matchAll(/(?<![\p{L}])\p{Ll}{7,}(?![\p{L}])/gu)) {
      if (!STOP.has(m[0])) vocab.add(m[0]);
    }
  }
  return { facts, vocab: [...vocab], entities: [...ents] };
}

/* ------------------------------ Distractores ------------------------------ */

function matchCase(opt: string, orig: string): string {
  return /^\p{Lu}/u.test(orig) ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt;
}

const MASC = new Set(["el", "del", "al", "un", "los", "unos"]);
const FEM = new Set(["la", "las", "una", "unas"]);
const PLURAL = new Set(["los", "las", "unos", "unas"]);

function prevWordOf(text: string, start: number): string {
  const m = text.slice(0, start).match(/(\p{L}+)\s*$/u);
  return m ? m[1].toLowerCase() : "";
}

/** ¿Concuerda en género y número el candidato con el determinante que lo precede? */
function agrees(prev: string, cand: string): boolean {
  const masc = MASC.has(prev);
  const fem = FEM.has(prev);
  if (!masc && !fem) return true;
  const hw = cand.split(/\s+/)[0].toLowerCase();
  const candPlural = /s$/.test(hw) && !/(is|us)$/.test(hw);
  if (PLURAL.has(prev) !== candPlural) return false;
  const candFem = /(a|as|ión|iones|dad|dades|ncia|ncias)$/.test(hw);
  return fem ? candFem : !candFem;
}

function isFragment(text: string): boolean {
  const first = text.split(/\s+/)[0].toLowerCase();
  return first.length > 4 && /(ar|er|ir)$/.test(first);
}

function distractorsFor(t: Target, f: Fact, idx: Index, mode: "cloze" | "vf"): string[] | null {
  const sentL = f.text.toLowerCase();
  const tl = t.text.toLowerCase();

  if (t.kind === "fraccion") {
    const c = FRACTIONS.filter((x) => !tl.includes(x) && !x.includes(tl) && !sentL.includes(x));
    return c.length >= 3 ? sample(c, 3).map((x) => matchCase(x, t.text)) : null;
  }

  if (t.kind === "numero") {
    const v = numeralValue(t.text);
    if (!v) return null;
    const c = NUM_POOL.filter(([w, val]) => val !== v && !sentL.includes(` ${w} `))
      .map(([w, val]) => ({ w, d: Math.abs(Math.log(val / v)) + Math.random() * 0.4 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 7)
      .map((x) => x.w);
    return c.length >= 3 ? sample(c, 3).map((x) => matchCase(x, t.text)) : null;
  }

  if (t.kind === "digito") {
    const v = parseInt(t.text, 10);
    if (!Number.isFinite(v) || v <= 0) return null;
    const cands = [v + 1, v - 1, v * 2, v + 5, v + 10, v * 3, Math.round(v / 2), v + 2, v - 2, v + 15, v * 10]
      .filter((x, i, arr) => x > 0 && x !== v && arr.indexOf(x) === i)
      .map((x) => ({ x, d: Math.abs(Math.log(x / v)) + Math.random() * 0.5 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6)
      .map((o) => String(o.x));
    return cands.length >= 3 ? sample(cands, 3) : null;
  }

  if (t.kind === "entidad") {
    const twc = t.text.split(/\s+/).length;
    const rank = (list: string[]) =>
      list
        .filter((e) => {
          const el = e.toLowerCase();
          return el !== tl && !sentL.includes(el) && !tl.includes(el) && !el.includes(tl);
        })
        .map((e) => ({ e, d: Math.abs(e.split(/\s+/).length - twc) + Math.random() * 1.6 }))
        .sort((a, b) => a.d - b.d)
        .map((o) => o.e);
    const prev = prevWordOf(f.text, t.start);
    const pool = [...rank(idx.entities), ...rank(DEFAULT_ENTITIES)].filter((e, i, arr) => arr.indexOf(e) === i);
    const agreeing = pool.filter((e) => agrees(prev, e));
    if (mode === "vf") return agreeing.length ? sample(agreeing.slice(0, 8), 3) : null;
    const c = agreeing.length >= 3 ? agreeing : pool;
    return c.length >= 3 ? sample(c.slice(0, 8), 3) : null;
  }

  // término jurídico
  const len = t.text.length;
  const c1 = t.text.slice(-1);
  const c2 = t.text.slice(-2);
  const c3 = t.text.slice(-3);
  const ranked = idx.vocab
    .filter((w) => w !== tl && !sentL.includes(w) && Math.abs(w.length - len) <= 3)
    .map((w) => {
      const suf = w.endsWith(c3) ? 3 : w.endsWith(c2) ? 2 : w.endsWith(c1) ? 1 : 0;
      return { w, d: -suf * 2 + Math.abs(w.length - len) * 0.5 + Math.random() * 2.2 };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 12)
    .map((o) => o.w);
  return ranked.length >= 3 ? sample(ranked.slice(0, 9), 3).map((x) => matchCase(x, t.text)) : null;
}

const WEIGHT_CLOZE: Record<TargetKind, number> = { fraccion: 3, numero: 3, digito: 3, entidad: 2, termino: 1.3 };
const WEIGHT_FALSE: Record<TargetKind, number> = { fraccion: 3, numero: 3, digito: 3, entidad: 1.6, termino: 0.4 };

function chooseTarget(
  f: Fact,
  idx: Index,
  weights: Record<TargetKind, number>,
  mode: "cloze" | "vf",
): { t: Target; d: string[] } | null {
  const ranked = f.targets
    .map((t) => ({ t, r: Math.random() * weights[t.kind] }))
    .sort((a, b) => b.r - a.r);
  for (const { t } of ranked) {
    const d = distractorsFor(t, f, idx, mode);
    if (d) return { t, d };
  }
  return null;
}

/* ------------------------------ Preguntas ------------------------------ */

function withOptions(correct: string, wrong: string[]): { options: string[]; correctIndex: number } | null {
  const seen = new Set<string>();
  const all = [correct, ...wrong].filter((o) => {
    const k = o.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (all.length < 4) return null;
  const options = shuffle(all.slice(0, 4));
  return { options, correctIndex: options.indexOf(correct) };
}

function quote(f: Fact): string {
  return `${f.label}: «${f.text}»`;
}

function makeCloze(f: Fact, idx: Index): Omit<Question, "id"> | null {
  const pick = chooseTarget(f, idx, WEIGHT_CLOZE, "cloze");
  if (!pick) return null;
  const o = withOptions(pick.t.text, pick.d);
  if (!o) return null;
  return {
    type: "cloze",
    prompt: "Completa el texto de la norma:",
    statement: `${f.text.slice(0, pick.t.start)}_____${f.text.slice(pick.t.end)}`,
    options: o.options,
    correctIndex: o.correctIndex,
    explanation: quote(f),
    articleId: f.articleId,
    articleLabel: f.label,
  };
}

function makeVF(f: Fact, idx: Index): Omit<Question, "id"> | null {
  if (isFragment(f.text)) return null;
  const wantFalse = Math.random() < 0.5;
  if (wantFalse) {
    const pick = chooseTarget(f, idx, WEIGHT_FALSE, "vf");
    if (pick) {
      const text = `${f.text.slice(0, pick.t.start)}${pick.d[0]}${f.text.slice(pick.t.end)}`;
      return {
        type: "vf",
        prompt: "¿Verdadero o falso según la norma?",
        statement: text,
        options: ["Verdadero", "Falso"],
        correctIndex: 1,
        explanation: `Falso. Lo correcto es «${pick.t.text}». ${quote(f)}`,
        articleId: f.articleId,
        articleLabel: f.label,
      };
    }
  }
  return {
    type: "vf",
    prompt: "¿Verdadero o falso según la norma?",
    statement: f.text,
    options: ["Verdadero", "Falso"],
    correctIndex: 0,
    explanation: `Verdadero. ${quote(f)}`,
    articleId: f.articleId,
    articleLabel: f.label,
  };
}

function makeArticleQ(a: ArticleLite, f: Fact, all: ArticleLite[]): Omit<Question, "id"> | null {
  if (a.kind !== "articulo" || f.text.length < 60 || f.text.length > 260) return null;
  if (isFragment(f.text)) return null;
  if (/(presente|anterior|siguientes?|mismo|citado|referido)\s+(art[ií]culo|apartado|ley|t[ií]tulo|cap[ií]tulo|p[aá]rrafo)|apartados?\s+(anterior|siguiente)|dicho\s+art[ií]culo/i.test(f.text)) {
    return null;
  }
  const arts = all.filter((x) => x.kind === "articulo");
  const me = arts.findIndex((x) => x.id === a.id);
  if (me < 0 || arts.length < 5) return null;
  const near = arts.filter((x, i) => i !== me && Math.abs(i - me) <= 12 && x.number !== a.number);
  const far = arts.filter((x) => x.number !== a.number && !near.includes(x));
  const chosen = [...sample(near, 2), ...sample(far.length ? far : near, 2)];
  const labels = [...new Set(chosen.map((x) => `Art. ${x.number}`))].filter((l) => l !== `Art. ${a.number}`).slice(0, 3);
  const o = withOptions(`Art. ${a.number}`, labels);
  if (!o) return null;
  return {
    type: "article",
    prompt: "¿En qué artículo se establece lo siguiente?",
    statement: f.text,
    options: o.options,
    correctIndex: o.correctIndex,
    explanation: `${quote(f)}${a.rubric ? ` — «${a.rubric}»` : ""}`,
    articleId: a.id,
    articleLabel: `Art. ${a.number}`,
  };
}

function planTypes(count: number, types: QuestionType[]): QuestionType[] {
  const weights: Record<QuestionType, number> = { cloze: 0.45, vf: 0.35, article: 0.2 };
  const active: QuestionType[] = types.length ? types : ["cloze", "vf", "article"];
  const sum = active.reduce((s, t) => s + weights[t], 0);
  const counts = active.map((t) => ({ t, n: Math.max(1, Math.round((count * weights[t]) / sum)) }));
  let total = counts.reduce((s, c) => s + c.n, 0);
  let i = 0;
  while (total > count) {
    if (counts[i % counts.length].n > 1) {
      counts[i % counts.length].n--;
      total--;
    }
    i++;
    if (i > 1000) break;
  }
  i = 0;
  while (total < count) {
    counts[i % counts.length].n++;
    total++;
    i++;
  }
  return shuffle(counts.flatMap((c) => Array<QuestionType>(c.n).fill(c.t)));
}

export function generateQuestions(
  idx: Index,
  scoped: ArticleLite[],
  all: ArticleLite[],
  opts: { count: number; types: QuestionType[] },
): Question[] {
  const plan = planTypes(opts.count, opts.types);
  const arts = shuffle(scoped.filter((a) => (idx.facts.get(a.id)?.length ?? 0) > 0));
  if (arts.length === 0) return [];
  const used = new Set<string>();
  const out: Question[] = [];
  let cursor = 0;

  const build = (type: QuestionType, a: ArticleLite): Omit<Question, "id"> | null => {
    const facts = idx.facts.get(a.id) ?? [];
    const order = shuffle(facts.map((_, i) => i)).filter((i) => !used.has(`${a.id}:${i}`));
    for (const i of order) {
      const f = facts[i];
      let q: Omit<Question, "id"> | null = null;
      if (type === "cloze") q = f.targets.length ? makeCloze(f, idx) : null;
      else if (type === "vf") q = makeVF(f, idx);
      else q = makeArticleQ(a, f, all);
      if (q) {
        used.add(`${a.id}:${i}`);
        return q;
      }
    }
    return null;
  };

  const fallbackOrder = (t: QuestionType): QuestionType[] => {
    const rest = (opts.types.length ? opts.types : (["cloze", "vf", "article"] as QuestionType[])).filter((x) => x !== t);
    return [t, ...rest];
  };

  for (const type of plan) {
    let made: Omit<Question, "id"> | null = null;
    const budget = arts.length * 2;
    for (let tries = 0; tries < budget && !made; tries++) {
      const a = arts[cursor++ % arts.length];
      const types = tries < arts.length ? [type] : fallbackOrder(type);
      for (const ty of types) {
        made = build(ty, a);
        if (made) break;
      }
    }
    if (made) out.push({ ...made, id: `q${out.length + 1}` });
  }
  return out;
}

/* ------------------------------ Juegos ------------------------------ */

export interface PairItem {
  articleId: number;
  label: string;
  text: string;
}

export interface HangmanItem {
  articleId: number;
  articleLabel: string;
  word: string;
  hint: string;
}

export interface OrderItem {
  articleId: number;
  articleLabel: string;
  words: string[];
}

export function snippet(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 20))}…`;
}

export function buildPairs(idx: Index, scoped: ArticleLite[], n = 6): PairItem[] {
  const out: PairItem[] = [];
  const seen = new Set<string>();
  for (const a of shuffle(scoped)) {
    if (a.kind !== "articulo") continue;
    const first = stripMarker(a.body.split("\n")[0] ?? "").text;
    const text = a.rubric && a.rubric.length >= 6 ? a.rubric : snippet(first, 78);
    if (text.length < 12) continue;
    const key = text.slice(0, 22).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ articleId: a.id, label: `Art. ${a.number}`, text });
    if (out.length >= n) break;
  }
  void idx;
  return out;
}

export function buildHangman(idx: Index, scoped: ArticleLite[], n = 6): HangmanItem[] {
  const out: HangmanItem[] = [];
  const seenWords = new Set<string>();
  for (const a of shuffle(scoped)) {
    const facts = shuffle(idx.facts.get(a.id) ?? []);
    for (const f of facts) {
      const cands = f.targets.filter(
        (t) =>
          (t.kind === "termino" || t.kind === "numero" || t.kind === "entidad") &&
          /^\p{L}+$/u.test(t.text) &&
          t.text.length >= 5 &&
          t.text.length <= 13,
      );
      if (!cands.length) continue;
      const t = cands[Math.floor(Math.random() * cands.length)];
      const word = t.text.toUpperCase();
      if (seenWords.has(word)) continue;
      seenWords.add(word);
      out.push({
        articleId: f.articleId,
        articleLabel: f.label,
        word,
        hint: `${f.text.slice(0, t.start)}_____${f.text.slice(t.end)}`,
      });
      break;
    }
    if (out.length >= n) break;
  }
  return out;
}

export function buildOrder(idx: Index, scoped: ArticleLite[], n = 6): OrderItem[] {
  const out: OrderItem[] = [];
  for (const a of shuffle(scoped)) {
    const facts = shuffle(idx.facts.get(a.id) ?? []);
    const f = facts.find((x) => {
      const w = x.text.split(/\s+/).length;
      return w >= 7 && w <= 15 && x.text.length <= 150;
    });
    if (!f) continue;
    out.push({ articleId: f.articleId, articleLabel: f.label, words: f.text.split(/\s+/) });
    if (out.length >= n) break;
  }
  return out;
}
