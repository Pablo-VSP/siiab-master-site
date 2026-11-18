import { LoginForm } from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Panel de marca: carbón cálido con el motivo de red del logo SIIAB.
          En móvil se colapsa a una franja superior compacta. */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-sidebar px-6 py-8 text-sidebar-foreground lg:px-12 lg:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--sidebar-primary) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex h-11 w-40 items-center justify-start rounded-lg bg-white px-3 lg:h-12 lg:w-44">
          <Image
            src="/logos/Logos_SIIAB_nuevo.png"
            alt="SIIAB"
            width={176}
            height={48}
            priority
            className="h-7 w-auto object-contain lg:h-8"
          />
        </div>

        <div className="relative hidden max-w-md flex-col gap-3 lg:flex">
          <h1 className="font-display text-4xl font-semibold leading-tight text-balance">
            Toda la información de tus proyectos, en un solo lugar.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-foreground/70 text-pretty">
            Sitios, reportes y solicitudes de vacaciones, con acceso según tu rol.
          </p>
        </div>

        <p className="relative hidden text-xs text-sidebar-foreground/50 lg:block">
          Sistema Integral de Información Abordo
        </p>
      </aside>

      {/* Panel de acceso */}
      <div className="flex flex-col items-center justify-center gap-6 px-4 py-10">
        <div className="flex flex-col gap-1 text-center lg:hidden">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Bienvenido
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground text-pretty">
            Ingresa para ver tus proyectos y reportes.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
