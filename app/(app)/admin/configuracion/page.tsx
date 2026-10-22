import Link from "next/link"
import { requireRole } from "@/lib/auth"
import {
  Menu as MenuIcon,
  FolderOpen,
  ListChecks,
  Users,
  KeyRound,
  Blocks,
  ArrowRight,
} from "lucide-react"

export const metadata = { title: "Configuración" }

const PURPLE = "#6b2a6b"

const items = [
  {
    href: "/admin/configuracion/menus",
    title: "Menús",
    description: "Perfiles de menú que se asignan a los usuarios.",
    icon: MenuIcon,
  },
  {
    href: "/admin/configuracion/submenus",
    title: "Submenús",
    description: "Secciones/grupos del menú con su ícono.",
    icon: FolderOpen,
  },
  {
    href: "/admin/configuracion/opciones",
    title: "Opciones de Menú",
    description: "Opciones navegables: nombre, ruta e ícono.",
    icon: ListChecks,
  },
  {
    href: "/admin/configuracion/usuarios",
    title: "Usuarios",
    description: "Cuentas, credenciales y perfiles asignados.",
    icon: Users,
  },
  {
    href: "/admin/configuracion/menu-usuario",
    title: "Menú por Usuario",
    description: "Asignación de perfiles de menú a cada usuario.",
    icon: KeyRound,
  },
  {
    href: "/admin/configuracion/menu-build",
    title: "Construcción del menú",
    description: "Arma cada menú: secciones y opciones por perfil.",
    icon: Blocks,
  },
]

export default async function ConfiguracionPage() {
  await requireRole("admin")

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: PURPLE }}>
          Configuración
        </h1>
        <p className="text-sm text-zinc-500">
          Gestión de menús, opciones, usuarios y sus permisos de navegación.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-[color:var(--p)]"
              style={{ ["--p" as string]: PURPLE }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex size-10 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${PURPLE}1a`, color: PURPLE }}
                >
                  <Icon className="size-5" />
                </span>
                <ArrowRight className="size-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-[color:var(--p)]" />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-800">{item.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
