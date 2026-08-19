import type { VacationRequest, VacationStatus } from "./data/types"

export const statusLabels: Record<VacationStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
}

export function formatDate(iso: string): string {
  if (!iso) return "—"
  // iso puede ser YYYY-MM-DD o timestamp completo.
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function daysBetween(start: string, end: string): number {
  const s = new Date(start + "T00:00:00")
  const e = new Date(end + "T00:00:00")
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
}

// Genera asunto y cuerpo de correo prellenados (editables por el usuario).
export function buildEmailDraft(r: VacationRequest): { subject: string; body: string } {
  const dias = daysBetween(r.startDate, r.endDate)
  const subject = `Solicitud de vacaciones - ${r.employeeName} (${formatDate(r.startDate)} al ${formatDate(r.endDate)})`

  const estado = statusLabels[r.status]
  const lines = [
    `Estimados,`,
    ``,
    `Por medio del presente se notifica la solicitud de vacaciones con los siguientes datos:`,
    ``,
    `Empleado: ${r.employeeName}`,
    `Fecha de contratación: ${formatDate(r.hireDate)}`,
    `Periodo solicitado: ${formatDate(r.startDate)} al ${formatDate(r.endDate)} (${dias} día(s))`,
    `Estado: ${estado}`,
    ...(r.status === "rejected" && r.rejectionReason
      ? [`Motivo de rechazo: ${r.rejectionReason}`]
      : []),
    ...(r.approverName ? [`Resuelta por: ${r.approverName}`] : []),
    ``,
    `Delegación de actividades durante la ausencia:`,
    `- Delegado: ${r.delegateName}`,
    `- Proyecto: ${r.delegateProject}`,
    `- Actividad específica: ${r.delegateActivity}`,
    ``,
    `Se adjunta el documento PDF para firma de las autoridades involucradas.`,
    ``,
    `Saludos cordiales.`,
  ]

  return { subject, body: lines.join("\n") }
}

export function buildMailtoUrl(to: string[], subject: string, body: string): string {
  const params = new URLSearchParams()
  params.set("subject", subject)
  params.set("body", body)
  const query = params.toString().replace(/\+/g, "%20")
  return `mailto:${to.join(",")}?${query}`
}
