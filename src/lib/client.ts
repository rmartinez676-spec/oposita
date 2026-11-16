/* Utilidades del navegador: espacio de trabajo, peticiones y eventos de Oposita */

const WS_KEY = "oposita-workspace";
const COOKIE_KEY = "oposita-ws";
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

let memoryId = "";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  } catch {
    /* sin contexto seguro */
  }
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
}

function readCookie(): string {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_KEY}=([A-Za-z0-9_-]{8,64})`));
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

function writeCookie(id: string) {
  try {
    const secure = window.location.protocol === "https:";
    // En https usamos SameSite=None (+Partitioned) para que también funcione dentro de un iframe de vista previa.
    document.cookie = secure
      ? `${COOKIE_KEY}=${id}; Path=/; Max-Age=31536000; SameSite=None; Secure; Partitioned`
      : `${COOKIE_KEY}=${id}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* cookies bloqueadas */
  }
}

/**
 * El código de estudio se guarda en varios sitios a la vez (localStorage, cookie y memoria)
 * por si el navegador bloquea alguno, p. ej. dentro de un iframe.
 */
export function getWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  let id = "";
  try {
    id = window.localStorage.getItem(WS_KEY) ?? "";
  } catch {
    /* localStorage bloqueado */
  }
  if (!ID_RE.test(id)) id = readCookie();
  if (!ID_RE.test(id)) id = memoryId;
  if (!ID_RE.test(id)) id = randomId();
  memoryId = id;
  try {
    if (window.localStorage.getItem(WS_KEY) !== id) window.localStorage.setItem(WS_KEY, id);
  } catch {
    /* localStorage bloqueado */
  }
  if (readCookie() !== id) writeCookie(id);
  return id;
}

export function setWorkspaceId(id: string): boolean {
  if (!ID_RE.test(id)) return false;
  memoryId = id;
  try {
    window.localStorage.setItem(WS_KEY, id);
  } catch {
    /* localStorage bloqueado */
  }
  writeCookie(id);
  return true;
}

/** fetch que identifica tu espacio de trabajo por cabecera Y por parámetro (por si un proxy elimina cabeceras). */
export function wsFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const id = getWorkspaceId();
  const headers = new Headers(init.headers);
  headers.set("x-workspace-id", id);
  const url = `${input}${input.includes("?") ? "&" : "?"}ws=${encodeURIComponent(id)}`;
  return fetch(url, { ...init, headers, cache: "no-store" });
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
