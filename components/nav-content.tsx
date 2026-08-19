"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buildNavItems } from "@/components/nav-items"
import { LogoutButton } from "@/components/logout-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { roleLabels } from "@/lib/role-labels"
import type { RoleName } from "@/lib/data/types"

export interface NavContentProps {
  userName: string
  role: RoleName
  canApprove: boolean
  isAdmin: boolean
  onNavigate?: () => void
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

export function NavContent({
  userName,
  role,
  canApprove,
  isAdmin,
  onNavigate,
}: NavContentProps) {
  const pathname = usePathname()
  const items = buildNavItems({ canApprove, isAdmin })
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

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

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border pt-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {roleLabels[role]}
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <LogoutButton />
      </div>
    </div>
  )
}
