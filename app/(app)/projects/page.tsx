import Link from "next/link"
import Image from "next/image"
import { requireUser } from "@/lib/auth"
import { getAccessibleProjects } from "@/lib/permissions"
import { getStore } from "@/lib/data/store"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ArrowRight, BarChart3, FolderKanban, Globe } from "lucide-react"

export default async function ProjectsPage() {
  const user = await requireUser()
  const store = getStore()
  const projects = await getAccessibleProjects(user)
  const resources = await store.listResources()

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
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Proyectos</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Cada proyecto agrupa sus reportes de Looker Studio y sitios web.
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
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="group">
                <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/50">
                  {p.logoUrl ? (
                    <div className="flex items-center justify-center bg-muted/40 px-6 py-8">
                      <Image
                        src={p.logoUrl}
                        alt={`Logo de ${p.name}`}
                        width={200}
                        height={120}
                        className="h-24 w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center bg-muted/40 px-6 py-8">
                      <FolderKanban className="size-16 text-muted-foreground/40" />
                    </div>
                  )}
                  <CardHeader className="pt-4">
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      <span className="text-balance">{p.name}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </CardTitle>
                    <CardDescription className="text-pretty">{p.description}</CardDescription>
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
