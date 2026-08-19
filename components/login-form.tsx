"use client"

import { useActionState } from "react"
import { loginAction, type LoginState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, LogIn } from "lucide-react"

const demoAccounts = [
  { role: "Administrador", email: "admin@portal.com", password: "admin123" },
  { role: "Encargado", email: "encargado@portal.com", password: "encargado123" },
  { role: "Empleado", email: "empleado@portal.com", password: "empleado123" },
]

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  )

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Ingresa con tus credenciales corporativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {state.error ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>No se pudo iniciar sesión</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}

              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tucorreo@portal.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>

              <Button type="submit" disabled={pending}>
                <LogIn data-icon="inline-start" />
                {pending ? "Ingresando..." : "Ingresar"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cuentas de demostración</CardTitle>
          <CardDescription>
            Datos en memoria para probar cada rol. Se reinician al reiniciar el servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {demoAccounts.map((a) => (
            <div
              key={a.email}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs"
            >
              <span className="font-medium">{a.role}</span>
              <span className="font-mono text-muted-foreground">
                {a.email} · {a.password}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
