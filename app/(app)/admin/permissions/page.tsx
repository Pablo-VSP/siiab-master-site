import { requireRole } from "@/lib/auth"
import { getStore } from "@/lib/data/store"
import { AdminPermissionsClient } from "@/components/admin-permissions-client"

export default async function AdminPermissionsPage() {
  await requireRole("admin")
  const store = getStore()

  const [users, projects, permissions] = await Promise.all([
    store.listUsers(),
    store.listProjects(),
    store.listPermissions(),
  ])

  return (
    <AdminPermissionsClient
      users={users}
      projects={projects}
      permissions={permissions}
    />
  )
}
