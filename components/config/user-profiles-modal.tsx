"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Menu as MenuIcon, X, CheckCircle2, PlusCircle } from "lucide-react"
import type {
  SecurityUser,
  MenuPerfil,
  MenuPerfilUser,
} from "@/lib/services/keymaster-crud"
import {
  createMenuPerfilUser,
  deleteMenuPerfilUser,
} from "@/app/actions/menu-admin"
import { ConfigModal } from "./config-modal"
import { CONFIG_PURPLE, CONFIG_PURPLE_TEXT } from "./config-ui"

// Modal "Perfiles del usuario": muestra los menús (perfiles) asignados al
// usuario y permite agregar/quitar. Calca el mockup del escudito.
export function UserProfilesModal({
  open,
  onClose,
  user,
  perfiles,
  assignments,
}: {
  open: boolean
  onClose: () => void
  user: SecurityUser | null
  perfiles: MenuPerfil[]
  assignments: MenuPerfilUser[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string>("")

  if (!user) return null

  const userAssignments = assignments.filter(
    (a) => a.security_user_id === user.pk_id && a.active === 1,
  )
  const assignedMenuIds = new Set(userAssignments.map((a) => a.menu_id))
  const available = perfiles.filter(
    (p) => p.active === 1 && !assignedMenuIds.has(p.pk_id),
  )

  function add() {
    if (!selected || !user) return
    setError(null)
    startTransition(async () => {
      const r = await createMenuPerfilUser({
        security_user_id: user.pk_id,
        menu_id: Number(selected),
        active: 1,
      })
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setSelected("")
        router.refresh()
      }
    })
  }

  function remove(assignmentPk: number) {
    setError(null)
    startTransition(async () => {
      const r = await deleteMenuPerfilUser(assignmentPk)
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  return (
    <ConfigModal open={open} onClose={onClose} title="Perfiles del usuario">
      <p className="mb-4 text-sm text-muted-foreground">
        {user.name} {user.last_name ?? ""}{" "}
        <span className="text-muted-foreground">({user.login})</span>
      </p>

      <div
        className="mb-2 flex items-center gap-2 text-sm font-semibold"
        style={{ color: CONFIG_PURPLE_TEXT }}
      >
        <CheckCircle2 className="size-4" />
        Menús asignados
      </div>
      <div className="divide-y divide-border border-y border-border">
        {userAssignments.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">Sin menús asignados.</p>
        ) : (
          userAssignments.map((a) => (
            <div key={a.pk_id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <MenuIcon className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {a.menus?.name ??
                    perfiles.find((p) => p.pk_id === a.menu_id)?.name ??
                    `Menú #${a.menu_id}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(a.pk_id)}
                disabled={isPending}
                aria-label="Quitar menú"
                className="inline-flex size-7 items-center justify-center rounded-full text-white disabled:opacity-50"
                style={{ backgroundColor: CONFIG_PURPLE }}
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div
        className="mt-5 mb-2 flex items-center gap-2 text-sm font-semibold"
        style={{ color: CONFIG_PURPLE_TEXT }}
      >
        <PlusCircle className="size-4" />
        Agregar menú
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded bg-muted px-3 py-2">
          <MenuIcon className="size-4 shrink-0 text-muted-foreground" />
          <select
            aria-label="Seleccionar menú"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          >
            <option value="">Seleccionar menú</option>
            {available.map((p) => (
              <option key={p.pk_id} value={p.pk_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!selected || isPending}
          aria-label="Agregar menú seleccionado"
          className="inline-flex size-11 items-center justify-center rounded-full text-2xl font-light text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#e08a8a" }}
        >
          +
        </button>
      </div>
    </ConfigModal>
  )
}
