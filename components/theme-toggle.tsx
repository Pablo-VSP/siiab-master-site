"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

// Alterna entre modo claro y oscuro. La preferencia se guarda en localStorage
// ("theme") y el script de app/layout.tsx la aplica antes de pintar.
//
//  - variant "sidebar": colores del menú lateral (siempre oscuro).
//  - variant "default": colores normales de la página (p. ej. el login).
//  - compact: solo ícono.

const STORAGE_KEY = "theme"

export function ThemeToggle({
  variant = "default",
  compact = false,
}: {
  variant?: "default" | "sidebar"
  compact?: boolean
}) {
  // Se lee tras montar: en el servidor no se conoce el tema.
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light")
    } catch {
      // Sin almacenamiento: el cambio vale solo para esta visita.
    }
    setDark(next)
  }

  const label = dark ? "Modo claro" : "Modo oscuro"
  const Icon = dark ? Sun : Moon

  const colors =
    variant === "sidebar"
      ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      : ""

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggle}
      title={compact ? label : undefined}
      aria-label={compact ? label : undefined}
      className={
        compact
          ? `w-full justify-center px-0 ${colors}`
          : `w-full justify-start ${colors}`
      }
    >
      <Icon data-icon={compact ? undefined : "inline-start"} />
      {compact ? null : label}
    </Button>
  )
}
