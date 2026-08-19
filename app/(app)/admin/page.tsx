import Link from "next/link"
import { requireRole } from "@/lib/auth"
import { getStore } from "@/lib/data/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderKanban, Shield, ArrowRight } from "lucide-react"

export default async function AdminPage() {
  await requireRole("admin")
  const store = getStore()

  const [users, projects, permissions] = await Promise.all([
    store.listUsers(),
    store.listProjects(),
    store.listPermissions(),
  ])

  const sections = [
    {
      href: "/admin/users",
      title: "Usuarios",
      description: "Gestionar cuentas de usuario, roles y contraseñas.",
      icon: Users,
      count: users.length,
    },
    {
      href: "/admin/projects",
      title: "Proyectos y Recursos",
      description: "Administrar proyectos, reportes y sitios web del catálogo.",
      icon: FolderKanban,
      count: projects.length,
    },
    {
      href: "/admin/permissions",
      title: "Permisos",
      description: "Asignar acceso a proyectos por usuario.",
      icon: Shield,
      count: permissions.length,
    },
  ]

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Panel de gestión del portal. Solo visible para administradores.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span>{s.title}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold tabular-nums">{s.count}</span>
                  <span className="ml-1 text-xs text-muted-foreground">registros</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
