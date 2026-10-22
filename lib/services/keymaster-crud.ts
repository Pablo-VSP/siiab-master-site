import "server-only"

// -----------------------------------------------------------------------------
// Cliente CRUD genérico de Keymaster.
//
// Keymaster expone 6 recursos con el MISMO contrato de métodos (ver
// "Contrato Keymaster → Frontend"). Este módulo centraliza las 4 operaciones
// (read / create / patch / delete) para cualquiera de ellos y normaliza las
// respuestas a una forma única `{ ok, data?, error?, pagination? }`.
//
// - Recursos SIN token: menu_perfil, menu_menu, menu_option, user.
// - Recursos CON token: menu_build, menu_perfil_user (se pasa el JWT crudo).
//
// La URL base se configura con KEYMASTER_URL (dev: http://localhost:3002).
// -----------------------------------------------------------------------------

const KEYMASTER_URL = process.env.KEYMASTER_URL ?? "http://localhost:3002"

// ---- Tipos de dominio (según campos del contrato) ----

export interface MenuPerfil {
  pk_id: number
  name: string
  active: number
}

export interface MenuMenu {
  pk_id: number
  name: string
  active: number
  icon_name: string | null
}

export interface MenuOptionRow {
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

export interface SecurityUser {
  pk_id: number
  login: string
  password?: string | null
  name: string
  last_name: string | null
  email: string | null
  cell_phone: string | null
  active: number
}

export interface MenuBuild {
  pk_id: number
  menu_id: number
  menu_menu_id: number
  menu_option_id: number
  sequence: number
  active: number
  menu_sequence: number
  // relaciones incrustables (flags add_*)
  menu_menu?: MenuMenu
  menu_option?: MenuOptionRow
  menus?: MenuPerfil
}

export interface MenuPerfilUser {
  pk_id: number
  security_user_id: number
  menu_id: number
  active: number
  // relaciones incrustables
  menus?: MenuPerfil
  security_user?: SecurityUser
}

export interface Pagination {
  page_size: number
  page_number: number
  total_rows: number
  total_pages: number
  page_row_first: number
  page_row_last: number
}

// ---- Resultado normalizado ----

export type ReadResult<T> =
  | { ok: true; data: T[]; pagination?: Pagination }
  | { ok: false; error: string; status?: number; unauthorized?: boolean }

export type WriteResult<T> =
  | { ok: true; data: T[]; partial?: boolean }
  | { ok: false; error: string; status?: number; unauthorized?: boolean }

// ---- Definición de recursos ----

export type ResourceName =
  | "menu_perfil"
  | "menu_menu"
  | "menu_option"
  | "user"
  | "menu_build"
  | "menu_perfil_user"

interface ResourceConfig {
  base: string
  requiresToken: boolean
}

const RESOURCES: Record<ResourceName, ResourceConfig> = {
  menu_perfil: { base: "/api/menus", requiresToken: false },
  menu_menu: { base: "/api/menumenu", requiresToken: false },
  menu_option: { base: "/api/menuoption", requiresToken: false },
  user: { base: "/api/securityuser", requiresToken: false },
  menu_build: { base: "/api/menubuild", requiresToken: true },
  menu_perfil_user: { base: "/api/menuuser", requiresToken: true },
}

// ---- Helpers internos ----

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function networkError(): { ok: false; error: string } {
  return { ok: false, error: "No se pudo contactar el servicio de menús." }
}

function unauthorized(): { ok: false; error: string; status: number; unauthorized: true } {
  return {
    ok: false,
    error: "Sesión expirada o inválida.",
    status: 401,
    unauthorized: true,
  }
}

/**
 * Tamaño de página que usamos para "traer todo". El contrato define
 * `page_size=0` como "sin paginar", pero la implementación actual de Keymaster
 * divide entre `page_size` para calcular el total de páginas y revienta con
 * `division by zero` (HTTP 500) si recibe 0. Por eso traducimos 0 a este tope
 * alto en vez de enviarlo tal cual.
 */
const PAGE_SIZE_ALL = 100000

/** Lectura con filtros / paginación por query params. */
export async function readResource<T>(
  resource: ResourceName,
  params: Record<string, string | number | undefined> = {},
  token?: string | null,
): Promise<ReadResult<T>> {
  const cfg = RESOURCES[resource]
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    // Evita el 500 por división entre cero: 0 ("traer todo") => tope alto.
    if (k === "page_size" && Number(v) === 0) {
      qs.set(k, String(PAGE_SIZE_ALL))
      continue
    }
    qs.set(k, String(v))
  }
  const query = qs.toString()

  let res: Response
  try {
    res = await fetch(`${KEYMASTER_URL}${cfg.base}${query ? `?${query}` : ""}`, {
      method: "GET",
      headers: { ...authHeaders(token) },
      cache: "no-store",
    })
  } catch (err) {
    console.error(`[keymaster:${resource}] red:`, err)
    return networkError()
  }

  if (res.status === 401) return unauthorized()
  if (!res.ok) {
    return { ok: false, error: "Error al leer datos.", status: res.status }
  }

  try {
    const body = (await res.json()) as { data?: T[]; pagination?: Pagination }
    return { ok: true, data: body?.data ?? [], pagination: body?.pagination }
  } catch {
    return { ok: false, error: "Respuesta inválida del servicio." }
  }
}

/** Create: array de objetos (sin pk_id). */
export async function createResource<T>(
  resource: ResourceName,
  items: Array<Record<string, unknown>>,
  token?: string | null,
): Promise<WriteResult<T>> {
  return mutate<T>(resource, "POST", items, token)
}

/** Patch: array de objetos con pk_id + campos a cambiar. */
export async function patchResource<T>(
  resource: ResourceName,
  items: Array<Record<string, unknown>>,
  token?: string | null,
): Promise<WriteResult<T>> {
  return mutate<T>(resource, "PATCH", items, token)
}

/** Delete: array de PKs. */
export async function deleteResource<T>(
  resource: ResourceName,
  ids: number[],
  token?: string | null,
): Promise<WriteResult<T>> {
  return mutate<T>(resource, "DELETE", ids, token)
}

async function mutate<T>(
  resource: ResourceName,
  method: "POST" | "PATCH" | "DELETE",
  body: unknown,
  token?: string | null,
): Promise<WriteResult<T>> {
  const cfg = RESOURCES[resource]

  let res: Response
  try {
    res = await fetch(`${KEYMASTER_URL}${cfg.base}`, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(body),
      cache: "no-store",
    })
  } catch (err) {
    console.error(`[keymaster:${resource}] red:`, err)
    return networkError()
  }

  if (res.status === 401) return unauthorized()

  // 200 (create/read), 202 (patch/delete) = éxito; 200 + PARTIALLY_APPLIED = parcial.
  if (res.status !== 200 && res.status !== 202) {
    let msg = "No se pudo completar la operación."
    try {
      const err = (await res.json()) as { message?: string; error?: string }
      msg = err?.message ?? err?.error ?? msg
    } catch {
      /* noop */
    }
    return { ok: false, error: msg, status: res.status }
  }

  const statusHeader = res.headers.get("STATUS") ?? ""
  const partial = statusHeader === "PARTIALLY_APPLIED"

  try {
    const parsed = (await res.json()) as { data?: T[] }
    return { ok: true, data: parsed?.data ?? [], partial }
  } catch {
    // Algunas respuestas de delete pueden no traer cuerpo JSON.
    return { ok: true, data: [], partial }
  }
}
