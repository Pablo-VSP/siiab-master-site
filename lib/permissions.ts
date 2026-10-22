import type { User } from "./data/types"

// Utilidades de rol puras (sin base de datos). La autorización real de
// navegación la decide Keymaster; estas funciones solo interpretan el rol que
// pudiera venir en el token.

export function isAdmin(user: User): boolean {
  return user.role === "admin"
}

export function canApproveVacations(user: User): boolean {
  return user.role === "admin" || user.role === "approver"
}
