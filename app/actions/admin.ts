"use server"

import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth"
import { getStore } from "@/lib/data/store"
import {
  projectSchema,
  resourceSchema,
  userSchema,
  userUpdateSchema,
  permissionSchema,
} from "@/lib/validation/admin"

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
}

// ---- Proyectos ----

export async function createProjectAction(input: unknown): Promise<ActionResult> {
  await requireRole("admin")
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  const project = await getStore().createProject({
    name: parsed.data.name,
    description: parsed.data.description,
    logoUrl: parsed.data.logoUrl || null,
  })
  revalidatePath("/projects")
  revalidatePath("/admin/projects")
  return { ok: true, id: project.id }
}

export async function updateProjectAction(id: string, input: unknown): Promise<ActionResult> {
  await requireRole("admin")
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  const updated = await getStore().updateProject(id, {
    name: parsed.data.name,
    description: parsed.data.description,
    logoUrl: parsed.data.logoUrl || null,
  })
  if (!updated) return { ok: false, error: "Proyecto no encontrado" }

  revalidatePath("/projects")
  revalidatePath("/admin/projects")
  return { ok: true, id }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  await requireRole("admin")
  await getStore().deleteProject(id)
  revalidatePath("/projects")
  revalidatePath("/admin/projects")
  return { ok: true }
}

// ---- Recursos ----

export async function createResourceAction(input: unknown): Promise<ActionResult> {
  await requireRole("admin")
  const parsed = resourceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  const resource = await getStore().createResource(parsed.data)
  revalidatePath("/projects")
  revalidatePath(`/projects/${parsed.data.projectId}`)
  revalidatePath("/admin/projects")
  return { ok: true, id: resource.id }
}

export async function updateResourceAction(id: string, input: unknown): Promise<ActionResult> {
  await requireRole("admin")
  const parsed = resourceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  const updated = await getStore().updateResource(id, parsed.data)
  if (!updated) return { ok: false, error: "Recurso no encontrado" }

  revalidatePath("/projects")
  revalidatePath(`/projects/${parsed.data.projectId}`)
  revalidatePath("/admin/projects")
  return { ok: true, id }
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  await requireRole("admin")
  const resource = await getStore().getResourceById(id)
  await getStore().deleteResource(id)
  if (resource) {
    revalidatePath(`/projects/${resource.projectId}`)
  }
  revalidatePath("/projects")
  revalidatePath("/admin/projects")
  return { ok: true }
}

// ---- Usuarios ----

export async function createUserAction(input: unknown): Promise<ActionResult> {
  const admin = await requireRole("admin")
  const parsed = userSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  // Verificar email duplicado
  const existing = await getStore().getUserByEmail(parsed.data.email)
  if (existing) return { ok: false, error: "Ya existe un usuario con ese correo" }

  if (!parsed.data.password) return { ok: false, error: "La contraseña es obligatoria para nuevos usuarios" }

  const user = await getStore().createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    passwordHash: `plain:${parsed.data.password}`,
    hireDate: parsed.data.hireDate,
  })

  revalidatePath("/admin/users")
  revalidatePath("/admin/permissions")
  return { ok: true, id: user.id }
}

export async function updateUserAction(id: string, input: unknown): Promise<ActionResult> {
  await requireRole("admin")
  const parsed = userUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  const existing = await getStore().getUserById(id)
  if (!existing) return { ok: false, error: "Usuario no encontrado" }

  // Si cambia el email, verificar que no esté duplicado
  if (parsed.data.email !== existing.email) {
    const dup = await getStore().getUserByEmail(parsed.data.email)
    if (dup) return { ok: false, error: "Ya existe un usuario con ese correo" }
  }

  const patch: Record<string, string> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    hireDate: parsed.data.hireDate,
  }
  if (parsed.data.password && parsed.data.password.length >= 4) {
    patch.passwordHash = `plain:${parsed.data.password}`
  }

  await getStore().updateUser(id, patch)
  revalidatePath("/admin/users")
  revalidatePath("/admin/permissions")
  return { ok: true, id }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const admin = await requireRole("admin")
  if (admin.id === id) return { ok: false, error: "No puedes eliminar tu propia cuenta" }

  await getStore().deleteUser(id)
  revalidatePath("/admin/users")
  revalidatePath("/admin/permissions")
  return { ok: true }
}

// ---- Permisos ----

export async function setPermissionAction(input: unknown): Promise<ActionResult> {
  await requireRole("admin")
  const parsed = permissionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message }

  await getStore().setPermission(parsed.data)
  revalidatePath("/admin/permissions")
  revalidatePath("/projects")
  return { ok: true }
}

export async function removePermissionAction(userId: string, projectId: string): Promise<ActionResult> {
  await requireRole("admin")
  await getStore().removePermission(userId, projectId)
  revalidatePath("/admin/permissions")
  revalidatePath("/projects")
  return { ok: true }
}
