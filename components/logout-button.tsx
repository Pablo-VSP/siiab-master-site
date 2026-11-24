"use client"

import { logoutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

/** `compact` muestra solo el ícono (menú lateral contraído). */
export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logoutAction} className="w-full">
      <Button
        type="submit"
        variant="ghost"
        title={compact ? "Cerrar sesión" : undefined}
        aria-label={compact ? "Cerrar sesión" : undefined}
        className={
          compact
            ? "w-full justify-center px-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            : "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }
      >
        <LogOut data-icon={compact ? undefined : "inline-start"} />
        {compact ? null : "Cerrar sesión"}
      </Button>
    </form>
  )
}
