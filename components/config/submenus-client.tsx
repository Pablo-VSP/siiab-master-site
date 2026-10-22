"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FolderOpen, Pencil, Trash2 } from "lucide-react"
import type { MenuMenu } from "@/lib/services/keymaster-crud"
import { iconFor } from "@/components/nav-items"
import {
  createMenuMenu,
  updateMenuMenu,
  deleteMenuMenu,
} from "@/app/actions/menu-admin"
import {
  ConfigPageHeader,
  StatusBadge,
  StatusToggle,
  ActionButton,
  matchesStatus,
  type StatusFilter,
} from "./config-ui"
import { ConfigToolbar } from "./config-table"
import { ConfigModal, ConfigModalActions } from "./config-modal"
import { ConfirmDelete } from "./confirm-delete"
import { IconField } from "./icon-field"

export function SubmenusClient({ menus }: { menus: MenuMenu[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const [editing, setEditing] = useState<MenuMenu | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formIcon, setFormIcon] = useState("")
  const [formActive, setFormActive] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<MenuMenu | null>(null)

  const filtered = useMemo(
    () =>
      menus.filter(
        (m) =>
          m.name.toLowerCase().includes(name.toLowerCase()) &&
          matchesStatus(status, m.active),
      ),
    [menus, name, status],
  )

  function openCreate() {
    setEditing(null)
    setFormName("")
    setFormIcon("")
    setFormActive(true)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(m: MenuMenu) {
    setEditing(m)
    setFormName(m.name)
    setFormIcon(m.icon_name ?? "")
    setFormActive(m.active === 1)
    setError(null)
    setModalOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      name: formName,
      icon_name: formIcon.trim() || null,
      active: formActive ? 1 : 0,
    }
    startTransition(async () => {
      const r = editing
        ? await updateMenuMenu(editing.pk_id, payload)
        : await createMenuMenu(payload)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setModalOpen(false)
        router.refresh()
      }
    })
  }

  function toggle(m: MenuMenu) {
    startTransition(async () => {
      const r = await updateMenuMenu(m.pk_id, { active: m.active === 1 ? 0 : 1 })
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const r = await deleteMenuMenu(deleteTarget.pk_id)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <ConfigPageHeader title="Submenús" icon={<FolderOpen className="size-7" />} />

      <ConfigToolbar
        textFilters={[{ id: "name", placeholder: "Nombre", value: name, onChange: setName }]}
        statusFilter={status}
        onStatusChange={setStatus}
        onAdd={openCreate}
        addTitle="Nuevo submenú"
      />

      {error && !modalOpen && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#6b2a6b] text-white">
              <th className="w-16 px-4 py-3 text-left font-semibold">Ícono</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-400">
                  No hay submenús que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const Icon = iconFor(m.icon_name)
                return (
                  <tr key={m.pk_id} className="border-t border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">
                      <Icon className="size-4" />
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{m.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={m.active === 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <StatusToggle
                          active={m.active === 1}
                          onToggle={() => toggle(m)}
                          disabled={isPending}
                          label={`Cambiar estado de ${m.name}`}
                        />
                        <ActionButton title="Editar" onClick={() => openEdit(m)}>
                          <Pencil className="size-4" />
                        </ActionButton>
                        <ActionButton
                          title="Eliminar"
                          variant="danger"
                          onClick={() => setDeleteTarget(m)}
                        >
                          <Trash2 className="size-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfigModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar submenú" : "Nuevo submenú"}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {editing && <p className="text-sm text-zinc-400">Submenú #{editing.pk_id}</p>}
          {error && modalOpen && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-1">
            <label htmlFor="sm-name" className="text-xs text-zinc-500">
              Nombre del submenú
            </label>
            <input
              id="sm-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              minLength={2}
              className="rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
            />
          </div>

          <IconField value={formIcon} onChange={setFormIcon} />

          <div className="flex items-center gap-2">
            <StatusToggle
              active={formActive}
              onToggle={() => setFormActive((v) => !v)}
              label="Activo"
            />
            <span className="text-sm text-zinc-600">
              {formActive ? "Activo" : "Inactivo"}
            </span>
          </div>

          <ConfigModalActions
            onCancel={() => setModalOpen(false)}
            submitLabel={editing ? "Guardar cambios" : "Crear submenú"}
            pending={isPending}
          />
        </form>
      </ConfigModal>

      <ConfirmDelete
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        pending={isPending}
        name={deleteTarget?.name}
        entity="submenú"
      />
    </div>
  )
}
