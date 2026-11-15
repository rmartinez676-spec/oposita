import { NextResponse } from "next/server";
import { fail, NO_WORKSPACE_MSG, workspaceOf } from "@/lib/server";
import { parseLaw } from "@/lib/lawParser";
import { boeHtmlToText, decodeTextFile, fetchBoeLaw, normalizeBoeId, pdfToText } from "@/lib/boe";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_BYTES = 30 * 1024 * 1024;

/**
 * Lee una ley y dice qué ha encontrado. Tres entradas posibles:
 *  - Archivo (PDF / TXT / HTML) enviado como cuerpo directo, con ?name=<archivo.pdf>
 *  - JSON { boe: "enlace o BOE-A-…" }
 *  - JSON { text: "…" }
 */
export async function POST(request: Request) {
  if (!workspaceOf(request)) return fail(NO_WORKSPACE_MSG);
  try {
    const fileName = new URL(request.url).searchParams.get("name");

    if (fileName !== null) {
      const buf = await request.arrayBuffer();
      if (!buf.byteLength) return fail("El archivo está vacío.");
      if (buf.byteLength > MAX_BYTES) return fail("El archivo pesa demasiado (máximo 30 MB).");
      const lower = fileName.toLowerCase();
      const head = new TextDecoder("latin1").decode(buf.slice(0, 8));
      let text = "";

      if (head.startsWith("%PDF") || lower.endsWith(".pdf")) {
        try {
          text = await pdfToText(buf);
        } catch (e) {
          console.error("pdf", e);
          return fail("No he podido leer ese PDF. Prueba a descargarlo de nuevo o súbelo como texto (.txt).", 422);
        }
        if (text.trim().length < 100) {
          return fail("Ese PDF no tiene texto seleccionable (parece una imagen escaneada).", 422);
        }
      } else {
        const decoded = decodeTextFile(buf);
        if (decoded.slice(0, 3000).includes("\u0000")) {
          return fail("No reconozco ese formato. Sube un PDF, un .txt o un .html del BOE.", 422);
        }
        const looksHtml = lower.endsWith(".html") || lower.endsWith(".htm") || /<html|<!doctype html/i.test(decoded.slice(0, 3000));
        text = looksHtml ? boeHtmlToText(decoded).text : decoded;
      }

      const parsed = parseLaw(text);
      return NextResponse.json({
        source: "archivo",
        text,
        suggestedName: parsed.suggestedName || fileName.replace(/\.[^.]+$/, ""),
        articleCount: parsed.articles.length,
        fileName,
      });
    }

    let body: { boe?: unknown; text?: unknown };
    try {
      body = JSON.parse(await request.text());
    } catch {
      return fail("No he entendido la petición. Recarga la página e inténtalo de nuevo.");
    }

    if (typeof body.boe === "string" && body.boe.trim()) {
      const id = normalizeBoeId(body.boe);
      if (!id) return fail("No reconozco ese identificador. Pega el enlace del BOE o algo como BOE-A-1978-31229.");
      let out;
      try {
        out = await fetchBoeLaw(id);
      } catch (e) {
        return fail(e instanceof Error ? e.message : "No se pudo consultar el BOE", 502);
      }
      const parsed = parseLaw(out.text);
      return NextResponse.json({
        source: "boe",
        boeId: id,
        suggestedName: out.title || parsed.suggestedName,
        articleCount: parsed.articles.length,
      });
    }

    if (typeof body.text === "string") {
      const parsed = parseLaw(body.text);
      return NextResponse.json({
        source: "texto",
        suggestedName: parsed.suggestedName,
        articleCount: parsed.articles.length,
      });
    }
    return fail("Indica un archivo, un enlace del BOE o pega el texto de la ley.");
  } catch (error) {
    console.error("POST /api/laws/extract", error);
    return fail("No se pudo analizar la ley", 500);
  }
}
