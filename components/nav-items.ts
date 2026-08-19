import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Inbox,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Coincidencia exacta para marcar activo (por defecto usa prefijo). */
  exact?: boolean
}

export function buildNavItems(opts: {
  canApprove: boolean
  isAdmin: boolean
}): NavItem[] {
  const items: NavItem[] = [
    { href: "/", label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: "/projects", label: "Proyectos", icon: FolderKanban },
    { href: "/vacations", label: "Vacaciones", icon: CalendarDays, exact: true },
  ]

  if (opts.canApprove) {
    items.push({ href: "/vacations/inbox", label: "Aprobaciones", icon: Inbox })
  }

  if (opts.isAdmin) {
    items.push({ href: "/admin", label: "Administración", icon: Settings })
  }

  return items
}
