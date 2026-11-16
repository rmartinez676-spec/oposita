import { NextResponse } from "next/server";
import { fail, workspaceOf } from "@/lib/server";
import { parseLaw } from "@/lib/lawParser";
import { boeHtmlToText, decodeTextFile, fetchBoeLaw, normalizeBoeId, pdfToText } from "@/lib/boe";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Lee un archivo (PDF / TXT / HTML del BOE) o una norma del BOE y dice qué ha encontrado. */
export async function POST(request: Request) {
  if (!workspaceOf(request)) return fail("No he podido identificar tu espacio de estudio. Recarga la página e inténtalo de nuevo.");
  try {
    const type = request.headers.get("content-type") ?? "";

    if (type.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return fail("No he recibido ningún archivo");
      if (file.size > 30 * 1024 * 1024) return fail("El archivo pesa demasiado (máximo 30 MB)");
      const buf = await file.arrayBuffer();
      const lower = file.name.toLowerCase();
      let text = "";
      if (lower.endsWith(".pdf") || file.type === "application/pdf") {
        try {
          text = await pdfToText(buf);
        } catch (e) {
          console.error("pdf", e);
          return fail("No he podido leer ese PDF. Prueba a descargarlo de nuevo o súbelo como texto.", 422);
        }
        if (text.trim().length < 100) {
          return fail("Ese PDF no tiene texto seleccionable (parece una imagen escaneada).", 422);
        }
      } else if (lower.endsWith(".html") || lower.endsWith(".htm")) {
        text = boeHtmlToText(decodeTextFile(buf)).text;
      } else {
        text = decodeTextFile(buf);
      }
      const parsed = parseLaw(text);
      return NextResponse.json({
        source: "archivo",
        text,
        suggestedName: parsed.suggestedName || file.name.replace(/\.[^.]+$/, ""),
        articleCount: parsed.articles.length,
        fileName: file.name,
      });
    }

    const body = await request.json();

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
    return fail("Indica un archivo, un enlace del BOE o pega el texto de la ley");
  } catch (error) {
    console.error("POST /api/laws/extract", error);
    return fail("No se pudo analizar la ley", 500);
  }
}
