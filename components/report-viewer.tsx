"use client"

import { useState } from "react"
import { ExternalLink, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ReportViewer({
  open,
  onOpenChange,
  title,
  url,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  url: string
}) {
  const [loadError, setLoadError] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) setLoadError(false)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex !h-[85svh] !max-h-[85svh] !w-[90vw] !max-w-[90vw] flex-col gap-3 p-4 sm:p-5">
        <DialogHeader className="flex-row items-start justify-between gap-4 pr-8">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-balance">{title}</DialogTitle>
            <DialogDescription>Reporte de Looker Studio embebido.</DialogDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink data-icon="inline-start" />
            Abrir en pestaña
          </Button>
        </DialogHeader>
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
          {loadError ? (
            <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
              <AlertTriangle className="size-10 text-muted-foreground" />
              <div className="flex flex-col gap-2">
                <p className="font-medium">No se pudo cargar el reporte</p>
                <p className="max-w-lg text-sm text-muted-foreground">
                  El reporte requiere autenticación con una cuenta de Google que tenga acceso
                  a la fuente de datos. Si el reporte usa <strong>Credenciales del propietario</strong> en
                  Looker Studio, debe estar compartido con los usuarios específicos. Los reportes
                  embebidos públicos solo muestran datos si la fuente de datos usa credenciales
                  del propietario y el reporte está compartido correctamente.
                </p>
              </div>
              <Button
                variant="outline"
                render={<a href={url} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink data-icon="inline-start" />
                Abrir en pestaña nueva
              </Button>
            </div>
          ) : (
            <iframe
              src={url}
              title={title}
              className="size-full"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
