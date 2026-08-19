import Image from "next/image"
import { requireUser } from "@/lib/auth"
import { getAccessibleProjects } from "@/lib/permissions"
import { getStore } from "@/lib/data/store"
import { CatalogSearch } from "@/components/catalog-search"
import type { ResourceWithProject } from "@/components/resource-card"
import { BarChart3, Globe, FolderKanban } from "lucide-react"

export default async function DashboardPage() {
  const user = await requireUser()
  const store = getStore()

  const projects = await getAccessibleProjects(user)
  const projectMap = new Map(projects.map((p) => [p.id, p.name]))
  const allowedIds = new Set(projects.map((p) => p.id))

  const resources = (await store.listResources()).filter((r) => allowedIds.has(r.projectId))
  const enriched: ResourceWithProject[] = resources.map((r) => ({
    ...r,
    projectName: projectMap.get(r.projectId) ?? "",
  }))

  const reportCount = enriched.filter((r) => r.type === "report").length
  const siteCount = enriched.filter((r) => r.type === "site").length

  const stats = [
    { label: "Proyectos", value: projects.length, icon: FolderKanban },
    { label: "Reportes", value: reportCount, icon: BarChart3 },
    { label: "Sitios web", value: siteCount, icon: Globe },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Índice central de sitios y reportes disponibles según tus permisos.
          </p>
        </div>
        <div className="flex h-12 w-36 items-center justify-center rounded-lg bg-white p-2 shadow-sm">
          <Image
            src="/logos/Logos_SIIAB nuevo.png"
            alt="SIIAB"
            width={120}
            height={40}
            className="h-full w-auto object-contain"
          />
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-semibold tabular-nums">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <CatalogSearch resources={enriched} />
    </div>
  )
}
