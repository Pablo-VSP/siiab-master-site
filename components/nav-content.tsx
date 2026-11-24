"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildNavSections, type NavSection } from "@/components/nav-items"
import { NavImage } from "@/components/nav-image"
import { useExternalLinkHandler } from "@/components/external-viewer"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { MenuGroup } from "@/lib/services/keymaster"

export interface NavContentProps {
  userName: string
  subtitle?: string
  /** Grupos de menú provenientes de Keymaster. */
  menu: MenuGroup[]
  onNavigate?: () => void
  /** Barra de íconos: oculta textos y encabezados de sección. */
  collapsed?: boolean
  /** Si se pasa, se muestra el botón para contraer/expandir el menú lateral. */
  onToggleCollapsed?: () => void
}

// Secciones plegadas por el usuario (se guardan las claves, p. ej. "menu-5").
const SECTIONS_STORAGE_KEY = "sidebar:closed-sections"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(href + "/")
}

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}

export function NavContent({
  userName,
  subtitle,
  menu,
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: NavContentProps) {
  const pathname = usePathname()
  const openExternal = useExternalLinkHandler()
  const sections: NavSection[] = buildNavSections(menu)
  const initials = initialsOf(userName)

  // Claves de las secciones plegadas. Se lee de localStorage tras montar para
  // que el HTML del servidor y el primer render del cliente coincidan.
  const [closed, setClosed] = useState<string[]>([])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SECTIONS_STORAGE_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        setClosed(parsed.filter((k): k is string => typeof k === "string"))
      }
    } catch {
      // Almacenamiento no disponible o JSON inválido: todo queda expandido.
    }
  }, [])

  function toggleSection(key: string) {
    setClosed((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      try {
        window.localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Sin almacenamiento: el cambio vale solo para esta sesión de la página.
      }
      return next
    })
  }

  return (
    <div className={cn("flex h-full flex-col", collapsed ? "gap-4 p-2" : "gap-6 p-4")}>
      <div
        className={cn(
          "flex items-center",
          collapsed ? "justify-center pt-1" : "justify-between gap-2 px-2 pt-1",
        )}
      >
        {collapsed ? null : (
          <Link
            href="/"
            onClick={onNavigate}
            title="Ir al inicio"
            className="flex h-11 min-w-0 items-center justify-start rounded-lg bg-white px-3 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Image
              src="/logos/Logos_SIIAB_nuevo.png"
              alt="SIIAB — Sistema Integral de Información Abordo. Ir al inicio"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
            />
          </Link>
        )}
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
        ) : null}
      </div>

      <nav
        aria-label="Navegación principal"
        className={cn("flex flex-1 flex-col overflow-y-auto", collapsed ? "gap-2" : "gap-4")}
      >
        {sections.length === 0 ? (
          collapsed ? null : (
            <p className="px-3 text-xs text-sidebar-foreground/50">
              No hay opciones de menú disponibles.
            </p>
          )
        ) : (
          sections.map((section, index) => {
            // En la barra de íconos no hay encabezados, así que no se puede
            // plegar: se muestran todas las opciones.
            const open = collapsed || !closed.includes(section.key)
            const panelId = `nav-section-${section.key}`
            const hasActive = section.options.some(
              (o) => !o.external && isActive(pathname, o.href),
            )

            return (
              <div
                key={section.key}
                className={cn(
                  "flex flex-col gap-1",
                  collapsed && index > 0 && "border-t border-sidebar-border pt-2",
                )}
              >
                {collapsed ? null : (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex w-full items-center gap-2 rounded-md px-3 pb-1 text-left text-xs font-medium text-sidebar-foreground/45 transition-colors outline-none hover:text-sidebar-foreground/80 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                  >
                    {section.imageSrc ? (
                      // Los logos son apaisados, con fondo blanco y texto oscuro:
                      // van sobre una pastilla blanca para leerse en el sidebar oscuro.
                      // El logo identifica la sección, así que el nombre queda solo
                      // como tooltip y texto accesible (no cabe junto al logo).
                      <>
                        <span
                          className="flex h-9 shrink-0 items-center rounded-md bg-white px-2"
                          title={section.label}
                        >
                          <NavImage
                            src={section.imageSrc}
                            fallback={section.icon}
                            alt=""
                            className="h-7 w-auto max-w-[120px]"
                            fallbackClassName="size-3.5 text-zinc-500"
                          />
                        </span>
                        <span className="sr-only">{section.label}</span>
                      </>
                    ) : (
                      <>
                        <section.icon className="size-3.5 shrink-0" />
                        <span className="truncate">{section.label}</span>
                      </>
                    )}
                    {/* Punto de aviso: la sección está plegada pero contiene la página actual. */}
                    {!open && hasActive ? (
                      <span
                        className="ml-auto size-1.5 shrink-0 rounded-full bg-sidebar-primary"
                        aria-hidden="true"
                      />
                    ) : null}
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
                        !open && "-rotate-90",
                        !open && hasActive ? "" : "ml-auto",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {/* grid-rows 0fr/1fr anima la altura sin medirla; `inert` saca del
                    orden de tabulación las opciones plegadas. */}
                <div
                  id={panelId}
                  inert={!open}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="flex min-h-0 flex-col gap-1 overflow-hidden">
                    {section.options.map((opt) => {
                      const active = !opt.external && isActive(pathname, opt.href)
                      const className = cn(
                        "flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-0" : "gap-3 px-3",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )
                      // Sin texto visible, el nombre va en el tooltip.
                      const title = collapsed ? opt.label : (opt.description ?? undefined)
                      const content = (
                        <>
                          <NavImage
                            src={opt.imageSrc}
                            fallback={opt.icon}
                            className="size-5 shrink-0"
                            fallbackClassName="size-4 shrink-0"
                          />
                          <span className={collapsed ? "sr-only" : "truncate"}>{opt.label}</span>
                        </>
                      )

                      if (opt.external) {
                        return (
                          <a
                            key={opt.key}
                            href={opt.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              openExternal(e, {
                                title: opt.label,
                                url: opt.href,
                                command: opt.command,
                              })
                              onNavigate?.()
                            }}
                            className={className}
                            title={title}
                          >
                            {content}
                          </a>
                        )
                      }

                      return (
                        <Link
                          key={opt.key}
                          href={opt.href}
                          onClick={onNavigate}
                          className={className}
                          title={title}
                          aria-current={active ? "page" : undefined}
                        >
                          {content}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3 px-2")}>
          <Avatar className="size-9" title={collapsed ? userName : undefined}>
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {collapsed ? null : (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </span>
              {subtitle ? (
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {subtitle}
                </span>
              ) : null}
            </div>
          )}
        </div>
        <ThemeToggle variant="sidebar" compact={collapsed} />
        <LogoutButton compact={collapsed} />
      </div>
    </div>
  )
}
