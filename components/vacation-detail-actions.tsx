"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { approveVacationAction, rejectVacationAction } from "@/app/actions/vacations"
import { generateVacationPdf } from "@/lib/pdf"
import { buildEmailDraft, buildMailtoUrl } from "@/lib/vacation-format"
import type { VacationRequest } from "@/lib/data/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  FileDown,
  Mail,
  Loader2,
  Send,
} from "lucide-react"

export function VacationDetailActions({
  request,
  canApprove,
}: {
  request: VacationRequest
  canApprove: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [emailOpen, setEmailOpen] = useState(false)

  const draft = buildEmailDraft(request)
  const [emailTo, setEmailTo] = useState("")
  const [emailBody, setEmailBody] = useState(draft.body)
  const [emailSubject, setEmailSubject] = useState(draft.subject)

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const result = await approveVacationAction(request.id)
      if (!result.ok) setError(result.error ?? "Error al aprobar")
      else router.refresh()
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await rejectVacationAction(request.id, rejectReason)
      if (!result.ok) setError(result.error ?? "Error al rechazar")
      else {
        setRejectOpen(false)
        router.refresh()
      }
    })
  }

  function handlePdf() {
    generateVacationPdf(request)
  }

  function handleMailto() {
    const recipients = emailTo
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const url = buildMailtoUrl(recipients, emailSubject, emailBody)
    window.open(url, "_blank")
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handlePdf}>
          <FileDown data-icon="inline-start" />
          Exportar PDF
        </Button>

        <Button variant="outline" onClick={() => setEmailOpen(true)}>
          <Mail data-icon="inline-start" />
          Generar correo
        </Button>

        {canApprove && (
          <>
            <Button onClick={handleApprove} disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <CheckCircle2 data-icon="inline-start" />
              )}
              Aprobar
            </Button>

            <Button
              variant="destructive"
              onClick={() => setRejectOpen(true)}
              disabled={isPending}
            >
              <XCircle data-icon="inline-start" />
              Rechazar
            </Button>
          </>
        )}
      </div>

      {/* Dialog de rechazo */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo. El empleado lo verá en el detalle de su solicitud.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo (mín. 5 caracteres)..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending || rejectReason.length < 5}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <XCircle data-icon="inline-start" />
                )}
                Confirmar rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de correo */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generar correo</DialogTitle>
            <DialogDescription>
              Edita el contenido del correo antes de enviarlo. Se abrirá tu cliente de correo con los datos prellenados.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-to">Destinatarios (separados por coma)</Label>
              <Input
                id="email-to"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="rrhh@empresa.com, jefe@empresa.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-subject">Asunto</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-body">Cuerpo del correo</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleMailto} disabled={!emailTo.trim()}>
                <Send data-icon="inline-start" />
                Abrir en cliente de correo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
