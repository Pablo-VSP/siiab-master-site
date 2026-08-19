import { requireRole } from "@/lib/auth"
import { getStore } from "@/lib/data/store"
import { AdminProjectsClient } from "@/components/admin-projects-client"

export default async function AdminProjectsPage() {
  await requireRole("admin")
  const store = getStore()

  const [projects, resources] = await Promise.all([
    store.listProjects(),
    store.listResources(),
  ])

  return <AdminProjectsClient projects={projects} resources={resources} />
}
