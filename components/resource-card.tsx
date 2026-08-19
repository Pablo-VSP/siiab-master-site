"use client"

import { useState } from "react"
import Link from "next/link"
import { BarChart3, ExternalLink, Globe, Maximize2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportViewer } from "@/components/report-viewer"
import type { Resource } from "@/lib/data/types"

export interface ResourceWithProject extends Resource {
  projectName: string
}

export function ResourceCard({
  resource,
  showProject = true,
}: {
  resource: ResourceWithProject
  showProject?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isReport = resource.type === "report"

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div
              className={
                "flex size-9 shrink-0 items-center justify-center rounded-md " +
                (isReport
                  ? "bg-primary/10 text-primary"
                  : "bg-accent text-accent-foreground")
              }
            >
              {isReport ? <BarChart3 className="size-5" /> : <Globe className="size-5" />}
            </div>
            <Badge variant={isReport ? "default" : "secondary"}>
              {isReport ? "Reporte" : "Sitio web"}
            </Badge>
          </div>
          <CardTitle className="text-base leading-snug text-balance">
            {resource.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground text-pretty">{resource.description}</p>
          {showProject ? (
            <Link
              href={`/projects/${resource.projectId}`}
              className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
            >
              {resource.projectName}
            </Link>
          ) : null}
        </CardContent>
        <CardFooter>
          {isReport ? (
            <Button className="w-full" onClick={() => setOpen(true)}>
              <Maximize2 data-icon="inline-start" />
              Ver reporte
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              render={
                <a href={resource.url} target="_blank" rel="noopener noreferrer" />
              }
            >
              <ExternalLink data-icon="inline-start" />
              Abrir sitio
            </Button>
          )}
        </CardFooter>
      </Card>

      {isReport ? (
        <ReportViewer
          open={open}
          onOpenChange={setOpen}
          title={resource.title}
          url={resource.url}
        />
      ) : null}
    </>
  )
}
