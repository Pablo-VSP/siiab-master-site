import { z } from "zod"

export const projectSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  logoUrl: z.string().optional(),
})

export type ProjectInput = z.infer<typeof projectSchema>

export const resourceSchema = z.object({
  projectId: z.string().min(1, "Selecciona un proyecto"),
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  type: z.enum(["site", "report"], { message: "Tipo inválido" }),
  url: z.string().url("Ingresa una URL válida"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
})

export type ResourceInput = z.infer<typeof resourceSchema>

export const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido"),
  role: z.enum(["admin", "approver", "employee"], { message: "Rol inválido" }),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres").optional(),
  hireDate: z.string().min(1, "Ingresa la fecha de contratación"),
})

export type UserInput = z.infer<typeof userSchema>

export const userUpdateSchema = userSchema.extend({
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres").optional().or(z.literal("")),
})

export const permissionSchema = z.object({
  userId: z.string().min(1, "Selecciona un usuario"),
  projectId: z.string().min(1, "Selecciona un proyecto"),
  access: z.enum(["view", "manage"], { message: "Acceso inválido" }),
})

export type PermissionInput = z.infer<typeof permissionSchema>
