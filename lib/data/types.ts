// Tipos de dominio del portal. Son independientes de cualquier almacenamiento:
// la identidad del usuario proviene del token de Gatekeeper y el catálogo de
// recursos se deriva del menú autorizado de Keymaster.

export type RoleName = "admin" | "approver" | "employee"

export interface User {
  id: string
  name: string
  email: string
  /** Marcador de origen de credenciales; la contraseña vive en Gatekeeper. */
  passwordHash: string
  role: RoleName
  hireDate: string // ISO date (YYYY-MM-DD)
  createdAt: string // ISO timestamp
}

export type ResourceType = "site" | "report"

export interface Resource {
  id: string
  projectId: string
  title: string
  type: ResourceType // report => iframe embebido; site => nueva pestaña
  url: string
  description: string
  createdAt: string
}
