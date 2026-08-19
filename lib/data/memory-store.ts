import type { DataStore } from "./store"
import type {
  Project,
  ProjectPermission,
  Resource,
  User,
  VacationRequest,
} from "./types"

// Implementacion en memoria con datos seed. Los datos se reinician cuando el
// servidor se reinicia. Sirve para desarrollo/demo mientras no exista la
// conexion a BigQuery. Mantiene la misma interfaz `DataStore`.

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function now(): string {
  return new Date().toISOString()
}

// Contraseñas de demo: se guardan con prefijo "plain:" para dejar claro que
// NO es un hash real. La verificacion en lib/auth compara contra este formato.
function seedHash(password: string): string {
  return `plain:${password}`
}

export class MemoryStore implements DataStore {
  private users: User[] = []
  private projects: Project[] = []
  private resources: Resource[] = []
  private permissions: ProjectPermission[] = []
  private vacations: VacationRequest[] = []

  constructor() {
    this.seed()
  }

  private seed() {
    const t = now()

    this.users = [
      {
        id: "u_admin",
        name: "Ana Admin",
        email: "admin@portal.com",
        passwordHash: seedHash("admin123"),
        role: "admin",
        hireDate: "2020-01-15",
        createdAt: t,
      },
      {
        id: "u_approver",
        name: "Beto Encargado",
        email: "encargado@portal.com",
        passwordHash: seedHash("encargado123"),
        role: "approver",
        hireDate: "2021-03-10",
        createdAt: t,
      },
      {
        id: "u_employee",
        name: "Carla Empleada",
        email: "empleado@portal.com",
        passwordHash: seedHash("empleado123"),
        role: "employee",
        hireDate: "2022-06-01",
        createdAt: t,
      },
    ]

    this.projects = [
      {
        id: "p_ventas",
        name: "Analitica de Ventas",
        description: "Reportes de desempeño comercial y sitios de apoyo al equipo de ventas.",
        logoUrl: "/logos/ventas.png",
        createdAt: t,
      },
      {
        id: "p_marketing",
        name: "Marketing Digital",
        description: "Dashboards de campañas y recursos del equipo de marketing.",
        logoUrl: "/logos/marketing.png",
        createdAt: t,
      },
      {
        id: "p_operaciones",
        name: "Operaciones",
        description: "Indicadores operativos internos y herramientas de soporte.",
        logoUrl: "/logos/operaciones.png",
        createdAt: t,
      },
    ]

    this.resources = [
      {
        id: uid("r"),
        projectId: "p_ventas",
        title: "Dashboard de Ventas Mensuales",
        type: "report",
        url: "https://datastudio.google.com/embed/reporting/40b8d675-b5c0-4b1d-96e6-192b8e71489f/page/p_r8lkddeg6d",
        description: "Reporte de Looker Studio con el detalle de ventas por region.",
        createdAt: t,
      },
      {
        id: uid("r"),
        projectId: "p_ventas",
        title: "CRM de Ventas",
        type: "site",
        url: "https://www.salesforce.com",
        description: "Sistema externo de gestion de clientes.",
        createdAt: t,
      },
      {
        id: uid("r"),
        projectId: "p_marketing",
        title: "Rendimiento de Campañas",
        type: "report",
        url: "https://datastudio.google.com/embed/reporting/40b8d675-b5c0-4b1d-96e6-192b8e71489f/page/p_r8lkddeg6d",
        description: "Dashboard de Looker Studio de campañas activas.",
        createdAt: t,
      },
      {
        id: uid("r"),
        projectId: "p_marketing",
        title: "Google Analytics",
        type: "site",
        url: "https://analytics.google.com",
        description: "Analitica web de las propiedades de marketing.",
        createdAt: t,
      },
      {
        id: uid("r"),
        projectId: "p_operaciones",
        title: "KPIs Operativos",
        type: "report",
        url: "https://datastudio.google.com/embed/reporting/40b8d675-b5c0-4b1d-96e6-192b8e71489f/page/p_r8lkddeg6d",
        description: "Indicadores clave del area de operaciones.",
        createdAt: t,
      },
    ]

    // Permisos por proyecto. El admin no necesita permisos explicitos (ve todo).
    this.permissions = [
      // El encargado gestiona ventas y ve marketing.
      { userId: "u_approver", projectId: "p_ventas", access: "manage" },
      { userId: "u_approver", projectId: "p_marketing", access: "view" },
      // La empleada solo ve ventas.
      { userId: "u_employee", projectId: "p_ventas", access: "view" },
    ]

    this.vacations = [
      {
        id: uid("v"),
        userId: "u_employee",
        employeeName: "Carla Empleada",
        hireDate: "2022-06-01",
        startDate: "2026-09-01",
        endDate: "2026-09-10",
        delegateName: "Beto Encargado",
        delegateProject: "Analitica de Ventas",
        delegateActivity: "Actualizacion diaria del dashboard de ventas y atencion de solicitudes del CRM.",
        status: "pending",
        rejectionReason: null,
        approverId: null,
        approverName: null,
        createdAt: t,
        resolvedAt: null,
      },
    ]
  }

