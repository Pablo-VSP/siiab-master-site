import { NavContent, type NavContentProps } from "@/components/nav-content"

export function AppSidebar(props: Omit<NavContentProps, "onNavigate">) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
      <NavContent {...props} />
    </aside>
  )
}
