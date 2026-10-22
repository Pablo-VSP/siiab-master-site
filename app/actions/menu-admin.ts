"use server"

import { revalidatePath } from "next/cache"
import { requireRole, getToken } from "@/lib/auth"
import {
  createResource,
  patchResource,
  deleteResource,
  type MenuPerfil,
  type MenuMenu,
  type MenuOptionRow,
  type SecurityUser,
  type MenuBuild,
  type MenuPerfilUser,
} from "@/lib/services/keymaster-crud"

// -----------------------------------------------------------------------------
// Server Actions para la administración del menú vía Keymaster.
//
// Todas exigen rol admin. Los recursos protegidos (menu_build, menu_perfil_user)
// reciben el JWT de Gatekeeper reenviado a Keymaster.
// -----------------------------------------------------------------------------

export interface ActionResult {
  ok: boolean
  error?: string
}

const BASE = "/admin/configuracion"

function revalidateAll() {
  revalidatePath(BASE)
  revalidatePath(`${BASE}/menus`)
  revalidatePath(`${BASE}/submenus`)
  revalidatePath(`${BASE}/opciones`)
  revalidatePath(`${BASE}/usuarios`)
  revalidatePath(`${BASE}/menu-usuario`)
  revalidatePath(`${BASE}/menu-build`)
}

/** Toma el primer mensaje de error de un resultado de escritura. */
function errMsg(r: { error?: string }): string {
  return r.error ?? "Error inesperado."
}

// =============================================================================
// menu_perfil  (/api/menus)  — pantalla "Menús"
// =============================================================================

export async function createMenuPerfil(input: {
  name: string
  active: number
}): Promise<ActionResult> {
  await requireRole("admin")
  const r = await createResource<MenuPerfil>("menu_perfil", [
    { name: input.name, active: input.active },
  ])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function updateMenuPerfil(
  pk_id: number,
  input: { name?: string; active?: number },
): Promise<ActionResult> {
  await requireRole("admin")
  const r = await patchResource<MenuPerfil>("menu_perfil", [{ pk_id, ...input }])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function deleteMenuPerfil(pk_id: number): Promise<ActionResult> {
  await requireRole("admin")
  const r = await deleteResource<MenuPerfil>("menu_perfil", [pk_id])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

// =============================================================================
// menu_menu  (/api/menumenu)  — pantalla "Submenús"
// =============================================================================

export async function createMenuMenu(input: {
  name: string
  active: number
  icon_name: string | null
}): Promise<ActionResult> {
  await requireRole("admin")
  const r = await createResource<MenuMenu>("menu_menu", [input])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function updateMenuMenu(
  pk_id: number,
  input: { name?: string; active?: number; icon_name?: string | null },
): Promise<ActionResult> {
  await requireRole("admin")
  const r = await patchResource<MenuMenu>("menu_menu", [{ pk_id, ...input }])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function deleteMenuMenu(pk_id: number): Promise<ActionResult> {
  await requireRole("admin")
  const r = await deleteResource<MenuMenu>("menu_menu", [pk_id])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

// =============================================================================
// menu_option  (/api/menuoption)  — pantalla "Opciones de Menú"
// =============================================================================

export interface MenuOptionInput {
  name: string
  description: string | null
  url: string | null
  command: string | null
  img: string | null
  img_small: string | null
  icon_name: string | null
  external_url: string | null
  active: number
}

export async function createMenuOption(input: MenuOptionInput): Promise<ActionResult> {
  await requireRole("admin")
  const r = await createResource<MenuOptionRow>("menu_option", [{ ...input }])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function updateMenuOption(
  pk_id: number,
  input: Partial<MenuOptionInput>,
): Promise<ActionResult> {
  await requireRole("admin")
  const r = await patchResource<MenuOptionRow>("menu_option", [{ pk_id, ...input }])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function deleteMenuOption(pk_id: number): Promise<ActionResult> {
  await requireRole("admin")
  const r = await deleteResource<MenuOptionRow>("menu_option", [pk_id])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

// =============================================================================
// user  (/api/securityuser)  — pantalla "Usuarios"
// =============================================================================

export interface SecurityUserInput {
  login: string
  password?: string
  name: string
  last_name: string | null
  email: string | null
  cell_phone: string | null
  active: number
}

export async function createSecurityUser(input: SecurityUserInput): Promise<ActionResult> {
  await requireRole("admin")
  if (!input.login || !input.password) {
    return { ok: false, error: "Login y contraseña son obligatorios." }
  }
  const r = await createResource<SecurityUser>("user", [{ ...input }])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function updateSecurityUser(
  pk_id: number,
  input: Partial<SecurityUserInput>,
): Promise<ActionResult> {
  await requireRole("admin")
  // Si no se cambia la contraseña, no la enviamos (evita re-hash con vacío).
  const payload: Record<string, unknown> = { pk_id, ...input }
  if (!input.password) delete payload.password
  const r = await patchResource<SecurityUser>("user", [payload])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function deleteSecurityUser(pk_id: number): Promise<ActionResult> {
  await requireRole("admin")
  const r = await deleteResource<SecurityUser>("user", [pk_id])
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

// =============================================================================
// menu_perfil_user  (/api/menuuser)  — "Menú por Usuario" + "Perfiles del usuario"
// =============================================================================

export async function createMenuPerfilUser(input: {
  security_user_id: number
  menu_id: number
  active: number
}): Promise<ActionResult> {
  await requireRole("admin")
  const token = await getToken()
  const r = await createResource<MenuPerfilUser>("menu_perfil_user", [input], token)
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function updateMenuPerfilUser(
  pk_id: number,
  input: { security_user_id?: number; menu_id?: number; active?: number },
): Promise<ActionResult> {
  await requireRole("admin")
  const token = await getToken()
  const r = await patchResource<MenuPerfilUser>("menu_perfil_user", [{ pk_id, ...input }], token)
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function deleteMenuPerfilUser(pk_id: number): Promise<ActionResult> {
  await requireRole("admin")
  const token = await getToken()
  const r = await deleteResource<MenuPerfilUser>("menu_perfil_user", [pk_id], token)
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

// =============================================================================
// menu_build  (/api/menubuild)  — pantalla "MenuBuild"
// =============================================================================

export async function createMenuBuild(input: {
  menu_id: number
  menu_menu_id: number
  menu_option_id: number
  sequence: number
  menu_sequence: number
  active: number
}): Promise<ActionResult> {
  await requireRole("admin")
  const token = await getToken()
  const r = await createResource<MenuBuild>("menu_build", [input], token)
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function updateMenuBuild(
  pk_id: number,
  input: { sequence?: number; menu_sequence?: number; active?: number },
): Promise<ActionResult> {
  await requireRole("admin")
  const token = await getToken()
  const r = await patchResource<MenuBuild>("menu_build", [{ pk_id, ...input }], token)
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}

export async function deleteMenuBuild(pk_id: number): Promise<ActionResult> {
  await requireRole("admin")
  const token = await getToken()
  const r = await deleteResource<MenuBuild>("menu_build", [pk_id], token)
  if (!r.ok) return { ok: false, error: errMsg(r) }
  revalidateAll()
  return { ok: true }
}
