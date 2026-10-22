import "server-only"
import { cookies } from "next/headers"
import { decodeJwt } from "jose"
import { redirect } from "next/navigation"
import type { RoleName, User } from "./data/types"
import type { Summoner } from "./services/keymaster"

// La sesión se basa en el JWT emitido por Gatekeeper. Nosotros NO firmamos
// tokens: Gatekeeper los emite y Keymaster los valida en cada llamada. Aquí
// solo guardamos el token crudo en una cookie HttpOnly y decodificamos su
// payload (sin verificar firma, ya que no poseemos el secreto de Gatekeeper)
// para conocer identidad y expiración.
//
// NO hay base de datos local: la identidad viene del token y la autorización
// de navegación la impone Keymaster (construye el menú por usuario y valida el
// token en los endpoints protegidos). Por eso aquí nunca tocamos un "store".

const COOKIE_NAME = "portal_session"
const MAX_AGE = 60 * 60 * 8 // 8 horas (respaldo si el token no trae exp)

/** Datos que extraemos del JWT de Gatekeeper. */
export interface SessionPayload {
  /** subject / identificador del usuario en Gatekeeper. */
  subject: string
  username: string
  nombre: string
  apellido: string
  /** Rol, si algún día Gatekeeper lo incluye en los claims. */
  role?: RoleName
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

/** Normaliza un posible rol de los claims a RoleName (o undefined). */
function roleFromClaims(record: Record<string, unknown>): RoleName | undefined {
  const raw = record.role ?? record.rol ?? record.perfil
  const value = typeof raw === "string" ? raw.toLowerCase() : ""
  if (value === "admin" || value === "approver" || value === "employee") {
    return value as RoleName
  }
  return undefined
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

    // Gatekeeper puede anidar la identidad en `entity`.
    const entity =
      record.entity && typeof record.entity === "object"
        ? (record.entity as Record<string, unknown>)
        : {}

    const get = (key: string): string =>
      asString(record[key]) || asString(entity[key])

    return {
      subject: get("sub") || get("username") || get("login") || asString(claims.sub),
      username:
        get("username") || get("login") || get("email") || asString(claims.sub),
      nombre: get("nombre") || get("name") || get("given_name"),
      apellido: get("apellido") || get("last_name") || get("family_name"),
      role: roleFromClaims(record) ?? roleFromClaims(entity),
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

/** Correo canónico del usuario a partir de su login de Gatekeeper. */
function emailFromSession(session: SessionPayload): string {
  return session.username.includes("@")
    ? session.username
    : `${session.username}@portal.local`
}

/**
 * Id local determinista derivado del subject/username del token. Da un id
 * estable para el usuario (vacaciones, etc.) sin tocar ninguna base de datos.
 */
function localIdFromSession(session: SessionPayload): string {
  const key = (session.subject || session.username || emailFromSession(session)).toLowerCase()
  return `u_${key}`
}

/**
 * Construye el `User` de dominio a partir de la sesión de Gatekeeper. No hay
 * persistencia: todo sale del JWT. El rol viene de los claims si existen; si no,
 * por defecto es `employee`. La autorización real de navegación la decide
 * Keymaster, no este rol.
 */
function userFromSession(session: SessionPayload): User {
  const fullName = [session.nombre, session.apellido].filter(Boolean).join(" ").trim()
  return {
    id: localIdFromSession(session),
    name: fullName || session.username,
    email: emailFromSession(session),
    passwordHash: "gatekeeper", // la contraseña vive en Gatekeeper, no aquí
    role: session.role ?? "employee",
    hireDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  }
}

/** Usuario actual derivado del token (sin base de datos). */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  return userFromSession(session)
}

/** Exige sesión válida; si no la hay, redirige a /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

/**
 * Exige sesión válida para rutas de administración. Ya NO compara contra un rol
 * almacenado localmente: la autorización fina la impone Keymaster (qué menús ve
 * el usuario) y los endpoints protegidos exigen el token. Mantiene la firma por
 * compatibilidad con los llamadores; si el token trae un rol en los claims y no
 * coincide, redirige al inicio.
 */
export async function requireRole(...roles: RoleName[]): Promise<User> {
  const user = await requireUser()
  const session = await getSession()
  // Solo bloqueamos si el token EXPLÍCITAMENTE declara un rol que no está en la
  // lista permitida. Sin rol en el token, basta estar autenticado.
  if (session?.role && !roles.includes(session.role)) redirect("/")
  return user
}

export { roleLabels } from "./role-labels"
