import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "portal_session"

// Ruta de salida por GET. Borra la cookie de sesión y redirige a /login.
// Se usa tanto para el cierre de sesión manual como para romper el ciclo de
// redirecciones cuando Keymaster invalida el token (401): al eliminar la
// cookie, el middleware ya no la considera vigente y no rebota de vuelta.
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = ""

  const res = NextResponse.redirect(url)
  res.cookies.delete(COOKIE_NAME)
  return res
}
