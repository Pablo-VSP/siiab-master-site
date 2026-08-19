"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ResourceCard, type ResourceWithProject } from "@/components/resource-card"
import { FileSearch } from "lucide-react"

type Filter = "all" | "report" | "site"

export function CatalogSearch({ resources }: { resources: ResourceWithProject[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

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
            placeholder="Buscar por título, descripción o proyecto..."
            className="pl-9"
            aria-label="Buscar recursos"
          />
        </div>
        <ToggleGroup
          value={[filter]}
          onValueChange={(v) => setFilter(((v[0] as Filter) ?? "all"))}
          className="w-full sm:w-auto"
        >
          <ToggleGroupItem value="all">Todos</ToggleGroupItem>
          <ToggleGroupItem value="report">Reportes</ToggleGroupItem>
          <ToggleGroupItem value="site">Sitios</ToggleGroupItem>
        </ToggleGroup>
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
