/* Importación de leyes desde el BOE (legislación consolidada) y de PDFs */

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", Aacute: "Á", Eacute: "É", Iacute: "Í",
  Oacute: "Ó", Uacute: "Ú", ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü", ordm: "º", ordf: "ª",
  mdash: "—", ndash: "–", hellip: "…", euro: "€", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  deg: "°", iexcl: "¡", iquest: "¿", middot: "·", sect: "§", agrave: "à", egrave: "è", ccedil: "ç",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => ENTITIES[name] ?? m);
}

export function normalizeBoeId(input: string): string | null {
  const m = input.match(/BOE-[A-Z]-\d{4}-\d+/i);
  return m ? m[0].toUpperCase() : null;
}

export function boeHtmlToText(html: string): { text: string; title: string } {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = decodeEntities(titleMatch ? titleMatch[1] : "")
    .replace(/^\s*BOE-[A-Z]-\d{4}-\d+\s*/i, "")
    .replace(/\s+/g, " ")
    .replace(/\.\s*$/, "")
    .trim();

  const start = html.indexOf('id="textoxslt"');
  let h = start >= 0 ? html.slice(start) : html;
  const end = h.search(/<div[^>]+id="franja-pie"|class="franja-pie"|<footer/i);
  if (end > 0) h = h.slice(0, end);

  h = h
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<div class="marcadores">[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>/i, "")
    .replace(/<(script|style|form|select|button)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<p class="(?:linkSubir|bloque|nota_pie|nota_pie_2|firma_rey|firma_ministro)"[^>]*>[\s\S]*?<\/p>/gi, "")
    .replace(/<hr[^>]*>/gi, "")
    .replace(/<\/(p|h[1-6]|div|li|tr|blockquote|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " ")
    .replace(/<[^>]+>/g, "");

  const text = decodeEntities(h)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l && !/^texto consolidado/i.test(l) && !/^ir a:?$/i.test(l) && !/^seleccionar apartado$/i.test(l))
    .join("\n");

  return { text, title };
}

const cache = new Map<string, { at: number; text: string; title: string }>();

export async function fetchBoeLaw(id: string): Promise<{ text: string; title: string }> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return { text: hit.text, title: hit.title };

  const res = await fetch(`https://www.boe.es/buscar/act.php?id=${encodeURIComponent(id)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; OpositaApp/1.0)", Accept: "text/html" },
    signal: AbortSignal.timeout(40000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`El BOE no devolvió la norma ${id} (código ${res.status}).`);
  const html = await res.text();
  if (!html.includes('id="textoxslt"')) {
    throw new Error(`No encontré el texto de la norma ${id} en el BOE. Comprueba el identificador.`);
  }
  const out = boeHtmlToText(html);
  if (cache.size > 12) cache.clear();
  cache.set(id, { at: Date.now(), ...out });
  return out;
}

export async function pdfToText(buffer: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

export function decodeTextFile(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("\uFFFD")) return utf8;
  return new TextDecoder("latin1").decode(buffer);
}
