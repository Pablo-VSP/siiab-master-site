"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSessionFromToken, destroySession } from "@/lib/auth"
import { authenticate } from "@/lib/services/gatekeeper"

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
})

export interface LoginState {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" }
  }

  // La autenticación la resuelve Gatekeeper; el JWT resultante se guarda en la
  // cookie de sesión y luego se reenvía a Keymaster para pintar el menú.
  const result = await authenticate({
    username: parsed.data.username,
    password: parsed.data.password,
  })

  if (!result.ok) {
    return { error: result.error }
  }

  await createSessionFromToken(result.token)
  redirect("/")
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect("/login")
}
