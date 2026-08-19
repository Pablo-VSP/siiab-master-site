import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { getStore } from "./data/store"
import type { RoleName, User } from "./data/types"

const COOKIE_NAME = "portal_session"
const MAX_AGE = 60 * 60 * 8 // 8 horas

// Secreto de firma. En produccion define PORTAL_SESSION_SECRET.
// Para desarrollo se usa un fallback (no usar en produccion real).
function getSecret(): Uint8Array {
  const secret =
    process.env.PORTAL_SESSION_SECRET ??
    "dev-only-insecure-secret-change-me-please-32b"
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  userId: string
  role: RoleName
  name: string
}

export async function createSession(user: User): Promise<void> {
  const token = await new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      userId: payload.sub as string,
      role: payload.role as RoleName,
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

/** Devuelve el usuario actual desde el store, o null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  return getStore().getUserById(session.userId)
}

/** Exige sesion valida; si no la hay, redirige a /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/** Exige uno de los roles indicados; si no cumple, redirige al inicio. */
export async function requireRole(...roles: RoleName[]): Promise<User> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect("/")
  return user
}

/** Verifica credenciales de demo (formato "plain:password"). */
export function verifyPassword(user: User, password: string): boolean {
  if (user.passwordHash.startsWith("plain:")) {
    return user.passwordHash.slice("plain:".length) === password
  }
  return false
}

export { roleLabels } from "./role-labels"
