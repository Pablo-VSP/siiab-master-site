"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Menu as MenuIcon, Pencil, Trash2 } from "lucide-react"
import type { MenuPerfil } from "@/lib/services/keymaster-crud"
import {
  createMenuPerfil,
  updateMenuPerfil,
  deleteMenuPerfil,
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

export function MenusClient({ perfiles }: { perfiles: MenuPerfil[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const [editing, setEditing] = useState<MenuPerfil | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formActive, setFormActive] = useState(true)

  const [deleteTarget, setDeleteTarget] = useState<MenuPerfil | null>(null)

  const filtered = useMemo(
    () =>
      perfiles.filter(
        (p) =>
          p.name.toLowerCase().includes(name.toLowerCase()) &&
          matchesStatus(status, p.active),
      ),
    [perfiles, name, status],
  )

  function openCreate() {
    setEditing(null)
    setFormName("")
    setFormActive(true)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(p: MenuPerfil) {
    setEditing(p)
    setFormName(p.name)
    setFormActive(p.active === 1)
    setError(null)
    setModalOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = editing
        ? await updateMenuPerfil(editing.pk_id, {
            name: formName,
            active: formActive ? 1 : 0,
          })
        : await createMenuPerfil({ name: formName, active: formActive ? 1 : 0 })
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setModalOpen(false)
        router.refresh()
      }
    })
  }

  function toggle(p: MenuPerfil) {
    startTransition(async () => {
      const r = await updateMenuPerfil(p.pk_id, { active: p.active === 1 ? 0 : 1 })
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const r = await deleteMenuPerfil(deleteTarget.pk_id)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <ConfigPageHeader title="Menús" icon={<MenuIcon className="size-7" />} />

      <ConfigToolbar
        textFilters={[{ id: "name", placeholder: "Nombre", value: name, onChange: setName }]}
        statusFilter={status}
        onStatusChange={setStatus}
        onAdd={openCreate}
        addTitle="Nuevo menú"
      />

      {error && !modalOpen && (
        <p className="mb-3 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#6b2a6b] text-white">
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-400">
                  No hay menús que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.pk_id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-500">{p.pk_id}</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">{p.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={p.active === 1} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <StatusToggle
                        active={p.active === 1}
                        onToggle={() => toggle(p)}
                        disabled={isPending}
                        label={`Cambiar estado de ${p.name}`}
                      />
                      <ActionButton title="Editar" onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </ActionButton>
                      <ActionButton
                        title="Eliminar"
                        variant="danger"
                        onClick={() => setDeleteTarget(p)}
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
        title={editing ? "Editar menú" : "Nuevo menú"}
      >
        <form onSubmit={submit}>
          {editing && (
            <p className="mb-4 text-sm text-zinc-400">Menú #{editing.pk_id}</p>
          )}
          {error && modalOpen && (
            <p className="mb-3 text-sm text-red-600">{error}</p>
          )}
          <div className="flex items-center gap-4">
            <div className="flex flex-1 items-center gap-2 rounded bg-zinc-100 px-3 py-2">
              <MenuIcon className="size-4 shrink-0 text-zinc-500" />
              <div className="flex-1">
                <label htmlFor="menu-name" className="block text-[10px] text-zinc-400">
                  Nombre del menú
                </label>
                <input
                  id="menu-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full bg-transparent text-sm text-zinc-800 outline-none"
                />
              </div>
            </div>
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
          </div>
          <ConfigModalActions
            onCancel={() => setModalOpen(false)}
            submitLabel={editing ? "Guardar cambios" : "Crear menú"}
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
        entity="menú"
      />
    </div>
  )
}
