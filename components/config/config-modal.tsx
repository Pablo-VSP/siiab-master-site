"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { CONFIG_PURPLE } from "./config-ui"

// -----------------------------------------------------------------------------
// Modal con la cabecera morada y la X roja de los mockups ("Editar menú",
// "Perfiles del usuario"). Se usa en lugar del Dialog por defecto para calcar
// la identidad visual de las pantallas de Configuración.
// -----------------------------------------------------------------------------

export function ConfigModal({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} overflow-hidden rounded-lg bg-card shadow-2xl`}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ backgroundColor: CONFIG_PURPLE }}
        >
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-red-400 transition-colors hover:text-red-300"
          >
            <X className="size-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/** Fila de botones Cancelar / Guardar del pie del modal. */
export function ConfigModalActions({
  onCancel,
  submitLabel = "Guardar cambios",
  pending,
}: {
  onCancel: () => void
  submitLabel?: string
  pending?: boolean
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-6">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm font-semibold tracking-wide text-foreground uppercase hover:text-foreground"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded bg-red-600 px-5 py-2.5 text-sm font-semibold tracking-wide text-white uppercase transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </div>
  )
}
