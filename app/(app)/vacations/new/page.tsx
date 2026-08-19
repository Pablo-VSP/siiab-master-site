import { requireUser } from "@/lib/auth"
import { VacationForm } from "@/components/vacation-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewVacationPage() {
  const user = await requireUser()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/vacations"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Mis vacaciones
        </Link>
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Nueva solicitud</h1>
          <p className="text-sm text-muted-foreground">
            Completa los datos para solicitar un periodo de vacaciones.
          </p>
        </header>
      </div>

      <VacationForm
        defaultEmployeeName={user.name}
        defaultHireDate={user.hireDate}
      />
    </div>
  )
}
