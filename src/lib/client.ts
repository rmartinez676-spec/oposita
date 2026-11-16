/* Utilidades del navegador: espacio de trabajo, peticiones y eventos de Oposita */

const WS_KEY = "oposita-workspace";
const WS_COOKIE = "oposita_ws";
const WS_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** Último recurso si el navegador bloquea tanto localStorage como las cookies. */
let memoryId = "";

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  } catch {
    /* sin contexto seguro */
  }
  let id = "";
  while (id.length < 32) id += Math.random().toString(36).slice(2);
  return id.slice(0, 32);
}

function readCookie(): string {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${WS_COOKIE}=([^;]+)`));
    return m && WS_RE.test(m[1]) ? m[1] : "";
  } catch {
    return "";
  }
}

function writeCookie(id: string) {
  try {
    const secure = window.location.protocol === "https:";
    document.cookie = `${WS_COOKIE}=${id}; path=/; max-age=31536000; SameSite=${secure ? "None; Secure" : "Lax"}`;
  } catch {
    /* cookies bloqueadas */
  }
}

function persist(id: string) {
  memoryId = id;
  try {
    window.localStorage.setItem(WS_KEY, id);
  } catch {
    /* almacenamiento bloqueado (p. ej. iframe con sandbox) */
  }
  if (readCookie() !== id) writeCookie(id);
}

/** Devuelve siempre un código válido: localStorage → cookie → memoria → nuevo. */
export function getWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  let id = "";
  try {
    id = window.localStorage.getItem(WS_KEY) ?? "";
  } catch {
    id = "";
  }
  if (!WS_RE.test(id)) id = readCookie();
  if (!WS_RE.test(id)) id = memoryId;
  if (!WS_RE.test(id)) id = randomId();
  persist(id);
  return id;
}

export function setWorkspaceId(id: string): boolean {
  if (!WS_RE.test(id)) return false;
  persist(id);
  return true;
}

/** fetch que identifica tu espacio de trabajo por cabecera, parámetro de URL y cookie. */
export function wsFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const id = getWorkspaceId();
  const headers = new Headers(init.headers);
  headers.set("x-workspace-id", id);
  const url = input.startsWith("/api/")
    ? `${input}${input.includes("?") ? "&" : "?"}ws=${encodeURIComponent(id)}`
    : input;
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
