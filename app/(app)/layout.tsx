import type { ReactNode } from "react"
import { requireUser } from "@/lib/auth"
import { canApproveVacations, isAdmin } from "@/lib/permissions"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  const nav = {
    canApprove: canApproveVacations(user),
    isAdmin: isAdmin(user),
  }

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar
        userName={user.name}
        role={user.role}
        canApprove={nav.canApprove}
        isAdmin={nav.isAdmin}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav
          userName={user.name}
          role={user.role}
          canApprove={nav.canApprove}
          isAdmin={nav.isAdmin}
        />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
