import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { getCatalog } from "@/lib/services/catalog"
import { iconFor } from "@/components/nav-items"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ArrowRight, BarChart3, FolderKanban, Globe } from "lucide-react"

export default async function ProjectsPage() {
  await requireUser()

  // Proyectos (grupos de menú) y recursos vienen de Keymaster.
  const { projects, resources } = await getCatalog()

  const countsByProject = new Map<string, { reports: number; sites: number }>()
  for (const r of resources) {
    const c = countsByProject.get(r.projectId) ?? { reports: 0, sites: 0 }
    if (r.type === "report") c.reports++
    else c.sites++
    countsByProject.set(r.projectId, c)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">
          Proyectos
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Cada proyecto agrupa sus reportes y sitios web disponibles para ti.
        </p>
      </header>

      {projects.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban />
            </EmptyMedia>
            <EmptyTitle>Sin proyectos asignados</EmptyTitle>
            <EmptyDescription>
              Aún no tienes acceso a ningún proyecto. Contacta a un administrador.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const counts = countsByProject.get(p.id) ?? { reports: 0, sites: 0 }
            const Icon = iconFor(p.iconName)
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="group">
                <Card className="h-full overflow-hidden transition-colors group-hover:border-accent">
                  <div className="flex items-center justify-center bg-muted/40 px-6 py-8">
                    <Icon className="size-14 text-muted-foreground/50" />
                  </div>
                  <CardHeader className="pt-4">
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span className="text-balance">{p.name}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent-foreground" />
                    </CardTitle>
                    {p.description ? (
                      <CardDescription className="text-pretty">{p.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Badge variant="default" className="gap-1">
                      <BarChart3 className="size-3" />
                      {counts.reports} reportes
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Globe className="size-3" />
                      {counts.sites} sitios
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
