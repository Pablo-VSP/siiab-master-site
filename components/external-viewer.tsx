"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react"
import { ReportViewer } from "@/components/report-viewer"

// -----------------------------------------------------------------------------
// Visor de reportes dentro del portal (ventana con iframe).
//
// Se monta una sola vez en el layout. Solo los REPORTES se muestran aquí; los
// sitios externos (que suelen pedir usuario y contraseña) abren en una pestaña
// aparte, porque su sesión no se guarda dentro de un iframe.
//
// El enlace sigue siendo un <a target="_blank">: un clic normal sobre un reporte
// abre el visor; Ctrl/Cmd/Shift/clic central conservan el comportamiento del
// navegador (nueva pestaña).
// -----------------------------------------------------------------------------

export interface ExternalLinkInfo {
  title: string
  url: string
  /** Campo `command` de Keymaster ("Reporte" o "Sitio"). */
  command?: string | null
}

type ClickHandler = (event: ReactMouseEvent, link: ExternalLinkInfo) => void

const ExternalViewerContext = createContext<ClickHandler | null>(null)

/**
 * Regla única de qué se abre en el visor:
 *  - command "Sitio"   -> nunca (pestaña aparte).
 *  - command "Reporte" -> siempre.
 *  - sin command       -> solo si la URL es de Looker/Data Studio.
 */
export function opensInViewer(command: string | null | undefined, url: string): boolean {
  const c = command?.trim().toLowerCase()
  if (c === "sitio") return false
  if (c === "reporte") return true
  return /datastudio\.google\.com|lookerstudio\.google\.com/i.test(url)
}

/** Solo http(s) puede ir en un iframe (nunca `javascript:` ni `data:`). */
function canEmbed(url: string): boolean {
  if (!/^https?:\/\//i.test(url.trim())) return false
  // Un portal en https no puede mostrar un iframe http (contenido mixto).
  if (window.location.protocol === "https:" && /^http:\/\//i.test(url.trim())) return false
  return true
}

export function ExternalViewerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  // Se conserva el último contenido mientras el diálogo se cierra, para que el
  // iframe no cambie a una URL vacía durante la animación.
  const [item, setItem] = useState<{ title: string; url: string } | null>(null)

  const onLinkClick = useCallback<ClickHandler>((event, link) => {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    if (event.defaultPrevented || event.button !== 0 || modified) return
    // Sitios y URLs no embebibles: se deja actuar al enlace (pestaña aparte).
    if (!opensInViewer(link.command, link.url) || !canEmbed(link.url)) return
    event.preventDefault()
    setItem({ title: link.title, url: link.url })
    setOpen(true)
  }, [])

  return (
    <ExternalViewerContext.Provider value={onLinkClick}>
      {children}
      <ReportViewer
        open={open}
        onOpenChange={setOpen}
        title={item?.title ?? ""}
        url={item?.url ?? ""}
      />
    </ExternalViewerContext.Provider>
  )
}

/**
 * Devuelve el manejador de clic para enlaces externos. Fuera del proveedor no
 * hace nada, así que el enlace abre una pestaña nueva como siempre.
 */
export function useExternalLinkHandler(): ClickHandler {
  return useContext(ExternalViewerContext) ?? noop
}

const noop: ClickHandler = () => {}
