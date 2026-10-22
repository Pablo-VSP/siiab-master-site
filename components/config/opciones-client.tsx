"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ListChecks, Pencil, Trash2 } from "lucide-react"
import type { MenuOptionRow } from "@/lib/services/keymaster-crud"
import { iconFor } from "@/components/nav-items"
import {
  createMenuOption,
  updateMenuOption,
  deleteMenuOption,
  type MenuOptionInput,
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

const emptyForm: MenuOptionInput = {
  name: "",
  description: "",
  url: "",
  command: "",
  img: "",
  img_small: "",
  icon_name: "",
  external_url: "",
  active: 1,
}

export function OpcionesClient({ options }: { options: MenuOptionRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [ruta, setRuta] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const [editing, setEditing] = useState<MenuOptionRow | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<MenuOptionInput>(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<MenuOptionRow | null>(null)

  const filtered = useMemo(
    () =>
      options.filter(
        (o) =>
          o.name.toLowerCase().includes(name.toLowerCase()) &&
          (o.url ?? "").toLowerCase().includes(ruta.toLowerCase()) &&
          matchesStatus(status, o.active),
      ),
    [options, name, ruta, status],
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(o: MenuOptionRow) {
    setEditing(o)
    setForm({
      name: o.name,
      description: o.description ?? "",
      url: o.url ?? "",
      command: o.command ?? "",
      img: o.img ?? "",
      img_small: o.img_small ?? "",
      icon_name: o.icon_name ?? "",
      external_url: o.external_url ?? "",
      active: o.active,
    })
    setError(null)
    setModalOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: MenuOptionInput = {
      name: form.name,
      description: form.description || null,
      url: form.url || null,
      command: form.command || null,
      img: form.img || null,
      img_small: form.img_small || null,
      icon_name: form.icon_name || null,
      external_url: form.external_url || null,
      active: form.active,
    }
    startTransition(async () => {
      const r = editing
        ? await updateMenuOption(editing.pk_id, payload)
        : await createMenuOption(payload)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setModalOpen(false)
        router.refresh()
      }
    })
  }

  function toggle(o: MenuOptionRow) {
    startTransition(async () => {
      const r = await updateMenuOption(o.pk_id, { active: o.active === 1 ? 0 : 1 })
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const r = await deleteMenuOption(deleteTarget.pk_id)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <ConfigPageHeader title="Opciones de Menú" icon={<ListChecks className="size-7" />} />

      <ConfigToolbar
        textFilters={[
          { id: "name", placeholder: "Nombre", value: name, onChange: setName },
          { id: "ruta", placeholder: "Ruta", value: ruta, onChange: setRuta },
        ]}
        statusFilter={status}
        onStatusChange={setStatus}
        onAdd={openCreate}
        addTitle="Nueva opción"
      />

      {error && !modalOpen && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#6b2a6b] text-white">
              <th className="w-16 px-4 py-3 text-left font-semibold">Ícono</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Descripción</th>
              <th className="px-4 py-3 text-left font-semibold">Destino</th>
              <th className="px-4 py-3 text-left font-semibold">Comando</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-400">
                  No hay opciones que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const Icon = iconFor(o.icon_name)
                const isExternal = Boolean(o.external_url)
                const target = o.external_url || o.url
                return (
                  <tr key={o.pk_id} className="border-t border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-500">
                      <Icon className="size-4" />
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-800">{o.name}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-zinc-500">
                      {o.description ?? "—"}
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      {target ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium " +
                              (isExternal
                                ? "bg-amber-100 text-amber-700"
                                : "bg-zinc-100 text-zinc-500")
                            }
                          >
                            {isExternal ? "externa" : "interna"}
                          </span>
                          <span className="truncate font-mono text-xs text-zinc-500" title={target}>
                            {target}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {o.command ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={o.active === 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <StatusToggle
                          active={o.active === 1}
                          onToggle={() => toggle(o)}
                          disabled={isPending}
                          label={`Cambiar estado de ${o.name}`}
                        />
                        <ActionButton title="Editar" onClick={() => openEdit(o)}>
                          <Pencil className="size-4" />
                        </ActionButton>
                        <ActionButton
                          title="Eliminar"
                          variant="danger"
                          onClick={() => setDeleteTarget(o)}
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
        title={editing ? "Editar opción" : "Nueva opción"}
        width="max-w-2xl"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {editing && <p className="text-sm text-zinc-400">Opción #{editing.pk_id}</p>}
          {error && modalOpen && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="op-name">
              <input
                id="op-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
                className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
              />
            </Field>
            <Field label="Comando" htmlFor="op-cmd">
              <input
                id="op-cmd"
                value={form.command ?? ""}
                onChange={(e) => setForm({ ...form, command: e.target.value })}
                placeholder="Link"
                className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
              />
            </Field>
          </div>

          <Field label="Descripción" htmlFor="op-desc">
            <input
              id="op-desc"
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ruta interna (/…)" htmlFor="op-url">
              <input
                id="op-url"
                value={form.url ?? ""}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="/proyectos"
                className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
              />
            </Field>
            <Field label="URL externa (http…)" htmlFor="op-ext">
              <input
                id="op-ext"
                value={form.external_url ?? ""}
                onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                placeholder="https://…"
                className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <IconField
              value={form.icon_name ?? ""}
              onChange={(v) => setForm({ ...form, icon_name: v })}
            />
            <Field label="Imagen (URL)" htmlFor="op-img">
              <input
                id="op-img"
                value={form.img ?? ""}
                onChange={(e) => setForm({ ...form, img: e.target.value })}
                placeholder="https://…/img.png"
                className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Imagen pequeña (URL)" htmlFor="op-img-sm">
              <input
                id="op-img-sm"
                value={form.img_small ?? ""}
                onChange={(e) => setForm({ ...form, img_small: e.target.value })}
                placeholder="https://…/thumb.png"
                className="w-full rounded bg-zinc-100 px-3 py-2 text-sm text-zinc-800 outline-none"
              />
            </Field>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <StatusToggle
                  active={form.active === 1}
                  onToggle={() => setForm({ ...form, active: form.active === 1 ? 0 : 1 })}
                  label="Activo"
                />
                <span className="text-sm text-zinc-600">
                  {form.active === 1 ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <ConfigModalActions
            onCancel={() => setModalOpen(false)}
            submitLabel={editing ? "Guardar cambios" : "Crear opción"}
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
        entity="opción"
      />
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  )
}
