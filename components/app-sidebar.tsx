"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { NavContent, type NavContentProps } from "@/components/nav-content"

const COLLAPSED_STORAGE_KEY = "sidebar:collapsed"

export function AppSidebar(
  props: Omit<NavContentProps, "onNavigate" | "collapsed" | "onToggleCollapsed">,
) {
  const [collapsed, setCollapsed] = useState(false)

  // Se lee tras montar para que el primer render coincida con el del servidor.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1")
    } catch {
      // Almacenamiento no disponible: el menú arranca expandido.
    }
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0")
      } catch {
        // Sin almacenamiento: el cambio vale solo para esta sesión de la página.
      }
      return next
    })
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 motion-reduce:transition-none md:block",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <NavContent {...props} collapsed={collapsed} onToggleCollapsed={toggle} />
    </aside>
  )
}
