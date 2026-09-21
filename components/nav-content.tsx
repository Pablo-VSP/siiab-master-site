"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buildNavSections, type NavSection } from "@/components/nav-items"
import { LogoutButton } from "@/components/logout-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { MenuGroup } from "@/lib/services/keymaster"

export interface NavContentProps {
  userName: string
  subtitle?: string
  /** Grupos de menú provenientes de Keymaster. */
  menu: MenuGroup[]
  onNavigate?: () => void
}

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
}: NavContentProps) {
  const pathname = usePathname()
  const sections: NavSection[] = buildNavSections(menu)
  const initials = initialsOf(userName)

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-12 w-full items-center justify-start rounded-lg bg-white p-1.5">
          <Image
            src="/logos/Logos_SIIAB nuevo.png"
            alt="SIIAB"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {sections.length === 0 ? (
          <p className="px-3 text-xs text-sidebar-foreground/50">
            No hay opciones de menú disponibles.
          </p>
        ) : (
          sections.map((section) => {
            const SectionIcon = section.icon
            return (
              <div key={section.key} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
                  <SectionIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{section.label}</span>
                </div>
                {section.options.map((opt) => {
                  const Icon = opt.icon
                  const active = !opt.external && isActive(pathname, opt.href)
                  const className = cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )

                  if (opt.external) {
                    return (
                      <a
                        key={opt.key}
                        href={opt.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onNavigate}
                        className={className}
                        title={opt.description ?? undefined}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </a>
                    )
                  }

                  return (
                    <Link
                      key={opt.key}
                      href={opt.href}
                      onClick={onNavigate}
                      className={className}
                      title={opt.description ?? undefined}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })
        )}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
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
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}
