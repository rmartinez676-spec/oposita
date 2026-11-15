"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { storageGet, storageSet, type MascotEventDetail } from "@/lib/client";

type Mode = "idle" | "walk" | "hop" | "cheer" | "think";

const SPRITE: Record<Mode, string> = {
  idle: "/oposita/idle.png",
  hop: "/oposita/idle.png",
  walk: "/oposita/walk.png",
  cheer: "/oposita/cheer.png",
  think: "/oposita/think.png",
};

const KEY = "oposita-mascot";

const TIPS = [
  "¡Un artículo al día y el suspenso se va de vacaciones!",
  "Psst… el art. 14 CE siempre cae. Siempre.",
  "¿Café, subrayador o test? Elige tu arma.",
  "Las plazas no se ganan solas… ¡pero tú sí!",
  "Repasa en voz alta: tus vecinos acabarán aprobando también.",
  "Fallar un test hoy = acertar la pregunta el día del examen.",
  "Respira hondo, relee el enunciado y… ¡tú puedes!",
  "Mi dieta: 70 % café, 30 % artículos.",
  "Tip: haz un test de fallos. ¡Los artículos flojos tiemblan!",
  "Hoy toca constancia, no heroicidades.",
  "El descanso también es temario. ¡Estira las piernas!",
  "Plazos y mayorías: ahí está la trampa de la oposición.",
  "¿Has hecho ya tu test de hoy? Te estoy mirando 👀",
  "Subraya poco y repasa mucho: el truco de los que aprueban.",
  "En el test, las palabras «siempre» y «nunca» huelen a trampa.",
  "Un mal día de estudio sigue siendo un día de estudio.",
];

function randomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function Mascot() {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dur, setDur] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [mode, setMode] = useState<Mode>("idle");
  const [bubble, setBubble] = useState("");
  const [H, setH] = useState(150);
  const [vw, setVw] = useState(1200);

  const posRef = useRef(pos);
  const modeRef = useRef<Mode>("idle");
  const focusRef = useRef(false);
  const dragRef = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const timers = useRef<{ wander?: number; walk?: number; bubble?: number; mood?: number }>({});
  const W = Math.round(H * 0.56);

  const place = useCallback((p: { x: number; y: number }) => {
    posRef.current = p;
    setPos(p);
  }, []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const bounds = useCallback(() => {
    return { maxX: Math.max(0, window.innerWidth - W - 6), maxY: Math.max(0, window.innerHeight - H - 6) };
  }, [W, H]);

  const say = useCallback((text: string, ms = 5000) => {
    setBubble(text);
    window.clearTimeout(timers.current.bubble);
    timers.current.bubble = window.setTimeout(() => setBubble(""), ms);
  }, []);

  const walkTo = useCallback(
    (x: number, y: number) => {
      const cur = posRef.current;
      const dist = Math.hypot(x - cur.x, y - cur.y);
      const secs = clamp(dist / 115, 1.1, 7);
      setFacing(x >= cur.x ? 1 : -1);
      setDur(secs);
      setMode("walk");
      place({ x, y });
      window.clearTimeout(timers.current.walk);
      timers.current.walk = window.setTimeout(() => {
        setMode((m) => (m === "walk" ? "idle" : m));
        setDur(0);
      }, secs * 1000 + 60);
    },
    [place],
  );

  /* ------------------------------ Montaje ------------------------------ */
  useEffect(() => {
    const off = storageGet(KEY) === "off";
    const small = window.innerWidth < 640;
    const h = small ? 118 : 150;
    setH(h);
    setVw(window.innerWidth);
    setEnabled(!off);
    const w = Math.round(h * 0.56);
    const start = { x: Math.max(0, window.innerWidth - w - 24), y: Math.max(0, window.innerHeight - h - 8) };
    posRef.current = start;
    setPos(start);
    setReady(true);

    if (!off && !storageGet("oposita-greeted", true)) {
      storageSet("oposita-greeted", "1", true);
      window.setTimeout(() => say("¡Hola! Soy Oposita 👋 Tócame para un consejo… o arrástrame."), 1400);
    }

    const onResize = () => {
      const nh = window.innerWidth < 640 ? 118 : 150;
      setH(nh);
      setVw(window.innerWidth);
      const nw = Math.round(nh * 0.56);
      place({
        x: clamp(posRef.current.x, 0, Math.max(0, window.innerWidth - nw - 6)),
        y: clamp(posRef.current.y, 0, Math.max(0, window.innerHeight - nh - 6)),
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [place, say]);

  /* ------------------------------ Paseo ------------------------------ */
  useEffect(() => {
    if (!ready || !enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = timers.current;
    const schedule = () => {
      window.clearTimeout(t.wander);
      t.wander = window.setTimeout(() => {
        const busy = focusRef.current || dragRef.current || modeRef.current !== "idle";
        if (!busy) {
          const { maxX, maxY } = bounds();
          const bottom = Math.random() < 0.7;
          const x = 6 + Math.random() * Math.max(10, maxX - 6);
          const y = bottom ? maxY : 76 + Math.random() * Math.max(10, maxY - 76);
          walkTo(x, y);
          if (Math.random() < 0.3) window.setTimeout(() => say(randomTip()), 1600);
        }
        schedule();
      }, 3500 + Math.random() * 6500);
    };
    schedule();
    return () => window.clearTimeout(t.wander);
  }, [ready, enabled, bounds, walkTo, say]);

  /* ------------------------------ Eventos ------------------------------ */
  useEffect(() => {
    const t = timers.current;
    const onEvt = (e: Event) => {
      const d = (e as CustomEvent<MascotEventDetail>).detail ?? {};
      if (d.focus !== undefined) {
        focusRef.current = d.focus;
        if (d.focus) {
          const { maxX, maxY } = bounds();
          walkTo(maxX, maxY);
        }
      }
      if (d.say) say(d.say, 5600);
      if (d.mood && d.mood !== "idle") {
        window.clearTimeout(t.mood);
        setMode(d.mood);
        t.mood = window.setTimeout(() => setMode("idle"), 4200);
      }
    };
    const onToggle = (e: Event) => {
      const on = Boolean((e as CustomEvent<{ enabled: boolean }>).detail?.enabled);
      setEnabled(on);
      storageSet(KEY, on ? "on" : "off");
    };
    window.addEventListener("oposita", onEvt);
    window.addEventListener("oposita-toggle", onToggle);
    return () => {
      window.removeEventListener("oposita", onEvt);
      window.removeEventListener("oposita-toggle", onToggle);
      Object.values(t).forEach((id) => window.clearTimeout(id));
    };
  }, [bounds, walkTo, say]);

  /* ------------------------------ Arrastrar / clic ------------------------------ */
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      dx: e.clientX - posRef.current.x,
      dy: e.clientY - posRef.current.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    window.clearTimeout(timers.current.walk);
    setDur(0);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) {
      d.moved = true;
      setMode("cheer");
    }
    if (d.moved) {
      const { maxX, maxY } = bounds();
      place({ x: clamp(e.clientX - d.dx, 0, maxX), y: clamp(e.clientY - d.dy, 0, maxY) });
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved) {
      setMode("idle");
      if (Math.random() < 0.5) say("¡Eh! ¡Cuidado con el moño!", 3200);
    } else {
      setMode("hop");
      say(randomTip());
      window.clearTimeout(timers.current.mood);
      timers.current.mood = window.setTimeout(() => setMode((m) => (m === "hop" ? "idle" : m)), 850);
    }
  };

  if (!ready || !enabled) return null;

  const cx = pos.x + W / 2;
  const align = cx < 125 ? "left" : cx > vw - 125 ? "right" : "center";
  const anim =
    mode === "walk" ? "mascot-walk" : mode === "hop" ? "mascot-hop" : mode === "cheer" ? "mascot-cheer" : mode === "think" ? "mascot-think" : "mascot-idle";

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[90]"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: dur ? `transform ${dur}s cubic-bezier(0.45, 0.05, 0.55, 0.95)` : "none",
        willChange: "transform",
      }}
    >
      <div className="relative" style={{ width: W, height: H }}>
        {bubble && (
          <div
            className="bubble-in pointer-events-none absolute w-max max-w-[210px] rounded-2xl bg-[#fffdf4] px-3.5 py-2 text-center font-hand-caveat text-[21px] font-semibold leading-[1.1] text-amber-950 shadow-[0_10px_24px_-8px_rgba(80,55,15,0.55)] ring-1 ring-amber-900/20"
            style={{
              bottom: H + 8,
              ...(align === "left" ? { left: 0 } : align === "right" ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }),
            }}
          >
            {bubble}
            <span
              className="absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 bg-[#fffdf4] ring-1 ring-amber-900/20"
              style={{
                clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                ...(align === "left" ? { left: W / 2 - 7 } : align === "right" ? { right: W / 2 - 7 } : { left: "calc(50% - 7px)" }),
              }}
            />
          </div>
        )}

        <button
          type="button"
          aria-label="Oposita, tu mascota de estudio. Toca para un consejo o arrástrala."
          className="pointer-events-auto absolute inset-0 cursor-grab touch-none select-none outline-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span
            className="absolute bottom-0 left-1/2 h-3 w-[78%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-[3px]"
            style={{ transform: `translateX(-50%) scale(${mode === "walk" || mode === "hop" ? 0.82 : 1})`, transition: "transform .3s" }}
          />
          <span className="absolute inset-0 flex items-end justify-center">
            <span
              className="flex items-end"
              style={{ transform: mode === "walk" && facing === -1 ? "scaleX(-1)" : undefined }}
            >
              <span className={`flex items-end ${anim}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SPRITE[mode]}
                  alt=""
                  draggable={false}
                  style={{ height: H, width: "auto", maxWidth: "none" }}
                  className="drop-shadow-[0_6px_6px_rgba(60,40,10,0.28)]"
                />
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
