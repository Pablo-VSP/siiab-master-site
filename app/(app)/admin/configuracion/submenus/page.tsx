import { requireRole } from "@/lib/auth"
import { loadMenuMenus } from "@/lib/services/menu-admin-data"
import { SubmenusClient } from "@/components/config/submenus-client"

export const metadata = { title: "Submenús · Configuración" }

export default async function SubmenusPage() {
  await requireRole("admin")
  const menus = await loadMenuMenus()
  return (
    <div className="mx-auto max-w-5xl">
      <SubmenusClient menus={menus} />
    </div>
  )
}
