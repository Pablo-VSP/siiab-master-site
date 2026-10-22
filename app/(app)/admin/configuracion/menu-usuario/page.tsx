import { requireRole } from "@/lib/auth"
import {
  loadMenuPerfilUsers,
  loadSecurityUsers,
  loadMenuPerfiles,
} from "@/lib/services/menu-admin-data"
import { MenuUsuarioClient } from "@/components/config/menu-usuario-client"

export const metadata = { title: "Menú por Usuario · Configuración" }

export default async function MenuUsuarioPage() {
  await requireRole("admin")
  const [assignments, users, perfiles] = await Promise.all([
    loadMenuPerfilUsers(),
    loadSecurityUsers(),
    loadMenuPerfiles(),
  ])
  return (
    <div className="mx-auto max-w-5xl">
      <MenuUsuarioClient assignments={assignments} users={users} perfiles={perfiles} />
    </div>
  )
}