  // Utilidad interna para clonar y evitar mutaciones externas accidentales.
  private clone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v))
  }

  // ---- Usuarios ----
  async listUsers() {
    return this.clone(this.users)
  }
  async getUserById(id: string) {
    return this.clone(this.users.find((u) => u.id === id) ?? null)
  }
  async getUserByEmail(email: string) {
    return this.clone(
      this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
    )
  }
  async createUser(input: Omit<User, "id" | "createdAt">) {
    const user: User = { ...input, id: uid("u"), createdAt: now() }
    this.users.push(user)
    return this.clone(user)
  }
  async updateUser(id: string, patch: Partial<Omit<User, "id">>) {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) return null
    this.users[idx] = { ...this.users[idx], ...patch }
    return this.clone(this.users[idx])
  }
  async deleteUser(id: string) {
    this.users = this.users.filter((u) => u.id !== id)
    this.permissions = this.permissions.filter((p) => p.userId !== id)
  }

  // ---- Proyectos ----
  async listProjects() {
    return this.clone(this.projects)
  }
  async getProjectById(id: string) {
    return this.clone(this.projects.find((p) => p.id === id) ?? null)
  }
  async createProject(input: Omit<Project, "id" | "createdAt">) {
    const project: Project = { ...input, id: uid("p"), createdAt: now() }
    this.projects.push(project)
    return this.clone(project)
  }
  async updateProject(id: string, patch: Partial<Omit<Project, "id">>) {
    const idx = this.projects.findIndex((p) => p.id === id)
    if (idx === -1) return null
    this.projects[idx] = { ...this.projects[idx], ...patch }
    return this.clone(this.projects[idx])
  }
  async deleteProject(id: string) {
    this.projects = this.projects.filter((p) => p.id !== id)
    this.resources = this.resources.filter((r) => r.projectId !== id)
    this.permissions = this.permissions.filter((p) => p.projectId !== id)
  }

  // ---- Recursos ----
  async listResources() {
    return this.clone(this.resources)
  }
  async listResourcesByProject(projectId: string) {
    return this.clone(this.resources.filter((r) => r.projectId === projectId))
  }
  async getResourceById(id: string) {
    return this.clone(this.resources.find((r) => r.id === id) ?? null)
  }
  async createResource(input: Omit<Resource, "id" | "createdAt">) {
    const resource: Resource = { ...input, id: uid("r"), createdAt: now() }
    this.resources.push(resource)
    return this.clone(resource)
  }
  async updateResource(id: string, patch: Partial<Omit<Resource, "id">>) {
    const idx = this.resources.findIndex((r) => r.id === id)
    if (idx === -1) return null
    this.resources[idx] = { ...this.resources[idx], ...patch }
    return this.clone(this.resources[idx])
  }
  async deleteResource(id: string) {
    this.resources = this.resources.filter((r) => r.id !== id)
  }

  // ---- Permisos ----
  async listPermissions() {
    return this.clone(this.permissions)
  }
  async listPermissionsByUser(userId: string) {
    return this.clone(this.permissions.filter((p) => p.userId === userId))
  }
  async setPermission(perm: ProjectPermission) {
    const idx = this.permissions.findIndex(
      (p) => p.userId === perm.userId && p.projectId === perm.projectId,
    )
    if (idx === -1) this.permissions.push(perm)
    else this.permissions[idx] = perm
  }
  async removePermission(userId: string, projectId: string) {
    this.permissions = this.permissions.filter(
      (p) => !(p.userId === userId && p.projectId === projectId),
    )
  }

  // ---- Vacaciones ----
  async listVacationRequests() {
    return this.clone(
      [...this.vacations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }
  async listVacationRequestsByUser(userId: string) {
    return this.clone(
      this.vacations
        .filter((v) => v.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }
  async getVacationRequestById(id: string) {
    return this.clone(this.vacations.find((v) => v.id === id) ?? null)
  }
  async createVacationRequest(
    input: Omit<
      VacationRequest,
      "id" | "createdAt" | "status" | "rejectionReason" | "approverId" | "approverName" | "resolvedAt"
    >,
  ) {
    const request: VacationRequest = {
      ...input,
      id: uid("v"),
      status: "pending",
      rejectionReason: null,
      approverId: null,
      approverName: null,
      createdAt: now(),
      resolvedAt: null,
    }
    this.vacations.push(request)
    return this.clone(request)
  }
  async updateVacationRequest(id: string, patch: Partial<Omit<VacationRequest, "id">>) {
    const idx = this.vacations.findIndex((v) => v.id === id)
    if (idx === -1) return null
    this.vacations[idx] = { ...this.vacations[idx], ...patch }
    return this.clone(this.vacations[idx])
  }
}
