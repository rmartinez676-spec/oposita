"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Check, Copy, Eye, EyeOff, FolderOpen, KeyRound, Search, X } from "lucide-react";
import { getWorkspaceId, setWorkspaceId } from "@/lib/client";

const LINKS = [
  { href: "/", label: "Mi mesa", icon: FolderOpen },
  { href: "/oposiciones", label: "Oposiciones", icon: Search },
  { href: "/apuntes", label: "Cuaderno", icon: BookOpen },
];

function WorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [code] = useState(() => getWorkspaceId());
  const [copied, setCopied] = useState(false);
  const [other, setOther] = useState("");
  const [error, setError] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const restore = () => {
    if (!setWorkspaceId(other.trim())) {
      setError("Ese código no es válido (8–64 letras o números).");
      return;
    }
    window.location.href = "/";
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="fade-in absolute inset-0 bg-stone-900/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="pop-in relative w-full max-w-md rounded-xl bg-[#fffdf4] p-6 shadow-2xl ring-1 ring-black/10">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-hand-caveat text-[32px] font-bold leading-none text-amber-950">Tu código de estudio</h2>
        <p className="mt-2 text-[15px] leading-snug text-stone-600">
          Tus leyes, apuntes y resultados se guardan con este código, sin necesidad de registrarte. Guárdalo para
          recuperar tu mesa en otro ordenador o móvil.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-600/20">
          <code className="min-w-0 flex-1 truncate text-sm text-stone-700">{code}</code>
          <button
            type="button"
            onClick={copy}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-amber-800 shadow-sm ring-1 ring-black/10 hover:-rotate-1"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="mt-5 border-t border-dashed border-stone-300 pt-4">
          <p className="text-sm font-bold text-stone-700">¿Ya tienes un código de otro dispositivo?</p>
          <div className="mt-2 flex gap-2">
            <input
              value={other}
              onChange={(e) => {
                setOther(e.target.value);
                setError("");
              }}
              placeholder="Pega aquí tu código"
              className="input-paper min-w-0 flex-1 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={restore}
              disabled={!other.trim()}
              className="btn-primary-hand rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Usar
            </button>
          </div>
          {error && <p className="mt-1.5 text-sm text-rose-700">{error}</p>}
          <p className="mt-2 text-xs text-stone-500">
            Cuidado: al cambiar de código verás la mesa de ese código; la actual seguirá guardada con el suyo.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppNav() {
  const pathname = usePathname();
  const [mascotOn, setMascotOn] = useState(true);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    setMascotOn(window.localStorage.getItem("oposita-mascot") !== "off");
  }, []);

  const toggleMascot = () => {
    const next = !mascotOn;
    setMascotOn(next);
    window.dispatchEvent(new CustomEvent("oposita-toggle", { detail: { enabled: next } }));
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-dashed border-amber-900/20 bg-[#f6ecd5]/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="relative h-11 w-11 overflow-hidden rounded-full bg-amber-100 shadow-[0_3px_0_#b45309] ring-2 ring-amber-700/70 transition-transform group-hover:-rotate-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/oposita/idle.png"
                alt="Oposita"
                className="absolute left-1/2 top-[3px] h-[210%] w-auto max-w-none -translate-x-1/2"
              />
            </span>
            <span className="leading-none">
              <span className="block font-hand-caveat text-[32px] font-bold text-amber-950">Oposita</span>
              <span className="-mt-0.5 hidden text-[10.5px] uppercase tracking-[0.14em] text-stone-500 sm:block">
                apuntes · tests · juegos
              </span>
            </span>
          </Link>

          <nav className="ml-1 flex flex-1 items-center gap-1 sm:ml-4">
            {LINKS.map((l) => {
              const active = l.href === "/" ? pathname === "/" || pathname.startsWith("/leyes") : pathname.startsWith(l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-bold transition-all hover:-rotate-1 ${
                    active
                      ? "bg-amber-500 text-white shadow-[0_3px_0_#92400e]"
                      : "text-stone-600 hover:bg-white/70 hover:text-amber-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMascot}
              title={mascotOn ? "Dejar descansar a Oposita" : "Despertar a Oposita"}
              aria-label={mascotOn ? "Ocultar a Oposita" : "Mostrar a Oposita"}
              className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 text-sm font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1 hover:text-amber-900"
            >
              {mascotOn ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="hidden md:inline">{mascotOn ? "Oposita" : "Oposita zzz"}</span>
            </button>
            <button
              type="button"
              onClick={() => setDialog(true)}
              title="Tu código de estudio"
              aria-label="Tu código de estudio"
              className="rounded-full bg-white/80 p-2.5 text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-3 hover:text-amber-900"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      {dialog && <WorkspaceDialog onClose={() => setDialog(false)} />}
    </>
  );
}
