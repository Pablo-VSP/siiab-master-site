"use client"

import { logoutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <form action={logoutAction} className="w-full">
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut data-icon="inline-start" />
        Cerrar sesión
      </Button>
    </form>
  )
}
