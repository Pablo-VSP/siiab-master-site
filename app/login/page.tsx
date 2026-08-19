import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4 py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-24 w-56 items-center justify-center rounded-xl bg-white p-4 shadow-sm">
          <Image
            src="/logos/Logos_SIIAB nuevo.png"
            alt="SIIAB"
            width={200}
            height={80}
            className="h-full w-auto object-contain"
          />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            SIIAB
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            Portal interno de sitios, reportes y gestión de solicitudes de vacaciones.
          </p>
        </div>
      </div>

      <LoginForm />
    </main>
  )
}
