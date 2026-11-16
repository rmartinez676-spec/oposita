"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FileText, Loader2, Upload, X } from "lucide-react";
import { wsFetch } from "@/lib/client";
import type { NoteItem } from "@/lib/apuntes";

interface UploadNotesDialogProps {
  /** Si se indica, los apuntes importados quedan dentro de esa carpeta de ley */
  lawId?: number | null;
  lawName?: string;
  onClose: () => void;
  onImported: (notes: NoteItem[]) => void;
}

interface ImportResponse {
  notes: NoteItem[];
  skipped: { name: string; reason: string }[];
}

export default function UploadNotesDialog({ lawId = null, lawName, onClose, onImported }: UploadNotesDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [skipped, setSkipped] = useState<{ name: string; reason: string }[]>([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const next = [...prev];
      for (const f of incoming) {
        const key = `${f.name}:${f.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(f);
        }
      }
      return next.slice(0, 20);
    });
    setError("");
    setSkipped([]);
  };

  const upload = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError("");
    setSkipped([]);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("file", f);
      if (lawId) fd.append("lawId", String(lawId));
      const res = await wsFetch("/api/notes/import", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as ImportResponse | { error?: string } | null;
      if (!res.ok) throw new Error((data as { error?: string } | null)?.error || "No se pudo importar");
      const ok = (data as ImportResponse).notes ?? [];
      const bad = (data as ImportResponse).skipped ?? [];
      setSkipped(bad);
      setFiles([]);
      if (ok.length) onImported(ok);
      if (!bad.length) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4">
      <div className="fade-in fixed inset-0 bg-stone-900/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="pop-in relative my-auto w-full max-w-lg rounded-[18px] bg-[#faf3e0] p-6 shadow-2xl ring-1 ring-black/20">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-stone-600 shadow-sm ring-1 ring-black/10 transition-transform hover:rotate-90 hover:text-rose-700"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-hand-caveat text-[32px] font-bold leading-none text-amber-950">Subir mis apuntes</h2>
        <p className="mt-1.5 text-[14px] leading-snug text-stone-600">
          {lawName
            ? `Se guardarán dentro de la carpeta «${lawName}».`
            : "Cada PDF o TXT se guarda como un documento completo, con sus temas en el orden original."}{" "}
          Puedes elegir varios a la vez.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!busy && e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
          }}
          onClick={() => !busy && fileRef.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
            drag ? "border-amber-600 bg-amber-100" : "border-amber-700/40 bg-white/60 hover:bg-white"
          }`}
        >
          <FileText className="h-9 w-9 text-amber-700" />
          <p className="font-hand-caveat text-[24px] font-bold leading-none text-amber-950">
            Suelta aquí tus PDF o toca para elegirlos
          </p>
          <p className="text-xs text-stone-500">Varios a la vez · PDF con texto o .txt · hasta 20 archivos / 60 MB</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.txt,text/plain,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="nice-scroll mt-3 max-h-40 space-y-1.5 overflow-y-auto">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-1.5 text-[13px] ring-1 ring-black/5">
                <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                <span className="min-w-0 flex-1 truncate font-bold text-stone-700">{f.name}</span>
                <span className="shrink-0 text-[11px] text-stone-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                <button
                  type="button"
                  aria-label={`Quitar ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-full p-1 text-stone-400 hover:bg-rose-100 hover:text-rose-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={upload}
            disabled={busy || !files.length}
            className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? "Subiendo…" : files.length > 1 ? `Subir ${files.length} documentos` : "Subir documento"}
          </button>
          {files.length > 0 && !busy && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-white px-4 py-2.5 text-[14px] font-bold text-amber-800 shadow-sm ring-1 ring-amber-600/30 transition-all hover:-rotate-1"
            >
              Añadir más
            </button>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm leading-snug text-rose-700 ring-1 ring-rose-200">{error}</p>}

        {skipped.length > 0 && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-600/25">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-900">
              <AlertTriangle className="h-4 w-4" /> Los demás sí se subieron. Estos no:
            </p>
            <ul className="mt-1 space-y-0.5 text-[12px] leading-snug text-stone-600">
              {skipped.map((s) => (
                <li key={s.name}>
                  <strong>{s.name}</strong>: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-[12px] leading-snug text-stone-500">
          Los PDF escaneados (solo imágenes) no tienen texto que extraer: pásalos antes por un OCR o copia el texto a un .txt.
        </p>
      </div>
    </div>
  );
}
