"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Pencil, Trash2 } from "lucide-react"
import type {
  MenuPerfilUser,
  MenuPerfil,
  SecurityUser,
} from "@/lib/services/keymaster-crud"
import {
  createMenuPerfilUser,
  updateMenuPerfilUser,
  deleteMenuPerfilUser,
} from "@/app/actions/menu-admin"
import {
  ConfigPageHeader,
  StatusBadge,
  StatusToggle,
  ActionButton,
  matchesStatus,
  type StatusFilter,
} from "./config-ui"
import { AddButton } from "./config-ui"
import { ConfigModal, ConfigModalActions } from "./config-modal"
import { ConfirmDelete } from "./confirm-delete"
import { Search } from "lucide-react"

export function MenuUsuarioClient({
  assignments,
  users,
  perfiles,
}: {
  assignments: MenuPerfilUser[]
  users: SecurityUser[]
  perfiles: MenuPerfil[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [userFilter, setUserFilter] = useState("")
  const [menuFilter, setMenuFilter] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const [editing, setEditing] = useState<MenuPerfilUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formUser, setFormUser] = useState("")
  const [formMenu, setFormMenu] = useState("")
  const [formActive, setFormActive] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<MenuPerfilUser | null>(null)

  const userName = (a: MenuPerfilUser) =>
    a.security_user
      ? `${a.security_user.name} ${a.security_user.last_name ?? ""}`.trim()
      : users.find((u) => u.pk_id === a.security_user_id)?.name ?? `#${a.security_user_id}`
  const userLogin = (a: MenuPerfilUser) =>
    a.security_user?.login ??
    users.find((u) => u.pk_id === a.security_user_id)?.login ??
    ""
  const menuName = (a: MenuPerfilUser) =>
    a.menus?.name ?? perfiles.find((p) => p.pk_id === a.menu_id)?.name ?? `#${a.menu_id}`

  const filtered = useMemo(
    () =>
      assignments.filter(
        (a) =>
          userName(a).toLowerCase().includes(userFilter.toLowerCase()) &&
          menuName(a).toLowerCase().includes(menuFilter.toLowerCase()) &&
          matchesStatus(status, a.active),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assignments, userFilter, menuFilter, status],
  )

  function openCreate() {
    setEditing(null)
    setFormUser("")
    setFormMenu("")
    setFormActive(true)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(a: MenuPerfilUser) {
    setEditing(a)
    setFormUser(String(a.security_user_id))
    setFormMenu(String(a.menu_id))
    setFormActive(a.active === 1)
    setError(null)
    setModalOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!formUser || !formMenu) {
      setError("Selecciona usuario y menú.")
      return
    }
    startTransition(async () => {
      const r = editing
        ? await updateMenuPerfilUser(editing.pk_id, {
            security_user_id: Number(formUser),
            menu_id: Number(formMenu),
            active: formActive ? 1 : 0,
          })
        : await createMenuPerfilUser({
            security_user_id: Number(formUser),
            menu_id: Number(formMenu),
            active: formActive ? 1 : 0,
          })
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setModalOpen(false)
        router.refresh()
      }
    })
  }

  function toggle(a: MenuPerfilUser) {
    startTransition(async () => {
      const r = await updateMenuPerfilUser(a.pk_id, { active: a.active === 1 ? 0 : 1 })
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const r = await deleteMenuPerfilUser(deleteTarget.pk_id)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <ConfigPageHeader title="Menú por Usuario" icon={<KeyRound className="size-7" />} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SelectFilter
          label="Usuario"
          value={userFilter}
          onChange={setUserFilter}
          placeholder="Usuario"
        />
        <SelectFilter
          label="Menú"
          value={menuFilter}
          onChange={setMenuFilter}
          placeholder="Menú"
        />
        <div className="flex min-w-[180px] items-center gap-2 rounded-md bg-muted px-3 py-1.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[10px] leading-tight text-muted-foreground">Estado</span>
            <select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="bg-transparent text-sm text-foreground outline-none"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
        <AddButton onClick={openCreate} title="Nueva asignación" />
      </div>

      {error && !modalOpen && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-config text-white">
              <th className="px-4 py-3 text-left font-semibold">Usuario</th>
              <th className="px-4 py-3 text-left font-semibold">Menú</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No hay asignaciones que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.pk_id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-foreground">
                    {userName(a)}{" "}
                    <span className="text-muted-foreground">({userLogin(a)})</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{menuName(a)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={a.active === 1} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <StatusToggle
                        active={a.active === 1}
                        onToggle={() => toggle(a)}
                        disabled={isPending}
                        label="Cambiar estado"
                      />
                      <ActionButton title="Editar" onClick={() => openEdit(a)}>
                        <Pencil className="size-4" />
                      </ActionButton>
                      <ActionButton
                        title="Eliminar"
                        variant="danger"
                        onClick={() => setDeleteTarget(a)}
                      >
                        <Trash2 className="size-4" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar asignación" : "Nueva asignación"}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && modalOpen && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-col gap-1">
            <label htmlFor="mu-user" className="text-xs text-muted-foreground">
              Usuario
            </label>
            <select
              id="mu-user"
              value={formUser}
              onChange={(e) => setFormUser(e.target.value)}
              required
              className="rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="">Seleccionar usuario</option>
              {users.map((u) => (
                <option key={u.pk_id} value={u.pk_id}>
                  {u.name} {u.last_name ?? ""} ({u.login})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="mu-menu" className="text-xs text-muted-foreground">
              Menú
            </label>
            <select
              id="mu-menu"
              value={formMenu}
              onChange={(e) => setFormMenu(e.target.value)}
              required
              className="rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
            >
              <option value="">Seleccionar menú</option>
              {perfiles.map((p) => (
                <option key={p.pk_id} value={p.pk_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <StatusToggle
              active={formActive}
              onToggle={() => setFormActive((v) => !v)}
              label="Activo"
            />
            <span className="text-sm text-muted-foreground">
              {formActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <ConfigModalActions
            onCancel={() => setModalOpen(false)}
            submitLabel={editing ? "Guardar cambios" : "Crear asignación"}
            pending={isPending}
          />
        </form>
      </ConfigModal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={isPending}
        name={deleteTarget ? `${userName(deleteTarget)} → ${menuName(deleteTarget)}` : ""}
        entity="asignación"
      />
    </div>
  )
}

function SelectFilter({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md bg-muted px-3 py-2">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
