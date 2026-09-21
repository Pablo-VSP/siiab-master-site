import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decodeJwt } from "jose"

// Next.js 16 renombró la convención "middleware" a "proxy": el archivo debe
// llamarse proxy.ts y exportar una función `proxy`. La lógica es la misma.

const COOKIE_NAME = "portal_session"

// Rutas publicas que no requieren sesion.
const PUBLIC_PATHS = ["/login", "/logout"]

/**
 * Comprueba que la cookie contiene un JWT (de Gatekeeper) no expirado.
 *
 * IMPORTANTE: aquí NO verificamos la firma porque el token lo emite Gatekeeper
 * con su propio secreto, que el frontend no posee. La verificación real de la
 * firma la hace Keymaster en cada llamada protegida. El proxy solo evita
 * navegar a rutas privadas sin una sesión presente y vigente.
 */
function hasValidSession(token: string | undefined): boolean {
  if (!token) return false
  try {
    const claims = decodeJwt(token)
    if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

  const token = request.cookies.get(COOKIE_NAME)?.value
  const valid = hasValidSession(token)

  // Sin sesion en ruta privada -> a login.
  if (!isPublic && !valid) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Con sesion en /login -> al inicio. (/logout siempre debe poder ejecutarse
  // para limpiar la cookie, así que se excluye de este rebote.)
  if (isPublic && valid && pathname !== "/logout") {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Aplica a todo excepto assets estaticos y api internos de next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)"],
}
