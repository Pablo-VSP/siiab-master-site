import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { getStore } from "@/lib/data/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CalendarDays, Plus, ArrowRight } from "lucide-react"
import { formatDate, statusLabels } from "@/lib/vacation-format"
import type { VacationStatus } from "@/lib/data/types"

const statusVariant: Record<VacationStatus, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
}

export default async function VacationsPage() {
  const user = await requireUser()
  const requests = await getStore().listVacationRequestsByUser(user.id)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Mis vacaciones</h1>
          <p className="text-sm text-muted-foreground">
            Historial de solicitudes de vacaciones.
          </p>
        </div>
        <Button render={<Link href="/vacations/new" />}>
          <Plus data-icon="inline-start" />
          Nueva solicitud
        </Button>
      </header>

      {requests.length === 0 ? (
        <Empty className="rounded-lg border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Sin solicitudes</EmptyTitle>
            <EmptyDescription>
              Aún no has creado ninguna solicitud de vacaciones.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/vacations/${r.id}`} className="group">
              <Card className="transition-colors group-hover:border-primary/50">
                <CardHeader className="flex-row items-center justify-between gap-4 pb-2">
                  <CardTitle className="text-base">
                    {formatDate(r.startDate)} — {formatDate(r.endDate)}
                  </CardTitle>
                  <Badge variant={statusVariant[r.status]}>
                    {statusLabels[r.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Delegado: {r.delegateName} · {r.delegateProject}
                  </p>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
