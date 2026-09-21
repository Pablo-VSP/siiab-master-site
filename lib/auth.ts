import "server-only"
import { cookies } from "next/headers"
import { decodeJwt } from "jose"
import { redirect } from "next/navigation"
import { getStore } from "./data/store"
import type { RoleName, User } from "./data/types"
import type { Summoner } from "./services/keymaster"

// La sesión se basa en el JWT emitido por Gatekeeper. Nosotros NO firmamos
// tokens: Gatekeeper los emite y Keymaster los valida en cada llamada. Aquí
// solo guardamos el token crudo en una cookie HttpOnly y decodificamos su
// payload (sin verificar firma, ya que no poseemos el secreto de Gatekeeper)
// para conocer identidad y expiración.

const COOKIE_NAME = "portal_session"
const MAX_AGE = 60 * 60 * 8 // 8 horas (respaldo si el token no trae exp)

/** Datos que extraemos del JWT de Gatekeeper. */
export interface SessionPayload {
  /** subject / identificador del usuario en Gatekeeper. */
  subject: string
  username: string
  nombre: string
  apellido: string
  /** Expiración en segundos epoch, si el token la trae. */
  exp?: number
}

/**
 * Guarda el JWT de Gatekeeper en la cookie de sesión.
 * La expiración de la cookie se alinea con el `exp` del token si existe.
 */
export async function createSessionFromToken(token: string): Promise<void> {
  let maxAge = MAX_AGE
  try {
    const claims = decodeJwt(token)
    if (typeof claims.exp === "number") {
      const secondsLeft = claims.exp - Math.floor(Date.now() / 1000)
      if (secondsLeft > 0) maxAge = secondsLeft
    }
  } catch {
    // Token no decodificable: usamos el MAX_AGE por defecto.
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/** Devuelve el JWT crudo de la cookie para reenviarlo a Keymaster. */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

/** Decodifica el payload del token de sesión (sin verificar firma). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = await getToken()
  if (!token) return null
  try {
    const claims = decodeJwt(token)

    // Rechazamos tokens expirados localmente para evitar loops innecesarios.
    if (typeof claims.exp === "number" && claims.exp * 1000 < Date.now()) {
      return null
    }

    const record = claims as Record<string, unknown>
    const asString = (v: unknown): string => (typeof v === "string" ? v : "")

    return {
      subject: asString(claims.sub) || asString(record.username) || asString(record.login),
      username:
        asString(record.username) ||
        asString(record.login) ||
        asString(record.email) ||
        asString(claims.sub),
      nombre: asString(record.nombre) || asString(record.name) || asString(record.given_name),
      apellido: asString(record.apellido) || asString(record.last_name) || asString(record.family_name),
      exp: typeof claims.exp === "number" ? claims.exp : undefined,
    }
  } catch {
    return null
  }
}

/** Datos de saludo del usuario, tal como los expone Gatekeeper/Keymaster. */
export async function getSummoner(): Promise<Summoner | null> {
  const session = await getSession()
  if (!session) return null
  return { nombre: session.nombre, apellido: session.apellido }
}

/**
 * Sincroniza (crea o actualiza) un usuario local a partir de la sesión de
 * Gatekeeper, de modo que el resto de la app (vacaciones, permisos, admin)
 * siga operando sobre el store. El correo/login proviene del token.
 */
async function syncUserFromSession(session: SessionPayload): Promise<User> {
  const store = getStore()
  const email = session.username.includes("@")
    ? session.username
    : `${session.username}@portal.local`

  const existing = await store.getUserByEmail(email)
  const fullName = [session.nombre, session.apellido].filter(Boolean).join(" ").trim()

  if (existing) {
    if (fullName && existing.name !== fullName) {
      const updated = await store.updateUser(existing.id, { name: fullName })
      return updated ?? existing
    }
    return existing
  }

  // Usuario nuevo autenticado por Gatekeeper. El rol por defecto es employee;
  // un admin puede elevarlo desde el panel de administración.
  return store.createUser({
    name: fullName || session.username,
    email,
    passwordHash: "gatekeeper", // la contraseña vive en Gatekeeper, no aquí
    role: "employee",
    hireDate: new Date().toISOString().slice(0, 10),
  })
}

/** Devuelve el usuario actual (sincronizado con la sesión de Gatekeeper). */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  return syncUserFromSession(session)
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

export { roleLabels } from "./role-labels"
