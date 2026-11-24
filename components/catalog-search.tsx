"use client"

import { useMemo, useState } from "react"
import { FileSearch, LayoutGrid, List, Network, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ResourceCard, type ResourceWithProject } from "@/components/resource-card"
import { ResourceTable } from "@/components/resource-table"
import { ResourceTree } from "@/components/resource-tree"

type Filter = "all" | "report" | "site"
type ViewMode = "cards" | "table" | "tree"

const viewOptions: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: "cards", label: "Tarjetas", icon: LayoutGrid },
  { value: "table", label: "Tabla", icon: List },
  { value: "tree", label: "Árbol", icon: Network },
]

export function CatalogSearch({ resources }: { resources: ResourceWithProject[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [view, setView] = useState<ViewMode>("cards")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      if (filter !== "all" && r.type !== filter) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q)
      )
    })
  }, [resources, query, filter])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, descripción o sistema..."
            className="pl-9"
            aria-label="Buscar recursos"
          />
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            value={[filter]}
            onValueChange={(v) => setFilter(((v[0] as Filter) ?? "all"))}
            className="w-full sm:w-auto"
          >
            <ToggleGroupItem value="all">Todos</ToggleGroupItem>
            <ToggleGroupItem value="report">Reportes</ToggleGroupItem>
            <ToggleGroupItem value="site">Sitios</ToggleGroupItem>
          </ToggleGroup>

          <div className="hidden items-center gap-0.5 rounded-lg border border-border p-0.5 sm:flex">
            <TooltipProvider delay={300}>
              {viewOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = view === opt.value
                return (
                  <Tooltip key={opt.value}>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon-xs"
                          variant={isActive ? "secondary" : "ghost"}
                          onClick={() => setView(opt.value)}
                          aria-label={`Vista: ${opt.label}`}
                          aria-pressed={isActive}
                        />
                      }
                    >
                      <Icon className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{opt.label}</TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSearch />
            </EmptyMedia>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>
              No encontramos recursos que coincidan con tu búsqueda.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : view === "table" ? (
        <ResourceTable resources={filtered} />
      ) : view === "tree" ? (
        <ResourceTree resources={filtered} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
        </div>
      )}
    </div>
  )
}
