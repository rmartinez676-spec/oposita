/* Utilidades del navegador: espacio de trabajo, peticiones y eventos de Oposita */

const WS_KEY = "oposita-workspace";
const WS_COOKIE = "oposita_ws";
const VALID = /^[A-Za-z0-9_-]{8,64}$/;

/** Copia en memoria por si el navegador bloquea localStorage y las cookies. */
let memoryId = "";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch {
    /* sin contexto seguro */
  }
  try {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    /* sin crypto */
  }
  let s = "";
  while (s.length < 24) s += Math.random().toString(36).slice(2);
  return s.slice(0, 32);
}

function readCookie(): string {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${WS_COOKIE}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : "";
  } catch {
    return "";
  }
}

function writeCookie(id: string) {
  try {
    const secure = window.location.protocol === "https:";
    document.cookie = `${WS_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=${secure ? "None; Secure" : "Lax"}`;
  } catch {
    /* cookies bloqueadas */
  }
}

function persist(id: string) {
  memoryId = id;
  try {
    window.localStorage.setItem(WS_KEY, id);
  } catch {
    /* localStorage bloqueado */
  }
  writeCookie(id);
}

/** Devuelve siempre un id válido: localStorage → cookie → memoria → uno nuevo. */
export function getWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  let id = "";
  try {
    id = window.localStorage.getItem(WS_KEY) ?? "";
  } catch {
    /* localStorage bloqueado */
  }
  if (!VALID.test(id)) id = readCookie();
  if (!VALID.test(id)) id = memoryId;
  if (!VALID.test(id)) id = randomId();
  if (id !== memoryId) persist(id);
  return id;
}

export function setWorkspaceId(id: string): boolean {
  if (!VALID.test(id)) return false;
  persist(id);
  return true;
}

/**
 * fetch con el espacio de trabajo por tres vías a la vez (cabecera, parámetro ?ws= y cookie),
 * para que algún proxy o navegador que descarte una de ellas no rompa la app.
 */
export function wsFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const id = getWorkspaceId();
  const headers = new Headers(init.headers);
  headers.set("x-workspace-id", id);
  const url = `${input}${input.includes("?") ? "&" : "?"}ws=${encodeURIComponent(id)}`;
  return fetch(url, { ...init, headers, cache: "no-store", credentials: "same-origin" });
}

export async function api<T>(
  input: string,
  init: Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit | null } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const headers = new Headers(rest.headers);
  let body = rest.body;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }
  const res = await wsFetch(input, { ...rest, headers, body });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* sin cuerpo */
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error;
    throw new Error(msg || "Algo ha fallado. Inténtalo de nuevo.");
  }
  return data as T;
}

/* ---------------------------- Oposita (mascota) ---------------------------- */

export type MascotMood = "idle" | "cheer" | "think";

export interface MascotEventDetail {
  say?: string;
  mood?: MascotMood;
  /** true → se queda quieta en una esquina mientras estudias */
  focus?: boolean;
}

export function oposita(detail: MascotEventDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<MascotEventDetail>("oposita", { detail }));
}
