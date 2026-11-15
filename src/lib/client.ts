/* Utilidades del navegador: espacio de trabajo, peticiones y eventos de Oposita */

const WS_KEY = "oposita-workspace";
const COOKIE = "oposita_ws";
const VALID = /^[A-Za-z0-9_-]{8,128}$/;

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  } catch {
    /* sin contexto seguro */
  }
  return Array.from({ length: 5 }, () => Math.random().toString(36).slice(2, 10).padEnd(8, "0")).join("");
}

function readLocal(): string | null {
  try {
    return window.localStorage.getItem(WS_KEY);
  } catch {
    return null;
  }
}

function readSession(): string | null {
  try {
    return window.sessionStorage.getItem(WS_KEY);
  } catch {
    return null;
  }
}

function readCookie(): string | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function persist(id: string) {
  try {
    window.localStorage.setItem(WS_KEY, id);
  } catch {
    /* almacenamiento bloqueado */
  }
  try {
    window.sessionStorage.setItem(WS_KEY, id);
  } catch {
    /* almacenamiento bloqueado */
  }
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  } catch {
    /* cookies bloqueadas */
  }
}

/** Lectura/escritura segura: si el navegador bloquea el almacenamiento no se rompe nada. */
export function storageGet(key: string, session = false): string | null {
  try {
    return (session ? window.sessionStorage : window.localStorage).getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string, session = false): void {
  try {
    (session ? window.sessionStorage : window.localStorage).setItem(key, value);
  } catch {
    /* almacenamiento bloqueado */
  }
}

let memoryId: string | null = null;

/** Id del espacio de estudio de este navegador. Nunca falla: si no hay almacenamiento, vive en memoria. */
export function getWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  if (memoryId && VALID.test(memoryId)) return memoryId;
  const found = [readLocal(), readCookie(), readSession()].find((v) => v && VALID.test(v)) ?? null;
  const id = found ?? randomId();
  memoryId = id;
  persist(id);
  return id;
}

export function setWorkspaceId(id: string): boolean {
  if (!VALID.test(id)) return false;
  memoryId = id;
  persist(id);
  return true;
}

/** Añade ?ws=<id> a la URL: viaja aunque algún intermediario descarte cabeceras personalizadas. */
export function withWs(input: string): string {
  const id = getWorkspaceId();
  const hash = input.indexOf("#");
  const base = hash >= 0 ? input.slice(0, hash) : input;
  const tail = hash >= 0 ? input.slice(hash) : "";
  return `${base}${base.includes("?") ? "&" : "?"}ws=${encodeURIComponent(id)}${tail}`;
}

/** fetch que identifica tu espacio de estudio por cabecera, parámetro de URL y cookie. */
export function wsFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-workspace-id", getWorkspaceId());
  return fetch(withWs(input), { ...init, headers, cache: "no-store", credentials: "same-origin" });
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
  let res: Response;
  try {
    res = await wsFetch(input, { ...rest, headers, body });
  } catch {
    throw new Error("No he podido conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* sin cuerpo */
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error;
    throw new Error(msg || `Algo ha fallado (código ${res.status}). Inténtalo de nuevo.`);
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
