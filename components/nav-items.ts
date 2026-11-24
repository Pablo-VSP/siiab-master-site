import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Inbox,
  Settings,
  BarChart3,
  Globe,
  Users,
  FileText,
  Home,
  Link as LinkIcon,
  Menu as MenuIcon,
  CircleDot,
  type LucideIcon,
} from "lucide-react"
import type { MenuGroup } from "@/lib/services/keymaster"

// Mapa de `icon_name` (Keymaster) -> componente de icono de lucide-react.
// Las claves cubren nombres comunes; si no hay coincidencia se usa un
// fallback neutro.
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  home: Home,
  inicio: Home,
  projects: FolderKanban,
  proyectos: FolderKanban,
  folder: FolderKanban,
  settings: Settings,
  admin: Settings,
  users: Users,
  usuarios: Users,
  chart: BarChart3,
  reportes: BarChart3,
  report: BarChart3,
  reports: BarChart3,
  globe: Globe,
  site: Globe,
  sitios: Globe,
  calendar: CalendarDays,
  vacaciones: CalendarDays,
  inbox: Inbox,
  aprobaciones: Inbox,
  file: FileText,
  link: LinkIcon,
  menu: MenuIcon,
}

export function iconFor(name: string | null | undefined): LucideIcon {
  if (!name) return CircleDot
  return ICONS[name.trim().toLowerCase()] ?? CircleDot
}

/**
 * Ruta de una imagen de `public/logos` a partir del nombre que guarda Keymaster
 * (sin extensión, p. ej. "Logos_PAG" o "Icono_Vista"). Devuelve null si el
 * nombre no es un identificador simple, lo que evita rutas con `/` o `..`.
 */
export function logoSrc(name: string | null | undefined): string | null {
  const clean = name?.trim()
  if (!clean || !/^[A-Za-z0-9_-]+$/.test(clean)) return null
  return `/logos/${clean}.png`
}

/**
 * Imagen de una sección (`menu_menu.icon_name`). Ese campo mezcla dos cosas:
 * claves de ícono lucide ("settings", "home") y nombres de logo ("Logos_PAG").
 * Si la clave es un ícono conocido se usa el ícono; si no, se trata como logo.
 */
export function sectionImageSrc(iconName: string | null | undefined): string | null {
  const clean = iconName?.trim()
  if (!clean || ICONS[clean.toLowerCase()]) return null
  return logoSrc(clean)
}

/** Una opción navegable ya lista para render. */
export interface NavOption {
  key: string
  label: string
  /** Ruta interna (router) cuando no hay external_url. */
  href: string
  /** true => abrir en nueva pestaña (external_url). */
  external: boolean
  icon: LucideIcon
  /** Imagen de `public/logos` (campo `img`); si falta, se usa `icon`. */
  imageSrc: string | null
  /** Campo `command` de Keymaster ("Reporte", "Sitio", "View"...). */
  command: string | null
  description: string | null
}

/** Una sección del menú con sus opciones. */
export interface NavSection {
  key: string
  label: string
  icon: LucideIcon
  /** Logo de `public/logos` (campo `icon_name`); si falta, se usa `icon`. */
  imageSrc: string | null
  options: NavOption[]
}

/**
 * Transforma la respuesta agrupada de Keymaster (`data.menu_menu`) en las
 * secciones/opciones que consume el sidebar. Ignora elementos inactivos y
 * opciones sin destino navegable.
 */
export function buildNavSections(groups: MenuGroup[]): NavSection[] {
  return groups
    .filter((g) => g.active !== 0)
    .map((g) => ({
      key: `menu-${g.pk_id}`,
      label: g.name,
      icon: iconFor(g.icon_name),
      imageSrc: sectionImageSrc(g.icon_name),
      options: g.menu_options
        .filter((o) => o.active !== 0)
        .map((o) => {
          const external = Boolean(o.external_url)
          const href = external ? (o.external_url as string) : o.url ?? ""
          return {
            key: `option-${o.pk_id}`,
            label: o.name,
            href,
            external,
            icon: iconFor(o.icon_name),
            imageSrc: logoSrc(o.img),
            command: o.command,
            description: o.description,
          }
        })
        .filter((o) => o.href.length > 0),
    }))
    .filter((s) => s.options.length > 0)
}
