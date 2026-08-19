import { getStore } from "./data/store"
import type { Project, ProjectAccess, User } from "./data/types"

export function isAdmin(user: User): boolean {
  return user.role === "admin"
}

export function canApproveVacations(user: User): boolean {
  return user.role === "admin" || user.role === "approver"
}

/**
 * Nivel de acceso de un usuario a un proyecto.
 * - admin: siempre "manage".
 * - otros: segun project_permissions (o null si no tiene acceso).
 */
export async function getProjectAccess(
  user: User,
  projectId: string,
): Promise<ProjectAccess | null> {
  if (isAdmin(user)) return "manage"
  const perms = await getStore().listPermissionsByUser(user.id)
  const perm = perms.find((p) => p.projectId === projectId)
  return perm?.access ?? null
}

export async function canAccessProject(user: User, projectId: string): Promise<boolean> {
  return (await getProjectAccess(user, projectId)) !== null
}

/** Proyectos que el usuario puede ver, respetando permisos. */
export async function getAccessibleProjects(user: User): Promise<Project[]> {
  const store = getStore()
  const projects = await store.listProjects()
  if (isAdmin(user)) return projects
  const perms = await store.listPermissionsByUser(user.id)
  const allowed = new Set(perms.map((p) => p.projectId))
  return projects.filter((p) => allowed.has(p.id))
}
