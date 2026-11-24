"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONFIG_PURPLE, AddButton, type StatusFilter } from "./config-ui"

// -----------------------------------------------------------------------------
// Barra de búsqueda + tabla con cabecera morada, compartidas por las pantallas
// de lista de Configuración. La barra admite varios campos de texto y un filtro
// de estado (Todos / Activos / Inactivos).
// -----------------------------------------------------------------------------

export interface TextFilter {
  id: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}

export function ConfigToolbar({
  textFilters,
  statusFilter,
  onStatusChange,
  onSearch,
  onAdd,
  addTitle,
}: {
  textFilters: TextFilter[]
  statusFilter: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  onSearch?: () => void
  onAdd: () => void
  addTitle?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {textFilters.map((f) => (
        <div
          key={f.id}
          className="flex min-w-[180px] flex-1 items-center gap-2 rounded-md bg-muted px-3 py-2"
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label={f.placeholder}
            placeholder={f.placeholder}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      ))}

      <div className="flex min-w-[180px] items-center gap-2 rounded-md bg-muted px-3 py-1.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-[10px] leading-tight text-muted-foreground">Estado</span>
          <select
            aria-label="Filtrar por estado"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
            className="bg-transparent text-sm text-foreground outline-none"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onSearch}
        title="Buscar"
        aria-label="Buscar"
        className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <Search className="size-5" />
      </button>

      <AddButton onClick={onAdd} title={addTitle} />
    </div>
  )
}

export interface Column<T> {
  key: string
  header: string
  className?: string
  render: (row: T) => React.ReactNode
}

export function ConfigTable<T>({
  columns,
  rows,
  rowKey,
  empty = "No hay registros.",
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  empty?: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ backgroundColor: CONFIG_PURPLE }} className="text-white">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-4 py-3 text-left font-semibold whitespace-nowrap",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-t border-border hover:bg-muted/50"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
