import { requireRole } from "@/lib/auth"
import { getStore } from "@/lib/data/store"
import { AdminUsersClient } from "@/components/admin-users-client"

export default async function AdminUsersPage() {
  const admin = await requireRole("admin")
  const users = await getStore().listUsers()

  return (
    <AdminUsersClient users={users} currentUserId={admin.id} />
  )
}
