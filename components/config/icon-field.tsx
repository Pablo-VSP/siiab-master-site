"use client"

import { iconFor } from "@/components/nav-items"

// Nombres de ícono conocidos por el mapa de nav-items (los que el sidebar sabe
// renderizar). El usuario puede escribir cualquier otro, pero estos son los que
// se verán reflejados en la navegación.
const KNOWN_ICONS = [
  "dashboard",
  "home",
  "projects",
  "folder",
  "settings",
  "users",
  "chart",
  "report",
  "globe",
  "calendar",
  "inbox",
  "file",
  "link",
  "menu",
]

export function IconField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const Preview = iconFor(value || null)
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="icon-name" className="text-xs text-zinc-500">
        Ícono (nombre)
      </label>
      <div className="flex items-center gap-2 rounded bg-zinc-100 px-3 py-2">
        <Preview className="size-4 shrink-0 text-zinc-500" />
        <input
          id="icon-name"
          list="known-icons"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="settings, users, chart…"
          className="w-full bg-transparent text-sm text-zinc-800 outline-none"
        />
      </div>
      <datalist id="known-icons">
        {KNOWN_ICONS.map((i) => (
          <option key={i} value={i} />
        ))}
      </datalist>
    </div>
  )
}
