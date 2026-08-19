"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { canApproveVacations } from "@/lib/permissions"
import { getStore } from "@/lib/data/store"
import { vacationRequestSchema, rejectSchema } from "@/lib/validation/vacation"

export interface ActionResult {
  ok: boolean
  error?: string
  id?: string
}

export async function createVacationRequestAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = vacationRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const created = await getStore().createVacationRequest({
    userId: user.id,
    employeeName: parsed.data.employeeName,
    hireDate: parsed.data.hireDate,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    delegateName: parsed.data.delegateName,
    delegateProject: parsed.data.delegateProject,
    delegateActivity: parsed.data.delegateActivity,
  })

  revalidatePath("/vacations")
  revalidatePath("/vacations/inbox")
  return { ok: true, id: created.id }
}

export async function approveVacationAction(id: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!canApproveVacations(user)) {
    return { ok: false, error: "No tienes permiso para aprobar solicitudes" }
  }

  const request = await getStore().getVacationRequestById(id)
  if (!request) return { ok: false, error: "Solicitud no encontrada" }
  if (request.status !== "pending") {
    return { ok: false, error: "La solicitud ya fue resuelta" }
  }

  await getStore().updateVacationRequest(id, {
    status: "approved",
    approverId: user.id,
    approverName: user.name,
    rejectionReason: null,
    resolvedAt: new Date().toISOString(),
  })

  revalidatePath("/vacations")
  revalidatePath("/vacations/inbox")
  revalidatePath(`/vacations/${id}`)
  return { ok: true, id }
}

export async function rejectVacationAction(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const user = await requireUser()
  if (!canApproveVacations(user)) {
    return { ok: false, error: "No tienes permiso para rechazar solicitudes" }
  }

  const parsed = rejectSchema.safeParse({ reason })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Motivo inválido" }
  }

  const request = await getStore().getVacationRequestById(id)
  if (!request) return { ok: false, error: "Solicitud no encontrada" }
  if (request.status !== "pending") {
    return { ok: false, error: "La solicitud ya fue resuelta" }
  }

  await getStore().updateVacationRequest(id, {
    status: "rejected",
    approverId: user.id,
    approverName: user.name,
    rejectionReason: parsed.data.reason,
    resolvedAt: new Date().toISOString(),
  })

  revalidatePath("/vacations")
  revalidatePath("/vacations/inbox")
  revalidatePath(`/vacations/${id}`)
  return { ok: true, id }
}
