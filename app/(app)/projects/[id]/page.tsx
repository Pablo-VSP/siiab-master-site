import Link from "next/link"
import { notFound } from "next/navigation"
import { requireUser } from "@/lib/auth"
import { getCatalogProject } from "@/lib/services/catalog"
import { ResourceCard } from "@/components/resource-card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ArrowLeft, BarChart3, FolderX, Globe } from "lucide-react"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireUser()

  // El proyecto y sus recursos provienen del menú autorizado de Keymaster. Si
  // el proyecto no existe en el menú del usuario, no tiene acceso -> 404.
  const found = await getCatalogProject(id)
  if (!found) notFound()

  const { project, resources } = found
  const reports = resources.filter((r) => r.type === "report")
  const sites = resources.filter((r) => r.type === "site")

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Proyectos
        </Link>
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-balance">
            {project.name}
          </h1>
          {project.description ? (
            <p className="max-w-2xl text-sm text-muted-foreground text-pretty">
              {project.description}
            </p>
          ) : null}
        </header>
      </div>

      {resources.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderX />
            </EmptyMedia>
            <EmptyTitle>Sin recursos</EmptyTitle>
            <EmptyDescription>Este proyecto todavía no tiene reportes ni sitios.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-8">
          {reports.length > 0 ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-accent" />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Reportes ({reports.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reports.map((r) => (
                  <ResourceCard key={r.id} resource={r} showProject={false} />
                ))}
              </div>
            </section>
          ) : null}

          {sites.length > 0 ? (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-accent" />
                <h2 className="text-sm font-medium text-muted-foreground">
                  Sitios web ({sites.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sites.map((r) => (
                  <ResourceCard key={r.id} resource={r} showProject={false} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
