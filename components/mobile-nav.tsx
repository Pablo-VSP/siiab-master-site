"use client"

import { useState } from "react"
import { Menu, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NavContent, type NavContentProps } from "@/components/nav-content"

export function MobileNav(props: Omit<NavContentProps, "onNavigate">) {
  const [open, setOpen] = useState(false)

  return (
    <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Abrir menú">
              <Menu />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <NavContent {...props} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutGrid className="size-4" />
        </div>
        <span className="text-sm font-semibold">Portal Interno</span>
      </div>
    </header>
  )
}
