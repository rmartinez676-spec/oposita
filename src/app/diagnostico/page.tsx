"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Loader2, RefreshCw, X } from "lucide-react";
import { SquiggleLine } from "@/components/Doodles";

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}
interface Diag {
  version: string;
  checks: Check[];
  advice: string[];
}

export default function DiagnosticoPage() {
  const [data, setData] = useState<Diag | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/diagnostico", { cache: "no-store" });
      if (res.status === 404) {
        setError(
          "Esta ruta no existe en el despliegue que estás viendo: tiene código ANTIGUO (anterior a la subida de PDF y a la creación automática de tablas). Vuelve a desplegar en Vercel con la última versión del proyecto.",
        );
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json as Diag);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo ejecutar el diagnóstico");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async () => {
    const text = JSON.stringify(data ?? { error }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copia este texto:", text);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-3 pb-20 pt-7 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[14px] font-bold text-amber-800 hover:text-amber-950">
        <ArrowLeft className="h-4 w-4" /> Mi mesa de estudio
      </Link>
      <h1 className="font-hand-caveat mt-2 text-[46px] font-bold leading-[0.9] text-amber-950">Diagnóstico</h1>
      <SquiggleLine className="mt-1 h-3 w-40 text-rose-500" />
      <p className="mt-2 text-[15px] leading-snug text-stone-600">
        Comprueba la base de datos, las tablas y el acceso al BOE <strong>en el servidor donde está publicada esta web</strong>.
        Si algo falla, aquí te dice qué tocar.
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="btn-primary-hand flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Volver a comprobar
        </button>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar resultado"}
        </button>
      </div>

      {error && (
        <div className="pop-in mt-6 rounded-lg bg-[#fff0f4] p-5 shadow ring-1 ring-rose-300">
          <p className="flex items-start gap-2 text-[15px] leading-snug text-rose-800">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </p>
        </div>
      )}

      {data && (
        <>
          <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Versión del código: {data.version}
          </p>
          <ul className="mt-3 space-y-3">
            {data.checks.map((c) => (
              <li
                key={c.name}
                className={`rounded-xl p-4 shadow-sm ring-1 ${c.ok ? "bg-emerald-50 ring-emerald-300" : "bg-rose-50 ring-rose-300"}`}
              >
                <p className={`flex items-center gap-2 text-[15px] font-bold ${c.ok ? "text-emerald-800" : "text-rose-800"}`}>
                  {c.ok ? <Check className="h-4.5 w-4.5" /> : <X className="h-4.5 w-4.5" />}
                  {c.name}
                </p>
                <p className="mt-1 break-words text-[13px] leading-snug text-stone-600">{c.detail}</p>
              </li>
            ))}
          </ul>
          <div className="relative mt-6 -rotate-[0.4deg] rounded-lg bg-[#fef6c8] p-5 shadow ring-1 ring-amber-600/25">
            <div className="tape left-8 top-[-9px]" style={{ backgroundColor: "rgba(251,191,36,0.5)", transform: "rotate(-3deg)" }} />
            <h2 className="font-hand-caveat text-[28px] font-bold leading-none text-amber-950">Qué hacer</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[14px] leading-snug text-stone-700">
              {data.advice.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </div>
        </>
      )}
    </main>
  );
}
