"use client";

import { Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Sí, borrar",
  cancelLabel = "Mejor no",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <div className="fade-in absolute inset-0 bg-stone-900/55 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="pop-in relative w-full max-w-sm -rotate-1 rounded-lg bg-[#fff0f4] p-6 text-center shadow-2xl ring-1 ring-black/10">
        <div
          className="tape left-1/2 top-[-10px]"
          style={{ backgroundColor: "rgba(244, 114, 182, 0.45)", transform: "translateX(-50%) rotate(-2deg) scale(0.9)" }}
        />
        <Trash2 className="mx-auto h-9 w-9 text-rose-600" />
        <h3 className="font-hand-caveat mt-1 text-[30px] font-bold leading-tight text-stone-800">{title}</h3>
        <p className="mt-1 text-[15px] leading-snug text-stone-600">{message}</p>
        <div className="mt-5 flex justify-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-white px-4 py-2 font-bold text-stone-600 shadow-sm ring-1 ring-black/10 transition-all hover:-rotate-1"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-4 py-2 font-bold text-white shadow-[0_3px_0_#881337,0_8px_14px_rgba(136,19,55,0.3)] transition-all hover:brightness-110 active:translate-y-0.5 active:shadow-none"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
