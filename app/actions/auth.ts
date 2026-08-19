"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { getStore } from "@/lib/data/store"
import { createSession, destroySession, verifyPassword } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().email("Correo invalido"),
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
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos" }
  }

  const user = await getStore().getUserByEmail(parsed.data.email)
  if (!user || !verifyPassword(user, parsed.data.password)) {
    return { error: "Credenciales incorrectas" }
  }

  await createSession(user)
  redirect("/")
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect("/login")
}
