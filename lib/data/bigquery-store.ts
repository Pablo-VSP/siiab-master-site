/**
 * Stub documentado de un DataStore respaldado por BigQuery.
 *
 * Este archivo NO se usa todavia. Sirve como guia de como implementar la
 * interfaz `DataStore` contra BigQuery cuando la conexion este disponible.
 *
 * Pasos para activarlo:
 *   1) Instalar el cliente:  pnpm add @google-cloud/bigquery
 *   2) Configurar credenciales por variables de entorno:
 *        - GOOGLE_CLOUD_PROJECT
 *        - BIGQUERY_DATASET           (ej. "portal")
 *        - GOOGLE_APPLICATION_CREDENTIALS  (ruta al JSON del service account)
 *          o bien las credenciales inyectadas por la plataforma.
 *   3) Crear las tablas con lib/data/schema.sql
 *   4) En lib/data/store.ts reemplazar `new MemoryStore()` por
 *        `new BigQueryStore()` dentro de getStore().
 *
 * A continuacion se muestra el patron general (comentado) para no romper el
 * build mientras no exista la dependencia ni las credenciales.
 */

import type { DataStore } from "./store"
import type {
  Project,
  ProjectPermission,
  Resource,
  User,
  VacationRequest,
} from "./types"

// import { BigQuery } from "@google-cloud/bigquery"

export class BigQueryStore implements DataStore {
  // private bq = new BigQuery({ projectId: process.env.GOOGLE_CLOUD_PROJECT })
  // private dataset = process.env.BIGQUERY_DATASET ?? "portal"

  private notImplemented(): never {
    throw new Error(
      "BigQueryStore no esta implementado todavia. Ver instrucciones en lib/data/bigquery-store.ts y el esquema en lib/data/schema.sql.",
    )
  }

  // Ejemplo del patron de lectura (referencia):
  //
  // async listUsers(): Promise<User[]> {
  //   const [rows] = await this.bq.query({
  //     query: `SELECT user_id AS id, name, email, password_hash AS passwordHash,
  //                    role, CAST(hire_date AS STRING) AS hireDate,
  //                    CAST(created_at AS STRING) AS createdAt
  //             FROM \`${this.dataset}.users\``,
  //   })
  //   return rows as User[]
  // }
  //
  // Ejemplo del patron de escritura por lotes (recomendado en BQ):
  //
  // async createUser(input) {
  //   const user = { ...input, id: uid("u"), createdAt: new Date().toISOString() }
  //   await this.bq.dataset(this.dataset).table("users").insert([{
  //     user_id: user.id, name: user.name, email: user.email,
  //     password_hash: user.passwordHash, role: user.role,
  //     hire_date: user.hireDate, created_at: user.createdAt,
  //   }])
  //   return user
  // }

  listUsers(): Promise<User[]> {
    return this.notImplemented()
  }
  getUserById(): Promise<User | null> {
    return this.notImplemented()
  }
  getUserByEmail(): Promise<User | null> {
    return this.notImplemented()
  }
  createUser(): Promise<User> {
    return this.notImplemented()
  }
  updateUser(): Promise<User | null> {
    return this.notImplemented()
  }
  deleteUser(): Promise<void> {
    return this.notImplemented()
  }

  listProjects(): Promise<Project[]> {
    return this.notImplemented()
  }
  getProjectById(): Promise<Project | null> {
    return this.notImplemented()
  }
  createProject(): Promise<Project> {
    return this.notImplemented()
  }
  updateProject(): Promise<Project | null> {
    return this.notImplemented()
  }
  deleteProject(): Promise<void> {
    return this.notImplemented()
  }

  listResources(): Promise<Resource[]> {
    return this.notImplemented()
  }
  listResourcesByProject(): Promise<Resource[]> {
    return this.notImplemented()
  }
  getResourceById(): Promise<Resource | null> {
    return this.notImplemented()
  }
  createResource(): Promise<Resource> {
    return this.notImplemented()
  }
  updateResource(): Promise<Resource | null> {
    return this.notImplemented()
  }
  deleteResource(): Promise<void> {
    return this.notImplemented()
  }

  listPermissions(): Promise<ProjectPermission[]> {
    return this.notImplemented()
  }
  listPermissionsByUser(): Promise<ProjectPermission[]> {
    return this.notImplemented()
  }
  setPermission(): Promise<void> {
    return this.notImplemented()
  }
  removePermission(): Promise<void> {
    return this.notImplemented()
  }

  listVacationRequests(): Promise<VacationRequest[]> {
    return this.notImplemented()
  }
  listVacationRequestsByUser(): Promise<VacationRequest[]> {
    return this.notImplemented()
  }
  getVacationRequestById(): Promise<VacationRequest | null> {
    return this.notImplemented()
  }
  createVacationRequest(): Promise<VacationRequest> {
    return this.notImplemented()
  }
  updateVacationRequest(): Promise<VacationRequest | null> {
    return this.notImplemented()
  }
}
