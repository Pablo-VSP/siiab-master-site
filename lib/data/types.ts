// Tipos de dominio del portal. Estos tipos son independientes de la
// implementacion de almacenamiento (memoria hoy, BigQuery en el futuro).

export type RoleName = "admin" | "approver" | "employee"

export interface User {
  id: string
  name: string
  email: string
  /** Hash de contraseña. En el seed usamos texto plano prefijado para demo. */
  passwordHash: string
  role: RoleName
  hireDate: string // ISO date (YYYY-MM-DD)
  createdAt: string // ISO timestamp
}

export interface Project {
  id: string
  name: string
  description: string
  logoUrl: string | null
  createdAt: string
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

export type ProjectAccess = "view" | "manage"

export interface ProjectPermission {
  userId: string
  projectId: string
  access: ProjectAccess
}

export type VacationStatus = "pending" | "approved" | "rejected"

export interface VacationRequest {
  id: string
  userId: string
  employeeName: string
  hireDate: string
  startDate: string
  endDate: string
  delegateName: string
  delegateProject: string
  delegateActivity: string
  status: VacationStatus
  rejectionReason: string | null
  approverId: string | null
  approverName: string | null
  createdAt: string
  resolvedAt: string | null
}
