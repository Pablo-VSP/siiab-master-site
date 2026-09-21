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

/** Una opción navegable ya lista para render. */
export interface NavOption {
  key: string
  label: string
  /** Ruta interna (router) cuando no hay external_url. */
  href: string
  /** true => abrir en nueva pestaña (external_url). */
  external: boolean
  icon: LucideIcon
  description: string | null
}

/** Una sección del menú con sus opciones. */
export interface NavSection {
  key: string
  label: string
  icon: LucideIcon
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
            description: o.description,
          }
        })
        .filter((o) => o.href.length > 0),
    }))
    .filter((s) => s.options.length > 0)
}
