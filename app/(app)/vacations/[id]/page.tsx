import { notFound } from "next/navigation"
import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { canApproveVacations } from "@/lib/permissions"
import { getStore } from "@/lib/data/store"
import { formatDate, daysBetween, statusLabels } from "@/lib/vacation-format"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { VacationDetailActions } from "@/components/vacation-detail-actions"
import type { VacationStatus } from "@/lib/data/types"

const statusVariant: Record<VacationStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
}

export default async function VacationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const request = await getStore().getVacationRequestById(id)

  if (!request) notFound()

  // Solo el dueño o un approver/admin pueden ver el detalle
  const isOwner = request.userId === user.id
  const isApprover = canApproveVacations(user)
  if (!isOwner && !isApprover) notFound()

  const dias = daysBetween(request.startDate, request.endDate)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={isOwner ? "/vacations" : "/vacations/inbox"}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {isOwner ? "Mis vacaciones" : "Bandeja de aprobación"}
        </Link>
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Solicitud de vacaciones</h1>
          <Badge variant={statusVariant[request.status]} className="w-fit">
            {statusLabels[request.status]}
          </Badge>
        </header>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Datos del empleado
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="font-medium">Nombre</dt>
              <dd className="text-muted-foreground">{request.employeeName}</dd>
            </div>
            <div>
              <dt className="font-medium">Fecha de contratación</dt>
              <dd className="text-muted-foreground">{formatDate(request.hireDate)}</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Periodo solicitado
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="font-medium">Inicio</dt>
              <dd className="text-muted-foreground">{formatDate(request.startDate)}</dd>
            </div>
            <div>
              <dt className="font-medium">Fin</dt>
              <dd className="text-muted-foreground">{formatDate(request.endDate)}</dd>
            </div>
            <div>
              <dt className="font-medium">Total de días</dt>
              <dd className="text-muted-foreground">{dias}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Delegación de actividades
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div>
            <dt className="font-medium">Delegado</dt>
            <dd className="text-muted-foreground">{request.delegateName}</dd>
          </div>
          <div>
            <dt className="font-medium">Proyecto</dt>
            <dd className="text-muted-foreground">{request.delegateProject}</dd>
          </div>
          <div>
            <dt className="font-medium">Actividad específica</dt>
            <dd className="text-muted-foreground whitespace-pre-line">{request.delegateActivity}</dd>
          </div>
        </dl>
      </section>

      {request.status !== "pending" && (
        <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resolución
          </h2>
          <dl className="flex flex-col gap-2 text-sm">
            {request.approverName && (
              <div>
                <dt className="font-medium">Resuelta por</dt>
                <dd className="text-muted-foreground">{request.approverName}</dd>
              </div>
            )}
            {request.resolvedAt && (
              <div>
                <dt className="font-medium">Fecha de resolución</dt>
                <dd className="text-muted-foreground">{formatDate(request.resolvedAt)}</dd>
              </div>
            )}
            {request.status === "rejected" && request.rejectionReason && (
              <div>
                <dt className="font-medium">Motivo de rechazo</dt>
                <dd className="text-muted-foreground">{request.rejectionReason}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <VacationDetailActions
        request={request}
        canApprove={isApprover && request.status === "pending"}
      />
    </div>
  )
}
