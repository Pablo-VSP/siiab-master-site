import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { canApproveVacations } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getStore } from "@/lib/data/store"
import { formatDate, statusLabels } from "@/lib/vacation-format"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Inbox, ArrowRight } from "lucide-react"
import type { VacationStatus } from "@/lib/data/types"

const statusVariant: Record<VacationStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
}

export default async function VacationInboxPage() {
  const user = await requireUser()
  if (!canApproveVacations(user)) redirect("/")

  const allRequests = await getStore().listVacationRequests()
  // Mostrar pendientes primero, luego resueltas recientes
  const pending = allRequests.filter((r) => r.status === "pending")
  const resolved = allRequests.filter((r) => r.status !== "pending").slice(0, 10)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bandeja de aprobación</h1>
        <p className="text-sm text-muted-foreground">
          Solicitudes de vacaciones pendientes de revisión.
        </p>
      </header>

      {pending.length === 0 && resolved.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Sin solicitudes</EmptyTitle>
            <EmptyDescription>
              No hay solicitudes de vacaciones en este momento.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-8">
          {pending.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pendientes ({pending.length})
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Delegado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell>
                          {formatDate(r.startDate)} — {formatDate(r.endDate)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.delegateName}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" render={<Link href={`/vacations/${r.id}`} />}>
                            Revisar
                            <ArrowRight className="size-3.5" data-icon="inline-end" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Resueltas recientemente
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolved.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell>
                          {formatDate(r.startDate)} — {formatDate(r.endDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[r.status]}>
                            {statusLabels[r.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" render={<Link href={`/vacations/${r.id}`} />}>
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
