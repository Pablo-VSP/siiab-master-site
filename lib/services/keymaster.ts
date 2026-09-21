import "server-only"

// Cliente del servicio Keymaster.
// Keymaster NO emite tokens: consume el JWT de Gatekeeper (Bearer) y devuelve
// el menú ya agrupado y filtrado por los permisos del usuario del token.
//
// En desarrollo corre en http://localhost:3002. La URL base se configura con
// KEYMASTER_URL.

const KEYMASTER_URL = process.env.KEYMASTER_URL ?? "http://localhost:3002"

// ---- Tipos del contrato (GET /api/menubuild/authorized-grouped) ----

export interface MenuOption {
  pk_id: number
  name: string
  description: string | null
  url: string | null
  command: string | null
  img: string | null
  img_small: string | null
  active: number
  icon_name: string | null
  external_url: string | null
}

export interface MenuGroup {
  pk_id: number
  name: string
  active: number
  icon_name: string | null
  menu_options: MenuOption[]
}

export interface Summoner {
  nombre: string
  apellido: string
}

export interface AuthorizedGroupedResponse {
  data: {
    menu_menu: MenuGroup[]
  }
  summoner: Summoner
}

export type MenuResult =
  | { ok: true; groups: MenuGroup[]; summoner: Summoner }
  | { ok: false; error: string; status?: number; unauthorized?: boolean }

/**
 * Obtiene el menú autorizado y agrupado del usuario dueño del token.
 *
 * IMPORTANTE (según el contrato): este endpoint responde con la estructura
 * agrupada solo cuando la petición NO trae body JSON. Se envía como GET simple
 * con el header Authorization y, opcionalmente, ?menu_id=<id>.
 */
export async function fetchAuthorizedMenu(
  token: string,
  menuId?: number,
): Promise<MenuResult> {
  const qs = typeof menuId === "number" ? `?menu_id=${menuId}` : ""

  let res: Response
  try {
    res = await fetch(`${KEYMASTER_URL}/api/menubuild/authorized-grouped${qs}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
  } catch (err) {
    console.error("[keymaster] Error de red:", err)
    return { ok: false, error: "No se pudo contactar el servicio de menús." }
  }

  if (res.status === 401) {
    return {
      ok: false,
      error: "Sesión expirada o inválida.",
      status: 401,
      unauthorized: true,
    }
  }

  if (!res.ok) {
    return {
      ok: false,
      error: "Error al obtener el menú.",
      status: res.status,
    }
  }

  try {
    const body = (await res.json()) as AuthorizedGroupedResponse
    const groups = body?.data?.menu_menu ?? []
    const summoner = body?.summoner ?? { nombre: "", apellido: "" }
    return { ok: true, groups, summoner }
  } catch (err) {
    console.error("[keymaster] Respuesta inválida:", err)
    return { ok: false, error: "Respuesta inválida del servicio de menús." }
  }
}
