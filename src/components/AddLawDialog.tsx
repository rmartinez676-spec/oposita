"use client";

import { useRef, useState } from "react";
import { Check, ClipboardPaste, FileText, Link2, Loader2, Upload, X } from "lucide-react";
import { api, wsFetch } from "@/lib/client";
import { autoShortName, OPOSICIONES } from "@/lib/catalog";

type Tab = "boe" | "archivo" | "texto";

interface Analysis {
  source: string;
  text?: string;
  boeId?: string;
  suggestedName: string;
  articleCount: number;
  fileName?: string;
}

interface AddLawDialogProps {
  defaultOpo?: string;
  onClose: () => void;
  onCreated: (lawId: number) => void;
}

const TABS: { id: Tab; label: string; icon: typeof Link2; hint: string }[] = [
  { id: "boe", label: "Del BOE", icon: Link2, hint: "Pega el enlace o el identificador" },
  { id: "archivo", label: "Subir archivo", icon: Upload, hint: "PDF, TXT o HTML" },
  { id: "texto", label: "Pegar texto", icon: ClipboardPaste, hint: "Copia y pega la ley" },
];

export default function AddLawDialog({ defaultOpo = "", onClose, onCreated }: AddLawDialogProps) {
  const [tab, setTab] = useState<Tab>("boe");
  const [boe, setBoe] = useState("");
  const [pasted, setPasted] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [opo, setOpo] = useState(defaultOpo);
  const [busy, setBusy] = useState<"" | "analyze" | "save">("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyAnalysis = (a: Analysis) => {
    setAnalysis(a);
    setName(a.suggestedName);
    setShortName(autoShortName(a.suggestedName));
  };

  const analyzeFile = async (file: File) => {
    setBusy("analyze");
    setError("");
    setAnalysis(null);
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error("El archivo pesa demasiado (máximo 30 MB).");
      const res = await wsFetch(`/api/laws/extract?name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      let data: (Analysis & { error?: string }) | null = null;
      try {
        data = await res.json();
      } catch {
        /* respuesta sin JSON */
      }
      if (!res.ok || !data) throw new Error(data?.error || `No se pudo leer el archivo (código ${res.status}).`);
      applyAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo");
    } finally {
      setBusy("");
    }
  };

  const analyze = async () => {
    setError("");
    if (tab === "archivo") {
      fileRef.current?.click();
      return;
    }
    setBusy("analyze");
    setAnalysis(null);
    try {
      if (tab === "boe") {
        if (!boe.trim()) throw new Error("Pega el enlace del BOE o su identificador (BOE-A-…)");
        applyAnalysis(await api<Analysis>("/api/laws/extract", { method: "POST", json: { boe } }));
      } else {
        if (pasted.trim().length < 80) throw new Error("Pega el texto completo de la ley (o al menos varios artículos)");
        const a = await api<Analysis>("/api/laws/extract", { method: "POST", json: { text: pasted } });
        applyAnalysis({ ...a, text: pasted });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar la ley");
    } finally {
      setBusy("");
    }
  };

  const save = async () => {
    if (!analysis) return;
    setBusy("save");
    setError("");
    try {
      const out = await api<{ law: { id: number } }>("/api/laws", {
        method: "POST",
        json: {
          name,
          shortName,
          opos: opo,
          boeId: analysis.boeId,
          text: analysis.text,
          source: analysis.source,
        },
      });
      onCreated(out.law.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la ley");
      setBusy("");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-3 sm:p-6">
      <div className="fade-in fixed inset-0 bg-stone-900/55 backdrop-blur-[3px]" onClick={onClose} />
      <div className="pop-in relative my-auto w-full max-w-xl rounded-[18px] bg-[#faf3e0] p-5 shadow-2xl ring-1 ring-black/20 sm:p-7">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-stone-600 shadow-sm ring-1 ring-black/10 transition-transform hover:rotate-90 hover:text-rose-700"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-hand-caveat text-[34px] font-bold leading-none text-amber-950">Añadir una ley a mi mesa</h2>
        <p className="mt-1.5 text-[15px] text-stone-600">
          Oposita la trocea en artículos y prepara tests, apuntes y juegos. Cada carpeta es solo tuya.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setError("");
                  setAnalysis(null);
                }}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center shadow-sm ring-1 transition-all hover:-rotate-1 ${
                  tab === t.id ? "bg-white text-amber-900 ring-2 ring-amber-600" : "bg-white/60 text-stone-600 ring-black/10"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[14px] font-bold leading-tight">{t.label}</span>
                <span className="hidden text-[11px] leading-tight text-stone-500 sm:block">{t.hint}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {tab === "boe" && (
            <div>
              <input
                value={boe}
                onChange={(e) => setBoe(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229"
                className="input-paper w-full px-3.5 py-2.5 text-[15px]"
              />
              <p className="mt-1.5 text-xs leading-snug text-stone-500">
                Abre la ley en boe.es (legislación consolidada), copia la dirección y pégala aquí. Basta con el código
                tipo <code className="rounded bg-white/70 px-1">BOE-A-2015-10565</code>.
              </p>
            </div>
          )}

          {tab === "archivo" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) analyzeFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                drag ? "border-amber-600 bg-amber-100" : "border-amber-700/40 bg-white/60 hover:bg-white"
              }`}
            >
              <FileText className="h-9 w-9 text-amber-700" />
              <p className="font-hand-caveat text-[24px] font-bold leading-none text-amber-950">
                Suelta aquí tu PDF o toca para elegirlo
              </p>
              <p className="text-xs text-stone-500">PDF con texto, .txt o .html del BOE · hasta 30 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.html,.htm,text/plain,application/pdf,text/html"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) analyzeFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {tab === "texto" && (
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={"Pega aquí el texto de la ley…\n\nArtículo 1. …\nArtículo 2. …"}
              className="input-paper nice-scroll min-h-[170px] w-full resize-y px-3.5 py-2.5 text-[14px] leading-snug"
            />
          )}
        </div>

        {tab !== "archivo" && !analysis && (
          <button
            type="button"
            onClick={analyze}
            disabled={busy !== ""}
            className="btn-primary-hand mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white disabled:opacity-60"
          >
            {busy === "analyze" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {busy === "analyze" ? "Leyendo la ley…" : "Analizar la ley"}
          </button>
        )}
        {tab === "archivo" && busy === "analyze" && (
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-amber-800">
            <Loader2 className="h-4 w-4 animate-spin" /> Leyendo el archivo…
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm leading-snug text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        {analysis && (
          <div className="pop-in mt-4 rounded-xl bg-white/80 p-4 ring-1 ring-emerald-600/25">
            <p className="flex items-center gap-2 text-[15px] font-bold text-emerald-800">
              <Check className="h-5 w-5" />
              ¡Listo! He encontrado {analysis.articleCount} {analysis.articleCount === 1 ? "artículo" : "artículos y disposiciones"}
              {analysis.fileName ? ` en «${analysis.fileName}»` : ""}.
            </p>
            {analysis.articleCount === 0 && (
              <p className="mt-1 text-sm text-rose-700">
                No veo líneas del tipo «Artículo 1.». Prueba con otro formato o pega el texto.
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_130px]">
              <div>
                <label className="font-hand-caveat text-[19px] font-semibold leading-none text-amber-900">Nombre de la ley</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-paper mt-1 w-full px-3 py-2 text-[14px]"
                  maxLength={300}
                />
              </div>
              <div>
                <label className="font-hand-caveat text-[19px] font-semibold leading-none text-amber-900">Siglas</label>
                <input
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="input-paper mt-1 w-full px-3 py-2 text-[14px]"
                  maxLength={40}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="font-hand-caveat text-[19px] font-semibold leading-none text-amber-900">
                ¿Para qué oposición es?
              </label>
              <input
                value={opo}
                onChange={(e) => setOpo(e.target.value)}
                list="opo-options"
                placeholder="Ej.: Auxiliar Administrativo del Estado"
                className="input-paper mt-1 w-full px-3 py-2 text-[14px]"
                maxLength={120}
              />
              <datalist id="opo-options">
                {OPOSICIONES.map((o) => (
                  <option key={o.id} value={o.name} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={busy !== "" || !name.trim() || analysis.articleCount === 0}
              className="btn-primary-hand mt-4 flex items-center gap-2 rounded-full px-6 py-2.5 text-[15px] font-bold text-white disabled:opacity-50"
            >
              {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {busy === "save" ? "Guardando…" : "Guardar en mi mesa"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
