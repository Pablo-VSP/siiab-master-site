import { requireRole } from "@/lib/auth"
import { loadMenuPerfiles } from "@/lib/services/menu-admin-data"
import { MenusClient } from "@/components/config/menus-client"

export const metadata = { title: "Menús · Configuración" }

export default async function MenusPage() {
  await requireRole("admin")
  const perfiles = await loadMenuPerfiles()
  return (
    <div className="mx-auto max-w-5xl">
      <MenusClient perfiles={perfiles} />
    </div>
  )
}
