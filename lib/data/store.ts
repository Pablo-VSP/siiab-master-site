import type {
  Project,
  ProjectPermission,
  Resource,
  User,
  VacationRequest,
} from "./types"

// Interfaz de almacenamiento. La app SIEMPRE consume `getStore()` y nunca
// una implementacion concreta, de modo que cambiar de SQLite a BigQuery
// (o a Postgres) sea transparente para el resto del codigo.
export interface DataStore {
  // Usuarios
  listUsers(): Promise<User[]>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  createUser(input: Omit<User, "id" | "createdAt">): Promise<User>
  updateUser(id: string, patch: Partial<Omit<User, "id">>): Promise<User | null>
  deleteUser(id: string): Promise<void>

  // Proyectos
  listProjects(): Promise<Project[]>
  getProjectById(id: string): Promise<Project | null>
  createProject(input: Omit<Project, "id" | "createdAt">): Promise<Project>
  updateProject(id: string, patch: Partial<Omit<Project, "id">>): Promise<Project | null>
  deleteProject(id: string): Promise<void>

  // Recursos (sitios y reportes)
  listResources(): Promise<Resource[]>
  listResourcesByProject(projectId: string): Promise<Resource[]>
  getResourceById(id: string): Promise<Resource | null>
  createResource(input: Omit<Resource, "id" | "createdAt">): Promise<Resource>
  updateResource(id: string, patch: Partial<Omit<Resource, "id">>): Promise<Resource | null>
  deleteResource(id: string): Promise<void>

  // Permisos por proyecto
  listPermissions(): Promise<ProjectPermission[]>
  listPermissionsByUser(userId: string): Promise<ProjectPermission[]>
  setPermission(perm: ProjectPermission): Promise<void>
  removePermission(userId: string, projectId: string): Promise<void>

  // Solicitudes de vacaciones
  listVacationRequests(): Promise<VacationRequest[]>
  listVacationRequestsByUser(userId: string): Promise<VacationRequest[]>
  getVacationRequestById(id: string): Promise<VacationRequest | null>
  createVacationRequest(
    input: Omit<VacationRequest, "id" | "createdAt" | "status" | "rejectionReason" | "approverId" | "approverName" | "resolvedAt">,
  ): Promise<VacationRequest>
  updateVacationRequest(
    id: string,
    patch: Partial<Omit<VacationRequest, "id">>,
  ): Promise<VacationRequest | null>
}

// Singleton. Guardamos la instancia en globalThis para sobrevivir al
// hot-reload de Next en desarrollo.
import { SqliteStore } from "./sqlite-store"
import { seedIfEmpty } from "./seed"

const globalForStore = globalThis as unknown as { __portalStore?: DataStore; __portalSeeded?: boolean }

export function getStore(): DataStore {
  if (!globalForStore.__portalStore) {
    globalForStore.__portalStore = new SqliteStore()
    // Seed asíncrono en background (solo la primera vez)
    if (!globalForStore.__portalSeeded) {
      globalForStore.__portalSeeded = true
      seedIfEmpty().catch((err) => console.error("[seed] Error:", err))
    }
  }
  return globalForStore.__portalStore
}
