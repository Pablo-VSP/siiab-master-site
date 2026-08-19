"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { createVacationRequestAction } from "@/app/actions/vacations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Send } from "lucide-react"

export function VacationForm({
  defaultEmployeeName,
  defaultHireDate,
}: {
  defaultEmployeeName: string
  defaultHireDate: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const data = {
      employeeName: form.get("employeeName") as string,
      hireDate: form.get("hireDate") as string,
      startDate: form.get("startDate") as string,
      endDate: form.get("endDate") as string,
      delegateName: form.get("delegateName") as string,
      delegateProject: form.get("delegateProject") as string,
      delegateActivity: form.get("delegateActivity") as string,
    }

    startTransition(async () => {
      const result = await createVacationRequestAction(data)
      if (!result.ok) {
        setError(result.error ?? "Error al crear la solicitud")
      } else {
        router.push(`/vacations/${result.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-sm font-medium">Datos del empleado</legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="employeeName">Nombre completo</Label>
          <Input
            id="employeeName"
            name="employeeName"
            defaultValue={defaultEmployeeName}
            required
            minLength={2}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="hireDate">Fecha de contratación</Label>
          <Input
            id="hireDate"
            name="hireDate"
            type="date"
            defaultValue={defaultHireDate}
            required
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-sm font-medium">Periodo solicitado</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate">Fecha de fin</Label>
            <Input id="endDate" name="endDate" type="date" required />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <legend className="px-2 text-sm font-medium">Delegación de actividades</legend>

        <div className="flex flex-col gap-2">
          <Label htmlFor="delegateName">Nombre del delegado</Label>
          <Input
            id="delegateName"
            name="delegateName"
            placeholder="Nombre de quien cubrirá tus actividades"
            required
            minLength={2}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="delegateProject">Proyecto delegado</Label>
          <Input
            id="delegateProject"
            name="delegateProject"
            placeholder="Proyecto principal que delegas"
            required
            minLength={2}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="delegateActivity">Actividad específica</Label>
          <Textarea
            id="delegateActivity"
            name="delegateActivity"
            placeholder="Describe con detalle la actividad que delegas al responsable..."
            rows={3}
            required
            minLength={10}
          />
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending} className="self-end">
        {isPending ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <Send data-icon="inline-start" />
        )}
        {isPending ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </form>
  )
}
