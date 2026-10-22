import { requireUser } from "@/lib/auth"
import { getCatalog } from "@/lib/services/catalog"
import { CatalogSearch } from "@/components/catalog-search"
import { BarChart3, Globe, FolderKanban } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireUser()

  // El catálogo (proyectos, reportes y sitios) proviene del menú autorizado de
  // Keymaster, filtrado por los permisos del usuario del token.
  const { projects, resources } = await getCatalog()

  const reportCount = resources.filter((r) => r.type === "report").length
  const siteCount = resources.filter((r) => r.type === "site").length

  const stats = [
    { label: "Proyectos", value: projects.length, icon: FolderKanban },
    { label: "Reportes", value: reportCount, icon: BarChart3 },
    { label: "Sitios web", value: siteCount, icon: Globe },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Hola, {user.name.split(" ")[0]}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Busca en el catálogo
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground text-pretty">
          Sitios y reportes disponibles según tus permisos.
        </p>
      </header>

      {/* Stats como fila ligera de soporte: separadas por divisores, sin el
          peso de una tarjeta. El dato accionable (los recursos) manda. */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-border py-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="flex items-center gap-2.5">
              <Icon className="size-4 text-accent" />
              <span className="text-lg font-semibold tabular-nums leading-none">
                {s.value}
              </span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          )
        })}
      </div>

      <CatalogSearch resources={resources} />
    </div>
  )
}
