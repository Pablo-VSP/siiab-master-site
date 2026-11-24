"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight, ExternalLink, Maximize2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildNavSections, type NavOption, type NavSection } from "@/components/nav-items"
import { NavImage } from "@/components/nav-image"
import { opensInViewer, useExternalLinkHandler } from "@/components/external-viewer"
import type { MenuGroup } from "@/lib/services/keymaster"

// -----------------------------------------------------------------------------
// Página inicial: lista de sistemas (secciones del menú autorizado de
// Keymaster) con su logo. Al pulsar uno se despliegan sus opciones.
//
//  - Opción interna -> navega dentro del portal.
//  - Reporte        -> se abre en el visor (iframe) del propio portal.
//  - Sitio externo  -> pestaña aparte del navegador.
// -----------------------------------------------------------------------------

// Orden fijo de los grupos dentro de cada sistema: Sitios, Reportes y Páginas.
type OptionKind = "site" | "report" | "page"

const GROUPS: { kind: OptionKind; label: string }[] = [
  { kind: "site", label: "Sitios" },
  { kind: "report", label: "Reportes" },
  { kind: "page", label: "Páginas" },
]

/**
 * Sitio: enlace externo que abre en pestaña aparte. Reporte: enlace externo que
 * abre en el visor. Página: ruta interna del portal.
 */
function kindOf(opt: NavOption): OptionKind {
  if (!opt.external) return "page"
  return opensInViewer(opt.command, opt.href) ? "report" : "site"
}

/** Agrupa las opciones por tipo, conservando el orden de Keymaster dentro de cada grupo. */
function groupOptions(options: NavOption[]) {
  return GROUPS.map((g) => ({
    ...g,
    options: options.filter((o) => kindOf(o) === g.kind),
  })).filter((g) => g.options.length > 0)
}

function matches(text: string | null | undefined, q: string): boolean {
  return (text ?? "").toLowerCase().includes(q)
}

export function HomeProjects({ menu }: { menu: MenuGroup[] }) {
  const sections: NavSection[] = useMemo(() => buildNavSections(menu), [menu])

  const [open, setOpen] = useState<string[]>([])
  const [query, setQuery] = useState("")

  const q = query.trim().toLowerCase()

  // Con búsqueda activa se muestran solo los proyectos con coincidencias y
  // siempre desplegados; si coincide el nombre del proyecto, entran todas sus opciones.
  const visible: NavSection[] = useMemo(() => {
    if (!q) return sections
    return sections
      .map((s) => {
        if (matches(s.label, q)) return s
        return {
          ...s,
          options: s.options.filter((o) => matches(o.label, q) || matches(o.description, q)),
        }
      })
      .filter((s) => s.options.length > 0)
  }, [sections, q])

  function toggle(key: string) {
    setOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block max-w-md">
        <span className="sr-only">Buscar sistemas u opciones</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar sistemas u opciones"
          className="h-10 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No tienes sistemas asignados. Pide acceso a un administrador.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Sin resultados para “{query.trim()}”.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((section) => {
            const isOpen = q ? true : open.includes(section.key)
            const panelId = `home-section-${section.key}`
            const count = section.options.length

            return (
              <li key={section.key} className="rounded-xl border border-border bg-card">
                <h2>
                  <button
                    type="button"
                    onClick={() => toggle(section.key)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-4 rounded-xl p-4 text-left outline-none transition-colors hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {section.imageSrc ? (
                      // Los logos son apaisados con fondo blanco: caja de ancho fijo
                      // para que todas las filas queden alineadas.
                      <span className="flex h-12 w-28 shrink-0 items-center justify-center rounded-md bg-white px-2 ring-1 ring-border sm:w-40">
                        <NavImage
                          src={section.imageSrc}
                          fallback={section.icon}
                          alt=""
                          className="h-9 w-auto max-w-full"
                          fallbackClassName="size-5 text-muted-foreground"
                        />
                      </span>
                    ) : (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <section.icon className="size-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{section.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {count === 1 ? "1 opción" : `${count} opciones`}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                        !isOpen && "-rotate-90",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h2>

                {/* grid-rows 0fr/1fr anima la altura; `inert` quita del teclado lo plegado. */}
                <div
                  id={panelId}
                  inert={!isOpen}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="flex flex-col gap-5 border-t border-border p-4">
                      {groupOptions(section.options).map((group) => (
                        <section key={group.kind}>
                          <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            {group.label}
                            <span className="rounded-full bg-secondary px-1.5 text-xs tabular-nums">
                              {group.options.length}
                            </span>
                          </h3>
                          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {group.options.map((opt) => (
                              <li key={opt.key}>
                                <OptionTile opt={opt} />
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function OptionTile({ opt }: { opt: NavOption }) {
  const openExternal = useExternalLinkHandler()

  const className =
    "group flex h-full w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left outline-none transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-ring"

  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary">
        <NavImage
          src={opt.imageSrc}
          fallback={opt.icon}
          className="size-8"
          fallbackClassName="size-5 text-muted-foreground"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{opt.label}</span>
        {opt.description ? (
          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
            {opt.description}
          </span>
        ) : null}
      </span>
      {opt.external ? (
        // Reporte: se abre en el visor. Sitio: pestaña aparte.
        opensInViewer(opt.command, opt.href) ? (
          <Maximize2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )
      ) : (
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      )}
    </>
  )

  if (opt.external) {
    return (
      <a
        href={opt.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(e) => openExternal(e, { title: opt.label, url: opt.href, command: opt.command })}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={opt.href} className={className}>
      {content}
    </Link>
  )
}
