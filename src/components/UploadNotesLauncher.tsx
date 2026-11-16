"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import UploadNotesDialog from "./UploadNotesDialog";

/**
 * Botón global «Subir PDF»: cualquier página puede abrir el diálogo
 * lanzando el evento "oposita-upload". Así siempre hay un sitio donde subir
 * los apuntes de la academia, estés donde estés.
 */
export default function UploadNotesLauncher() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("oposita-upload", onOpen);
    return () => window.removeEventListener("oposita-upload", onOpen);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <>
      {open && (
        <UploadNotesDialog
          onClose={() => setOpen(false)}
          onImported={(created) => {
            setOpen(false);
            setToast(`¡${created.length} ${created.length === 1 ? "hoja importada" : "hojas importadas"}! Míralas en el Cuaderno.`);
            window.dispatchEvent(new CustomEvent("oposita-notes-imported", { detail: { count: created.length } }));
          }}
        />
      )}
      {toast && (
        <div className="toast-up fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#fef6c8] px-4 py-2.5 font-bold text-amber-900 shadow-[0_14px_28px_-8px_rgba(80,55,15,0.55)] ring-1 ring-amber-600/20">
          <Check className="h-4.5 w-4.5 text-emerald-600" />
          {toast}
        </div>
      )}
    </>
  );
}
