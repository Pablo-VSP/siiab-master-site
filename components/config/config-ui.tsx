"use client"

import { cn } from "@/lib/utils"

// -----------------------------------------------------------------------------
// Primitivos visuales compartidos por las pantallas de Configuración.
// Replican la identidad morada de los mockups: cabeceras de tabla moradas,
// badges de estado verde/gris, switch de estado y botones de acción redondos.
// -----------------------------------------------------------------------------

/**
 * Morado de marca de estas pantallas (MyTools). Son variables CSS que cambian
 * con el modo oscuro (ver globals.css):
 *  - CONFIG_PURPLE:      superficies (cabeceras, botones) con texto blanco encima.
 *  - CONFIG_PURPLE_TEXT: texto, íconos y anillos de foco sobre el fondo de página.
 */
export const CONFIG_PURPLE = "var(--config-purple)"
export const CONFIG_PURPLE_TEXT = "var(--config-purple-text)"

/** Badge de estado Activo/Inactivo. */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  )
}

/** Switch de estado (verde = activo, gris = inactivo). */
export function StatusToggle({
  active,
  onToggle,
  disabled,
  label,
}: {
  active: boolean
  onToggle: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active ? "bg-green-500" : "bg-muted-foreground/30",
        disabled && "opacity-50",
      )}
      style={{ ["--tw-ring-color" as string]: CONFIG_PURPLE_TEXT }}
    >
      <span
        className={cn(
          "inline-block size-5 transform rounded-full bg-white shadow transition-transform",
          active ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

/** Botón de acción redondo (editar / eliminar / perfiles). */
export function ActionButton({
  children,
  onClick,
  title,
  variant = "neutral",
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  variant?: "neutral" | "danger" | "purple"
  disabled?: boolean
}) {
  const styles: Record<string, string> = {
    neutral: "text-muted-foreground hover:bg-muted",
    danger: "bg-red-500 text-white hover:bg-red-600",
    purple: "text-white",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2",
        styles[variant],
        disabled && "pointer-events-none opacity-50",
      )}
      style={
        variant === "purple" ? { backgroundColor: CONFIG_PURPLE } : undefined
      }
    >
      {children}
    </button>
  )
}

/** Botón "+" redondo para crear registros (esquina superior derecha). */
export function AddButton({
  onClick,
  title = "Agregar",
}: {
  onClick: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex size-12 items-center justify-center rounded-full border border-border bg-card text-2xl font-light text-muted-foreground shadow-sm transition-colors hover:text-foreground outline-none focus-visible:ring-2"
      style={{ ["--tw-ring-color" as string]: CONFIG_PURPLE_TEXT }}
    >
      +
    </button>
  )
}

/** Encabezado de página al estilo de los mockups: título morado + icono. */
export function ConfigPageHeader({
  title,
  icon,
}: {
  title: string
  icon?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <h1
        className="text-2xl font-bold tracking-tight"
        style={{ color: CONFIG_PURPLE_TEXT }}
      >
        {title}
      </h1>
      {icon ? (
        <div style={{ color: CONFIG_PURPLE_TEXT }} className="shrink-0">
          {icon}
        </div>
      ) : null}
    </header>
  )
}

/** Filtro de estado Todos/Activos/Inactivos para las barras de búsqueda. */
export type StatusFilter = "all" | "active" | "inactive"

export function matchesStatus(filter: StatusFilter, active: number): boolean {
  if (filter === "all") return true
  if (filter === "active") return active === 1
  return active === 0
}
