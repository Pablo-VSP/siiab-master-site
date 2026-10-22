"use client"

import { ConfigModal } from "./config-modal"

// Confirmación de borrado reutilizable, con el estilo de los modales morados.
export function ConfirmDelete({
  open,
  onClose,
  onConfirm,
  pending,
  name,
  entity,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  pending?: boolean
  name?: string
  entity: string
}) {
  return (
    <ConfigModal open={open} onClose={onClose} title={`Eliminar ${entity}`}>
      <p className="text-sm text-zinc-700">
        ¿Seguro que quieres eliminar{" "}
        <strong className="text-zinc-900">{name}</strong>? Esta acción no se puede
        deshacer.
      </p>
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold tracking-wide text-zinc-700 uppercase hover:text-zinc-900"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="rounded bg-red-600 px-5 py-2.5 text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
    </ConfigModal>
  )
}
