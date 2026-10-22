import { requireRole } from "@/lib/auth"
import { loadMenuOptions } from "@/lib/services/menu-admin-data"
import { OpcionesClient } from "@/components/config/opciones-client"

export const metadata = { title: "Opciones de Menú · Configuración" }

export default async function OpcionesPage() {
  await requireRole("admin")
  const options = await loadMenuOptions()
  return (
    <div className="mx-auto max-w-6xl">
      <OpcionesClient options={options} />
    </div>
  )
}
