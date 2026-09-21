import "server-only"

// Cliente del servicio Gatekeeper.
// Gatekeeper es el emisor de tokens: recibe credenciales y devuelve un JWT
// que luego se reenvía a Keymaster para pintar el menú.
//
// En desarrollo corre en http://localhost:3001. La URL base se configura con
// GATEKEEPER_URL para poder apuntar a otro entorno sin tocar código.

const GATEKEEPER_URL = process.env.GATEKEEPER_URL ?? "http://localhost:3001"

export interface GatekeeperCredentials {
  username: string
  password: string
}

export type GatekeeperResult =
  | { ok: true; token: string }
  | { ok: false; error: string; status?: number }

/**
 * Autentica contra Gatekeeper (`POST /identity`) y devuelve el JWT.
 *
 * El contrato espera `{ "username": "...", "password": "..." }` y responde con
 * un token. Aceptamos varias formas comunes de exponerlo (token / access_token
 * / jwt, o texto plano) para ser tolerantes al formato exacto del servicio.
 */
export async function authenticate(
  creds: GatekeeperCredentials,
): Promise<GatekeeperResult> {
  let res: Response
  try {
    res = await fetch(`${GATEKEEPER_URL}/identity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
      cache: "no-store",
    })
  } catch (err) {
    console.error("[gatekeeper] Error de red:", err)
    return { ok: false, error: "No se pudo contactar el servicio de autenticación." }
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "Credenciales incorrectas.", status: res.status }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: "Error al autenticar. Intenta de nuevo más tarde.",
      status: res.status,
    }
  }

  const token = await extractToken(res)
  if (!token) {
    return { ok: false, error: "El servicio de autenticación no devolvió un token válido." }
  }

  return { ok: true, token }
}

async function extractToken(res: Response): Promise<string | null> {
  const contentType = res.headers.get("content-type") ?? ""

  // Algunos emisores devuelven el token en un header.
  const headerToken =
    res.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null

  if (contentType.includes("application/json")) {
    try {
      const body: unknown = await res.json()
      const fromBody = pickToken(body)
      return fromBody ?? headerToken
    } catch {
      return headerToken
    }
  }

  // Respuesta en texto plano: el cuerpo es el token.
  const text = (await res.text()).trim()
  if (text) return text.replace(/^"|"$/g, "")
  return headerToken
}

function pickToken(body: unknown): string | null {
  if (typeof body === "string") return body || null
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>
    const candidate =
      obj.token ?? obj.access_token ?? obj.accessToken ?? obj.jwt ?? obj.id_token
    if (typeof candidate === "string" && candidate.length > 0) return candidate
    // A veces viene anidado en { data: { token } }.
    if (obj.data && typeof obj.data === "object") {
      return pickToken(obj.data)
    }
  }
  return null
}
