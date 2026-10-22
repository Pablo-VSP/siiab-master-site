import { redirect } from "next/navigation"
import { requireRole } from "@/lib/auth"

// El panel de administración ahora vive por completo en Configuración
// (gestión de menús, opciones, usuarios y permisos vía Keymaster).
export default async function AdminPage() {
  await requireRole("admin")
  redirect("/admin/configuracion")
}
