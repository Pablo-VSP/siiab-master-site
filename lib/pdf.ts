import { jsPDF } from "jspdf"
import type { VacationRequest } from "./data/types"
import { formatDate, daysBetween, statusLabels } from "./vacation-format"

// Genera y descarga un PDF de la solicitud de vacaciones, con espacios de
// firma para las autoridades involucradas. Se ejecuta en el navegador.
export function generateVacationPdf(r: VacationRequest): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 56
  let y = 64

  const line = (text: string, size = 11, style: "normal" | "bold" = "normal", gap = 18) => {
    doc.setFont("helvetica", style)
    doc.setFontSize(size)
    doc.text(text, marginX, y)
    y += gap
  }

  const labelValue = (label: string, value: string) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text(label, marginX, y)
    const labelWidth = doc.getTextWidth(label)
    doc.setFont("helvetica", "normal")
    const wrapped = doc.splitTextToSize(value, pageWidth - marginX * 2 - labelWidth - 8)
    doc.text(wrapped, marginX + labelWidth + 8, y)
    y += Math.max(18, wrapped.length * 15)
  }

  // Encabezado
  doc.setFillColor(60, 66, 150)
  doc.rect(0, 0, pageWidth, 8, "F")

  line("SOLICITUD DE VACACIONES", 18, "bold", 12)
  doc.setDrawColor(210)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 24

  // Datos del empleado
  line("Datos del empleado", 13, "bold", 20)
  labelValue("Nombre:", r.employeeName)
  labelValue("Fecha de contratación:", formatDate(r.hireDate))
  y += 8

  // Periodo
  line("Periodo solicitado", 13, "bold", 20)
  labelValue("Del:", formatDate(r.startDate))
  labelValue("Al:", formatDate(r.endDate))
  labelValue("Total de días:", String(daysBetween(r.startDate, r.endDate)))
  labelValue("Estado:", statusLabels[r.status])
  if (r.status === "rejected" && r.rejectionReason) {
    labelValue("Motivo de rechazo:", r.rejectionReason)
  }
  if (r.approverName) {
    labelValue("Resuelta por:", r.approverName)
  }
  y += 8

  // Delegación
  line("Delegación de actividades", 13, "bold", 20)
  labelValue("Delegado:", r.delegateName)
  labelValue("Proyecto:", r.delegateProject)
  labelValue("Actividad específica:", r.delegateActivity)
  y += 24

  // Firmas
  doc.setDrawColor(210)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 40

  const colWidth = (pageWidth - marginX * 2 - 40) / 2
  const drawSignature = (x: number, label: string) => {
    doc.setDrawColor(120)
    doc.line(x, y, x + colWidth, y)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(label, x, y + 16)
  }

  drawSignature(marginX, "Firma del empleado")
  drawSignature(marginX + colWidth + 40, "Firma del encargado")
  y += 80

  drawSignature(marginX, "Firma de Recursos Humanos")
  drawSignature(marginX + colWidth + 40, "Firma de la Dirección")

  // Pie
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Documento generado el ${new Date().toLocaleString("es-MX")} · Folio: ${r.id}`,
    marginX,
    doc.internal.pageSize.getHeight() - 40,
  )

  const safeName = r.employeeName.replace(/\s+/g, "_")
  doc.save(`solicitud_vacaciones_${safeName}.pdf`)
}
