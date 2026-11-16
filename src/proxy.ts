import { NextResponse, type NextRequest } from "next/server";

const WS_RE = /^[A-Za-z0-9_-]{8,64}$/;
const COOKIE = "oposita_ws";

/**
 * Todas las rutas /api necesitan un código de espacio de trabajo.
 * Algunos clientes (navegadores en modo privado, despliegues antiguos, proxies)
 * no envían la cabecera x-workspace-id: eso producía "Falta el espacio de trabajo".
 *
 * Aquí lo resolvemos en el servidor, en este orden:
 *   1. cookie oposita_ws válida (manda: es la que persiste entre peticiones)
 *   2. cabecera x-workspace-id válida
 *   3. se genera uno nuevo y se guarda en cookie para las siguientes peticiones
 * y se inyecta como cabecera para que las rutas lo vean siempre.
 *
 * La cookie manda sobre la cabecera a propósito: si un cliente guardó leyes con
 * un código y luego manda otro distinto, así no se "pierden" en otra mesa vacía.
 */
export function proxy(req: NextRequest) {
  const header = req.headers.get("x-workspace-id") ?? "";
  const cookie = req.cookies.get(COOKIE)?.value ?? "";

  const ws = WS_RE.test(cookie) ? cookie : WS_RE.test(header) ? header : crypto.randomUUID().replace(/-/g, "");

  const headers = new Headers(req.headers);
  headers.set("x-workspace-id", ws);
  const res = NextResponse.next({ request: { headers } });

  if (cookie !== ws) {
    res.cookies.set(COOKIE, ws, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
