import Database from "better-sqlite3"
import path from "node:path"
import type { DataStore } from "./store"
import type {
  Project,
  ProjectPermission,
  Resource,
  User,
  VacationRequest,
} from "./types"

// Implementación con SQLite (archivo local). Los datos persisten entre
// reinicios del servidor. El archivo se guarda en la raíz del proyecto
// como `portal.db` (agregar a .gitignore).
//
// Cuando se migre a producción (BigQuery/Cloud SQL), basta con cambiar
// la instanciación en store.ts por la implementación correspondiente.

const DB_PATH = path.join(process.cwd(), "portal.db")

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function now(): string {
  return new Date().toISOString()
}

export class SqliteStore implements DataStore {
  private db: Database.Database

  constructor() {
    this.db = new Database(DB_PATH)
    this.db.pragma("journal_mode = WAL")
    this.db.pragma("foreign_keys = ON")
    this.migrate()
  }

  // Crea las tablas si no existen.
  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK(role IN ('admin','approver','employee')),
        hire_date     TEXT NOT NULL,
        created_at    TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        logo_url    TEXT,
        created_at  TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS resources (
        id          TEXT PRIMARY KEY,
        project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title       TEXT NOT NULL,
        type        TEXT NOT NULL CHECK(type IN ('site','report')),
        url         TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project_permissions (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        access     TEXT NOT NULL CHECK(access IN ('view','manage')),
        PRIMARY KEY (user_id, project_id)
      );

      CREATE TABLE IF NOT EXISTS vacation_requests (
        id                TEXT PRIMARY KEY,
        user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        employee_name     TEXT NOT NULL,
        hire_date         TEXT NOT NULL,
        start_date        TEXT NOT NULL,
        end_date          TEXT NOT NULL,
        delegate_name     TEXT NOT NULL,
        delegate_project  TEXT NOT NULL,
        delegate_activity TEXT NOT NULL,
        status            TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
        rejection_reason  TEXT,
        approver_id       TEXT,
        approver_name     TEXT,
        created_at        TEXT NOT NULL,
        resolved_at       TEXT
      );
    `)
  }

  // ---- Helpers de mapeo ----
  private mapUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      passwordHash: row.password_hash as string,
      role: row.role as User["role"],
      hireDate: row.hire_date as string,
      createdAt: row.created_at as string,
    }
  }

  private mapProject(row: Record<string, unknown>): Project {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      logoUrl: (row.logo_url as string) || null,
      createdAt: row.created_at as string,
    }
  }

  private mapResource(row: Record<string, unknown>): Resource {
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      title: row.title as string,
      type: row.type as Resource["type"],
      url: row.url as string,
      description: row.description as string,
      createdAt: row.created_at as string,
    }
  }

  private mapPermission(row: Record<string, unknown>): ProjectPermission {
    return {
      userId: row.user_id as string,
      projectId: row.project_id as string,
      access: row.access as ProjectPermission["access"],
    }
  }

  private mapVacation(row: Record<string, unknown>): VacationRequest {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      employeeName: row.employee_name as string,
      hireDate: row.hire_date as string,
      startDate: row.start_date as string,
      endDate: row.end_date as string,
      delegateName: row.delegate_name as string,
      delegateProject: row.delegate_project as string,
      delegateActivity: row.delegate_activity as string,
      status: row.status as VacationRequest["status"],
      rejectionReason: (row.rejection_reason as string) || null,
      approverId: (row.approver_id as string) || null,
      approverName: (row.approver_name as string) || null,
      createdAt: row.created_at as string,
      resolvedAt: (row.resolved_at as string) || null,
    }
  }

  // ---- Usuarios ----
  async listUsers(): Promise<User[]> {
    const rows = this.db.prepare("SELECT * FROM users").all()
    return rows.map((r) => this.mapUser(r as Record<string, unknown>))
  }

  async getUserById(id: string): Promise<User | null> {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id)
    return row ? this.mapUser(row as Record<string, unknown>) : null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const row = this.db
      .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(email)
    return row ? this.mapUser(row as Record<string, unknown>) : null
  }

  async createUser(input: Omit<User, "id" | "createdAt">): Promise<User> {
    const id = uid("u")
    const createdAt = now()
    this.db
      .prepare(
        "INSERT INTO users (id, name, email, password_hash, role, hire_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, input.name, input.email, input.passwordHash, input.role, input.hireDate, createdAt)
    return { ...input, id, createdAt }
  }

  async updateUser(id: string, patch: Partial<Omit<User, "id">>): Promise<User | null> {
    const existing = await this.getUserById(id)
    if (!existing) return null
    const updated = { ...existing, ...patch }
    this.db
      .prepare(
        "UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, hire_date = ?, created_at = ? WHERE id = ?"
      )
      .run(updated.name, updated.email, updated.passwordHash, updated.role, updated.hireDate, updated.createdAt, id)
    return updated
  }

  async deleteUser(id: string): Promise<void> {
    this.db.prepare("DELETE FROM users WHERE id = ?").run(id)
  }

  // ---- Proyectos ----
  async listProjects(): Promise<Project[]> {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY name ASC").all()
    return rows.map((r) => this.mapProject(r as Record<string, unknown>))
  }

  async getProjectById(id: string): Promise<Project | null> {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ?").get(id)
    return row ? this.mapProject(row as Record<string, unknown>) : null
  }

  async createProject(input: Omit<Project, "id" | "createdAt">): Promise<Project> {
    const id = uid("p")
    const createdAt = now()
    this.db
      .prepare(
        "INSERT INTO projects (id, name, description, logo_url, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(id, input.name, input.description, input.logoUrl, createdAt)
    return { ...input, id, createdAt }
  }

  async updateProject(id: string, patch: Partial<Omit<Project, "id">>): Promise<Project | null> {
    const existing = await this.getProjectById(id)
    if (!existing) return null
    const updated = { ...existing, ...patch }
    this.db
      .prepare(
        "UPDATE projects SET name = ?, description = ?, logo_url = ?, created_at = ? WHERE id = ?"
      )
      .run(updated.name, updated.description, updated.logoUrl, updated.createdAt, id)
    return updated
  }

  async deleteProject(id: string): Promise<void> {
    this.db.prepare("DELETE FROM projects WHERE id = ?").run(id)
  }

  // ---- Recursos ----
  async listResources(): Promise<Resource[]> {
    const rows = this.db.prepare("SELECT * FROM resources").all()
    return rows.map((r) => this.mapResource(r as Record<string, unknown>))
  }

  async listResourcesByProject(projectId: string): Promise<Resource[]> {
    const rows = this.db
      .prepare("SELECT * FROM resources WHERE project_id = ?")
      .all(projectId)
    return rows.map((r) => this.mapResource(r as Record<string, unknown>))
  }

  async getResourceById(id: string): Promise<Resource | null> {
    const row = this.db.prepare("SELECT * FROM resources WHERE id = ?").get(id)
    return row ? this.mapResource(row as Record<string, unknown>) : null
  }

  async createResource(input: Omit<Resource, "id" | "createdAt">): Promise<Resource> {
    const id = uid("r")
    const createdAt = now()
    this.db
      .prepare(
        "INSERT INTO resources (id, project_id, title, type, url, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, input.projectId, input.title, input.type, input.url, input.description, createdAt)
    return { ...input, id, createdAt }
  }

  async updateResource(id: string, patch: Partial<Omit<Resource, "id">>): Promise<Resource | null> {
    const existing = await this.getResourceById(id)
    if (!existing) return null
    const updated = { ...existing, ...patch }
    this.db
      .prepare(
        "UPDATE resources SET project_id = ?, title = ?, type = ?, url = ?, description = ?, created_at = ? WHERE id = ?"
      )
      .run(updated.projectId, updated.title, updated.type, updated.url, updated.description, updated.createdAt, id)
    return updated
  }

  async deleteResource(id: string): Promise<void> {
    this.db.prepare("DELETE FROM resources WHERE id = ?").run(id)
  }

  // ---- Permisos ----
  async listPermissions(): Promise<ProjectPermission[]> {
    const rows = this.db.prepare("SELECT * FROM project_permissions").all()
    return rows.map((r) => this.mapPermission(r as Record<string, unknown>))
  }

  async listPermissionsByUser(userId: string): Promise<ProjectPermission[]> {
    const rows = this.db
      .prepare("SELECT * FROM project_permissions WHERE user_id = ?")
      .all(userId)
    return rows.map((r) => this.mapPermission(r as Record<string, unknown>))
  }

  async setPermission(perm: ProjectPermission): Promise<void> {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO project_permissions (user_id, project_id, access) VALUES (?, ?, ?)"
      )
      .run(perm.userId, perm.projectId, perm.access)
  }

  async removePermission(userId: string, projectId: string): Promise<void> {
    this.db
      .prepare("DELETE FROM project_permissions WHERE user_id = ? AND project_id = ?")
      .run(userId, projectId)
  }

  // ---- Vacaciones ----
  async listVacationRequests(): Promise<VacationRequest[]> {
    const rows = this.db
      .prepare("SELECT * FROM vacation_requests ORDER BY created_at DESC")
      .all()
    return rows.map((r) => this.mapVacation(r as Record<string, unknown>))
  }

  async listVacationRequestsByUser(userId: string): Promise<VacationRequest[]> {
    const rows = this.db
      .prepare("SELECT * FROM vacation_requests WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId)
    return rows.map((r) => this.mapVacation(r as Record<string, unknown>))
  }

  async getVacationRequestById(id: string): Promise<VacationRequest | null> {
    const row = this.db
      .prepare("SELECT * FROM vacation_requests WHERE id = ?")
      .get(id)
    return row ? this.mapVacation(row as Record<string, unknown>) : null
  }

  async createVacationRequest(
    input: Omit<VacationRequest, "id" | "createdAt" | "status" | "rejectionReason" | "approverId" | "approverName" | "resolvedAt">
  ): Promise<VacationRequest> {
    const id = uid("v")
    const createdAt = now()
    this.db
      .prepare(
        `INSERT INTO vacation_requests
          (id, user_id, employee_name, hire_date, start_date, end_date,
           delegate_name, delegate_project, delegate_activity,
           status, rejection_reason, approver_id, approver_name, created_at, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, NULL)`
      )
      .run(
        id,
        input.userId,
        input.employeeName,
        input.hireDate,
        input.startDate,
        input.endDate,
        input.delegateName,
        input.delegateProject,
        input.delegateActivity,
        createdAt
      )
    return {
      ...input,
      id,
      status: "pending",
      rejectionReason: null,
      approverId: null,
      approverName: null,
      createdAt,
      resolvedAt: null,
    }
  }

  async updateVacationRequest(
    id: string,
    patch: Partial<Omit<VacationRequest, "id">>
  ): Promise<VacationRequest | null> {
    const existing = await this.getVacationRequestById(id)
    if (!existing) return null
    const updated = { ...existing, ...patch }
    this.db
      .prepare(
        `UPDATE vacation_requests SET
          user_id = ?, employee_name = ?, hire_date = ?, start_date = ?, end_date = ?,
          delegate_name = ?, delegate_project = ?, delegate_activity = ?,
          status = ?, rejection_reason = ?, approver_id = ?, approver_name = ?,
          created_at = ?, resolved_at = ?
         WHERE id = ?`
      )
      .run(
        updated.userId,
        updated.employeeName,
        updated.hireDate,
        updated.startDate,
        updated.endDate,
        updated.delegateName,
        updated.delegateProject,
        updated.delegateActivity,
        updated.status,
        updated.rejectionReason,
        updated.approverId,
        updated.approverName,
        updated.createdAt,
        updated.resolvedAt,
        id
      )
    return updated
  }
}
