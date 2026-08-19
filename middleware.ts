import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const COOKIE_NAME = "portal_session"

function getSecret(): Uint8Array {
  const secret =
    process.env.PORTAL_SESSION_SECRET ??
    "dev-only-insecure-secret-change-me-please-32b"
  return new TextEncoder().encode(secret)
}

// Rutas publicas que no requieren sesion.
const PUBLIC_PATHS = ["/login"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))

  const token = request.cookies.get(COOKIE_NAME)?.value
  let valid = false
  if (token) {
    try {
      await jwtVerify(token, getSecret())
      valid = true
    } catch {
      valid = false
    }
  }

  // Sin sesion en ruta privada -> a login.
  if (!isPublic && !valid) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Con sesion en /login -> al inicio.
  if (isPublic && valid) {
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
