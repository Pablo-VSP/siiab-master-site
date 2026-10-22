import "server-only"

import { getToken } from "@/lib/auth"
import {
  readResource,
  type MenuPerfil,
  type MenuMenu,
  type MenuOptionRow,
  type SecurityUser,
  type MenuBuild,
  type MenuPerfilUser,
} from "@/lib/services/keymaster-crud"

// -----------------------------------------------------------------------------
// Lectores de datos para las páginas de administración de menús.
// Todas las lecturas traen TODO (page_size=0) porque las pantallas pagina en
// cliente o muestran listas completas. Si Keymaster no responde, devuelven [].
// -----------------------------------------------------------------------------

export async function loadMenuPerfiles(): Promise<MenuPerfil[]> {
  const r = await readResource<MenuPerfil>("menu_perfil", {
    page_size: 0,
    columns_order: "pk_id",
    columns_sort: "asc",
  })
  return r.ok ? r.data : []
}

export async function loadMenuMenus(): Promise<MenuMenu[]> {
  const r = await readResource<MenuMenu>("menu_menu", {
    page_size: 0,
    columns_order: "name",
    columns_sort: "asc",
  })
  return r.ok ? r.data : []
}

export async function loadMenuOptions(): Promise<MenuOptionRow[]> {
  const r = await readResource<MenuOptionRow>("menu_option", {
    page_size: 0,
    columns_order: "name",
    columns_sort: "asc",
  })
  return r.ok ? r.data : []
}

export async function loadSecurityUsers(): Promise<SecurityUser[]> {
  const r = await readResource<SecurityUser>("user", {
    page_size: 0,
    columns_order: "pk_id",
    columns_sort: "asc",
  })
  return r.ok ? r.data : []
}

export async function loadMenuBuilds(): Promise<MenuBuild[]> {
  const token = await getToken()
  const r = await readResource<MenuBuild>(
    "menu_build",
    {
      page_size: 0,
      add_menu_menu: "1",
      add_menu_option: "1",
      add_menus: "1",
      columns_order: "menu_sequence,sequence",
      columns_sort: "asc,asc",
    },
    token,
  )
  return r.ok ? r.data : []
}

export async function loadMenuPerfilUsers(): Promise<MenuPerfilUser[]> {
  const token = await getToken()
  const r = await readResource<MenuPerfilUser>(
    "menu_perfil_user",
    { page_size: 0, add_menus: "1", add_security_user: "1" },
    token,
  )
  return r.ok ? r.data : []
}
