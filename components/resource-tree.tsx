"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  Globe,
  Maximize2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ReportViewer } from "@/components/report-viewer"
import type { ResourceWithProject } from "@/components/resource-card"

interface ProjectGroup {
  projectId: string
  projectName: string
  resources: ResourceWithProject[]
}

export function ResourceTree({ resources }: { resources: ResourceWithProject[] }) {
  const [viewingReport, setViewingReport] = useState<ResourceWithProject | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // All groups expanded by default
    return new Set(resources.map((r) => r.projectId))
  })

  const groups = useMemo<ProjectGroup[]>(() => {
    const map = new Map<string, ProjectGroup>()
    for (const r of resources) {
      const existing = map.get(r.projectId)
      if (existing) {
        existing.resources.push(r)
      } else {
        map.set(r.projectId, {
          projectId: r.projectId,
          projectName: r.projectName,
          resources: [r],
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName)
    )
  }, [resources])

  function toggleGroup(projectId: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        {groups.map((group) => {
          const isExpanded = expanded.has(group.projectId)
          return (
            <div key={group.projectId} className="rounded-lg border border-border">
              {/* Project header (tree branch) */}
              <button
                type="button"
                onClick={() => toggleGroup(group.projectId)}
                className="flex w-full items-center gap-2 rounded-t-lg px-4 py-3 text-left transition-colors hover:bg-muted/50"
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
                <FolderKanban className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-medium">{group.projectName}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {group.resources.length}
                </Badge>
              </button>

              {/* Resource leaves */}
              {isExpanded && (
                <div className="flex flex-col gap-px border-t border-border bg-muted/20">
                  {group.resources.map((r) => {
                    const isReport = r.type === "report"
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-4 py-2.5 pl-11 transition-colors hover:bg-muted/40"
                      >
                        <div
                          className={
                            "flex size-7 shrink-0 items-center justify-center rounded-md " +
                            (isReport
                              ? "bg-primary/10 text-primary"
                              : "bg-accent text-accent-foreground")
                          }
                        >
                          {isReport ? (
                            <BarChart3 className="size-3.5" />
                          ) : (
                            <Globe className="size-3.5" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {r.title}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {r.description}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {isReport ? (
                            <Button size="xs" onClick={() => setViewingReport(r)}>
                              <Maximize2 data-icon="inline-start" />
                              Ver
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="outline"
                              render={
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              }
                            >
                              <ExternalLink data-icon="inline-start" />
                              Abrir
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {viewingReport && (
        <ReportViewer
          open={!!viewingReport}
          onOpenChange={(open) => {
            if (!open) setViewingReport(null)
          }}
          title={viewingReport.title}
          url={viewingReport.url}
        />
      )}
    </>
  )
}
