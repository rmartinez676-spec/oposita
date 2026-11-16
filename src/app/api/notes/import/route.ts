import { NextResponse } from "next/server";
import { db } from "@/db";
import { ensureSchema } from "@/db/ensure";
import { notes, type Law } from "@/db/schema";
import { dbFail, fail, findOwnLaw, workspaceOf } from "@/lib/server";
import { decodeTextFile, pdfToText } from "@/lib/boe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sube tus apuntes (PDF o TXT). Cada archivo se guarda como UN documento
 * completo y en el orden original del PDF; se pueden subir varios a la vez.
 */
export async function POST(request: Request) {
  const ws = workspaceOf(request);
  if (!ws) return fail("Falta el espacio de trabajo");
  try {
    await ensureSchema();
    const form = await request.formData();
    const files = form.getAll("file").filter((f): f is File => f instanceof File);
    if (!files.length) return fail("No he recibido ningún archivo");
    if (files.length > 20) return fail("Sube como máximo 20 documentos a la vez");

    const total = files.reduce((s, f) => s + f.size, 0);
    if (total > 60 * 1024 * 1024) return fail("Entre todos los archivos pesan demasiado (máximo 60 MB por subida)");

    const lawIdRaw = form.get("lawId");
    let law: Law | null = null;
    if (lawIdRaw) {
      law = await findOwnLaw(ws, Number(lawIdRaw));
      if (!law) return fail("Esa carpeta de ley no existe", 404);
    }

    const created: (typeof notes.$inferSelect)[] = [];
    const skipped: { name: string; reason: string }[] = [];

    for (const file of files) {
      const lower = file.name.toLowerCase();
      let text = "";
      try {
        if (lower.endsWith(".pdf") || file.type === "application/pdf") {
          text = await pdfToText(await file.arrayBuffer());
        } else {
          text = decodeTextFile(await file.arrayBuffer());
        }
      } catch (e) {
        console.error("import", file.name, e);
        skipped.push({ name: file.name, reason: "No se pudo leer (¿PDF escaneado sin texto?)" });
        continue;
      }

      const content = reflow(text).join("\n");
      if (content.trim().length < 40) {
        skipped.push({ name: file.name, reason: "Casi no tiene texto: parece un PDF escaneado (solo imágenes)" });
        continue;
      }
      if (content.length > 1_500_000) {
        skipped.push({ name: file.name, reason: "Documento demasiado grande para una sola hoja" });
        continue;
      }

      const base = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Mis apuntes";
      const [row] = await db
        .insert(notes)
        .values({
          workspaceId: ws,
          lawId: law?.id ?? null,
          title: base.slice(0, 180),
          lawName: law?.name ?? "",
          article: "",
          category: law?.branch ?? "General",
          content,
          paperColor: law?.color ?? "crema",
          fontStyle: "kalam",
          inkColor: "azul",
          isFavorite: false,
          tags: `importado, ${lower.endsWith(".pdf") ? "pdf" : "txt"}, documento completo`,
        })
        .returning();
      created.push(row);
    }

    if (!created.length) {
      return fail(skipped[0]?.reason ?? "Ningún archivo tenía texto que importar", 422);
    }
    return NextResponse.json({ notes: created, skipped }, { status: 201 });
  } catch (error) {
    return dbFail(error);
  }
}

/** Une las líneas cortadas del PDF en párrafos, respetando el orden y los títulos. */
function reflow(raw: string): string[] {
  const lines = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim());

  const out: string[] = [];
  let buf = "";
  const flush = () => {
    if (buf.trim()) out.push(buf.trim());
    buf = "";
  };

  for (const l of lines) {
    if (!l) {
      flush();
      continue;
    }
    if (/^[•·–-]\s+/.test(l)) {
      flush();
      out.push(`- ${l.replace(/^[•·–-]\s+/, "")}`);
      continue;
    }
    const isHead = /^(#{1,3}\s|TEMA\s|T[ÍI]TULO\s|CAP[ÍI]TULO\s|SECCI[ÓO]N\s|Art[íi]culo\s|\d{1,2}[.)]\s|[a-zñ]\)\s)/i.test(l);
    if (isHead && l.length < 120) {
      flush();
      out.push(l);
      continue;
    }
    buf = buf ? `${buf} ${l}` : l;
    if (buf.length > 700 && /[.!?]$/.test(l)) flush();
  }
  flush();
  return out;
}
