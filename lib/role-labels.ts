import type { RoleName } from "./data/types"

// Etiquetas legibles para roles. Seguro para usar en cliente y servidor.
export const roleLabels: Record<RoleName, string> = {
  admin: "Administrador",
  approver: "Encargado",
  employee: "Empleado",
}
