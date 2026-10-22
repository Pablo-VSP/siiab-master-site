import "server-only"

import { getToken } from "@/lib/auth"
import { fetchAuthorizedMenu, type MenuGroup, type MenuOption } from "@/lib/services/keymaster"
import type { Resource, ResourceType } from "@/lib/data/types"

// -----------------------------------------------------------------------------
// Catálogo derivado de Keymaster.
//
// El catálogo de "proyectos", "reportes" y "sitios" NO vive en la base de datos
// local: se deriva del menú autorizado que expone Keymaster
// (`GET /api/menubuild/authorized-grouped`). El mapeo es:
//
//   menu_menu (grupo)   -> Proyecto / sección del catálogo
//   menu_option (opción)-> Recurso navegable
//       - con external_url  -> "site"   (se abre en nueva pestaña)
//       - con url absoluta   -> "report" (se embebe en iframe)
//
// IMPORTANTE: el menú de Keymaster mezcla dos cosas:
//   1) grupos de NAVEGACIÓN de la app (Inicio, Proyectos, Vacaciones,
//      Aprobaciones, Administración) cuyas opciones son rutas internas
//      (`/`, `/projects`, `/admin`, ...). Estos alimentan el sidebar, NO el
//      catálogo.
//   2) grupos de RECURSOS reales (Reportes, Sitios) cuyas opciones apuntan a
//      destinos externos/embebibles. SOLO estos forman el catálogo.
//
// La regla para distinguirlos: una opción es un recurso del catálogo si tiene
// `external_url` o una `url` ABSOLUTA (http...). Las opciones con `url` interna
// (que empieza con "/") son navegación y se excluyen del catálogo. Un grupo
// entra al catálogo solo si contiene al menos un recurso.
// -----------------------------------------------------------------------------

/** Proyecto del catálogo (deriva de un grupo `menu_menu`). */
export interface CatalogProject {
  id: string
  name: string
  description: string
  iconName: string | null
}

/** Recurso del catálogo con el nombre de su proyecto, listo para la UI. */
export interface CatalogResource extends Resource {
  projectName: string
}

export interface Catalog {
  projects: CatalogProject[]
  resources: CatalogResource[]
}

/** Id estable de proyecto a partir del grupo de menú. */
function projectIdFromGroup(group: MenuGroup): string {
  return `g_${group.pk_id}`
}

/** True si la url es un destino absoluto/externo (http...), no una ruta interna. */
function isAbsoluteUrl(url: string | null | undefined): boolean {
  return /^https?:\/\//i.test((url ?? "").trim())
}

/**
 * Decide el tipo de recurso. La señal fiable en los datos de Keymaster es
 * `icon_name` ("report" | "site"): tanto reportes (Data Studio, embebibles en
 * iframe) como sitios traen su destino en `external_url`, así que la presencia
 * de external_url NO basta para distinguirlos. Si no hay icon_name claro, se usa
 * una heurística: los reportes de Looker/Data Studio son embebibles.
 */
function resourceType(option: MenuOption, target: string): ResourceType {
  const icon = option.icon_name?.trim().toLowerCase()
  if (icon === "report" || icon === "reporte" || icon === "chart") return "report"
  if (icon === "site" || icon === "sitio" || icon === "globe") return "site"
  // Fallback: URLs de Looker/Data Studio se embeben como reporte.
  if (/datastudio\.google\.com|lookerstudio\.google\.com/i.test(target)) return "report"
  return "site"
}

/**
 * Convierte una opción de menú en recurso del catálogo, o null si la opción es
 * navegación interna de la app (no un recurso).
 *
 * Es recurso si tiene `external_url` o una `url` absoluta (http...). Las
 * opciones con `url` interna ("/...") o sin destino son navegación y se ignoran.
 * El tipo (report/site) se decide con `resourceType` (principalmente icon_name).
 */
function resourceFromOption(
  option: MenuOption,
  project: CatalogProject,
): CatalogResource | null {
  const external = option.external_url?.trim()
  const internal = option.url?.trim()

  const target = external || (isAbsoluteUrl(internal) ? (internal as string) : "")
  if (!target) return null // ruta interna o sin destino: navegación, no catálogo

  return {
    id: `o_${option.pk_id}`,
    projectId: project.id,
    projectName: project.name,
    title: option.name,
    type: resourceType(option, target),
    url: target,
    description: option.description ?? "",
    createdAt: "", // Keymaster no expone fecha; no se usa en la UI del catálogo
  }
}

/**
 * Convierte los grupos de Keymaster en proyectos + recursos del catálogo.
 * Solo incluye grupos que contienen al menos un recurso real (Reportes, Sitios);
 * los grupos de navegación de la app quedan fuera del catálogo.
 */
export function menuToCatalog(groups: MenuGroup[]): Catalog {
  const projects: CatalogProject[] = []
  const resources: CatalogResource[] = []

  for (const group of groups) {
    if (group.active === 0) continue

    const project: CatalogProject = {
      id: projectIdFromGroup(group),
      name: group.name,
      description: "",
      iconName: group.icon_name,
    }

    const groupResources: CatalogResource[] = []
    for (const option of group.menu_options) {
      if (option.active === 0) continue
      const resource = resourceFromOption(option, project)
      if (resource) groupResources.push(resource)
    }

    // Solo es un "proyecto" del catálogo si aporta recursos reales.
    if (groupResources.length === 0) continue

    projects.push(project)
    resources.push(...groupResources)
  }

  return { projects, resources }
}

/**
 * Obtiene el catálogo del usuario actual desde Keymaster. Si no hay token o el
 * servicio no responde, devuelve un catálogo vacío (la UI ya maneja el estado
 * vacío). Nunca lanza: el objetivo es que el render sea resiliente.
 */
export async function getCatalog(): Promise<Catalog> {
  const token = await getToken()
  if (!token) return { projects: [], resources: [] }

  const result = await fetchAuthorizedMenu(token)
  if (!result.ok) return { projects: [], resources: [] }

  return menuToCatalog(result.groups)
}

/** Devuelve un proyecto del catálogo por su id, o null si no existe/accesible. */
export async function getCatalogProject(
  id: string,
): Promise<{ project: CatalogProject; resources: CatalogResource[] } | null> {
  const { projects, resources } = await getCatalog()
  const project = projects.find((p) => p.id === id)
  if (!project) return null
  return { project, resources: resources.filter((r) => r.projectId === id) }
}
