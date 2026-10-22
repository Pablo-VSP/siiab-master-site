import { requireRole } from "@/lib/auth"
import {
  loadSecurityUsers,
  loadMenuPerfiles,
  loadMenuPerfilUsers,
} from "@/lib/services/menu-admin-data"
import { UsuariosClient } from "@/components/config/usuarios-client"

export const metadata = { title: "Usuarios · Configuración" }

export default async function UsuariosPage() {
  await requireRole("admin")
  const [users, perfiles, assignments] = await Promise.all([
    loadSecurityUsers(),
    loadMenuPerfiles(),
    loadMenuPerfilUsers(),
  ])
  return (
    <div className="mx-auto max-w-6xl">
      <UsuariosClient users={users} perfiles={perfiles} assignments={assignments} />
    </div>
  )
}
