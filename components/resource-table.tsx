"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart3, ExternalLink, Globe, Maximize2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReportViewer } from "@/components/report-viewer"
import type { ResourceWithProject } from "@/components/resource-card"

export function ResourceTable({ resources }: { resources: ResourceWithProject[] }) {
  const [viewingReport, setViewingReport] = useState<ResourceWithProject | null>(null)

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Descripción</TableHead>
              <TableHead>Sistema</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((r) => {
              const isReport = r.type === "report"
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant={isReport ? "default" : "secondary"} className="gap-1">
                      {isReport ? (
                        <BarChart3 className="size-3" />
                      ) : (
                        <Globe className="size-3" />
                      )}
                      {isReport ? "Reporte" : "Sitio"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell className="hidden max-w-[280px] truncate text-muted-foreground sm:table-cell">
                    {r.description}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${r.projectId}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {r.projectName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {isReport ? (
                      <Button size="sm" onClick={() => setViewingReport(r)}>
                        <Maximize2 data-icon="inline-start" />
                        Ver
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <a href={r.url} target="_blank" rel="noopener noreferrer" />
                        }
                      >
                        <ExternalLink data-icon="inline-start" />
                        Abrir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
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
