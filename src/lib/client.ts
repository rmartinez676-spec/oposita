/* Utilidades del navegador: espacio de trabajo, peticiones y eventos de Oposita */

const WS_KEY = "oposita-workspace";
const WS_COOKIE = "oposita_ws";
const WS_RE = /^[A-Za-z0-9_-]{8,64}$/;

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  } catch {
    /* sin contexto seguro */
  }
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
}

function readCookie(): string | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${WS_COOKIE}=([A-Za-z0-9_-]{8,64})`));
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function persist(id: string) {
  // Guardamos el código en varios sitios: si el navegador borra uno, no se "pierde" tu mesa.
  try {
    window.localStorage.setItem(WS_KEY, id);
  } catch {
    /* modo privado / bloqueado */
  }
  try {
    window.sessionStorage.setItem(WS_KEY, id);
  } catch {
    /* ignorar */
  }
  try {
    document.cookie = `${WS_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* ignorar */
  }
}

export function getWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  // La cookie manda: es la misma que usa el servidor, así la mesa y las subidas
  // siempre caen en el mismo espacio aunque localStorage tenga un código viejo.
  let id: string | null = readCookie();
  if (!id || !WS_RE.test(id)) {
    try {
      id = window.localStorage.getItem(WS_KEY);
    } catch {
      /* ignorar */
    }
  }
  if (!id || !WS_RE.test(id)) {
    try {
      id = window.sessionStorage.getItem(WS_KEY);
    } catch {
      /* ignorar */
    }
  }
  if (!id || !WS_RE.test(id)) id = randomId();
  persist(id);
  return id;
}

export function setWorkspaceId(id: string): boolean {
  if (!WS_RE.test(id)) return false;
  persist(id);
  return true;
}

/** fetch con la cabecera del espacio de trabajo. */
export function wsFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-workspace-id", getWorkspaceId());
  return fetch(input, { ...init, headers, cache: "no-store" });
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
    throw new Error("No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.");
  }

  const contentType = res.headers.get("content-type") ?? "";
  let data: unknown = null;
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      /* cuerpo vacío */
    }
  }

  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error;
    if (msg) throw new Error(msg);
    if ((res.status === 401 || res.status === 403) && !contentType.includes("json")) {
      throw new Error(
        "Vercel está bloqueando la API con su protección de despliegue. En Vercel → Settings → Deployment Protection, desactiva «Vercel Authentication» para producción.",
      );
    }
    if (res.status === 504 || res.status === 508) {
      throw new Error("El servidor tardó demasiado (límite de tiempo de Vercel). Prueba con una ley más corta o súbela como PDF.");
    }
    throw new Error(`El servidor respondió ${res.status}. Inténtalo de nuevo en unos segundos.`);
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
