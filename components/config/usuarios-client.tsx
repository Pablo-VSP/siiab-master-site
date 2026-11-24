"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Users, Pencil, Trash2, UserCog } from "lucide-react"
import type {
  SecurityUser,
  MenuPerfil,
  MenuPerfilUser,
} from "@/lib/services/keymaster-crud"
import {
  createSecurityUser,
  updateSecurityUser,
  deleteSecurityUser,
  type SecurityUserInput,
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
import { UserProfilesModal } from "./user-profiles-modal"

interface Form extends SecurityUserInput {
  password: string
}

const emptyForm: Form = {
  login: "",
  password: "",
  name: "",
  last_name: "",
  email: "",
  cell_phone: "",
  active: 1,
}

export function UsuariosClient({
  users,
  perfiles,
  assignments,
}: {
  users: SecurityUser[]
  perfiles: MenuPerfil[]
  assignments: MenuPerfilUser[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [login, setLogin] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const [editing, setEditing] = useState<SecurityUser | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<Form>(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<SecurityUser | null>(null)
  const [profilesUser, setProfilesUser] = useState<SecurityUser | null>(null)

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(name.toLowerCase()) &&
          u.login.toLowerCase().includes(login.toLowerCase()) &&
          (u.email ?? "").toLowerCase().includes(email.toLowerCase()) &&
          matchesStatus(status, u.active),
      ),
    [users, name, login, email, status],
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(u: SecurityUser) {
    setEditing(u)
    setForm({
      login: u.login,
      password: "",
      name: u.name,
      last_name: u.last_name ?? "",
      email: u.email ?? "",
      cell_phone: u.cell_phone ?? "",
      active: u.active,
    })
    setError(null)
    setModalOpen(true)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const base: SecurityUserInput = {
      login: form.login,
      name: form.name,
      last_name: form.last_name || null,
      email: form.email || null,
      cell_phone: form.cell_phone || null,
      active: form.active,
    }
    startTransition(async () => {
      const r = editing
        ? await updateSecurityUser(editing.pk_id, {
            ...base,
            ...(form.password ? { password: form.password } : {}),
          })
        : await createSecurityUser({ ...base, password: form.password })
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setModalOpen(false)
        router.refresh()
      }
    })
  }

  function toggle(u: SecurityUser) {
    startTransition(async () => {
      const r = await updateSecurityUser(u.pk_id, { active: u.active === 1 ? 0 : 1 })
      if (!r.ok) setError(r.error ?? "Error")
      else router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const r = await deleteSecurityUser(deleteTarget.pk_id)
      if (!r.ok) setError(r.error ?? "Error")
      else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div>
      <ConfigPageHeader title="Usuarios" icon={<Users className="size-7" />} />

      <ConfigToolbar
        textFilters={[
          { id: "name", placeholder: "Nombre", value: name, onChange: setName },
          { id: "login", placeholder: "Login", value: login, onChange: setLogin },
          { id: "email", placeholder: "Correo", value: email, onChange: setEmail },
        ]}
        statusFilter={status}
        onStatusChange={setStatus}
        onAdd={openCreate}
        addTitle="Nuevo usuario"
      />

      {error && !modalOpen && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-config text-white">
              <th className="px-4 py-3 text-left font-semibold">Clave</th>
              <th className="px-4 py-3 text-left font-semibold">Login</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Correo</th>
              <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No hay usuarios que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.pk_id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-muted-foreground">{u.pk_id}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{u.login}</td>
                  <td className="px-4 py-3 text-foreground">
                    {u.name} {u.last_name ?? ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.cell_phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={u.active === 1} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <StatusToggle
                        active={u.active === 1}
                        onToggle={() => toggle(u)}
                        disabled={isPending}
                        label={`Cambiar estado de ${u.name}`}
                      />
                      <ActionButton
                        title="Perfiles del usuario"
                        variant="purple"
                        onClick={() => setProfilesUser(u)}
                      >
                        <UserCog className="size-4" />
                      </ActionButton>
                      <ActionButton title="Editar" onClick={() => openEdit(u)}>
                        <Pencil className="size-4" />
                      </ActionButton>
                      <ActionButton
                        title="Eliminar"
                        variant="danger"
                        onClick={() => setDeleteTarget(u)}
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
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        width="max-w-lg"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {editing && <p className="text-sm text-muted-foreground">Usuario #{editing.pk_id}</p>}
          {error && modalOpen && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <UField label="Login" htmlFor="u-login">
              <input
                id="u-login"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                required
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              />
            </UField>
            <UField
              label={editing ? "Contraseña (vacía = sin cambio)" : "Contraseña"}
              htmlFor="u-pass"
            >
              <input
                id="u-pass"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                placeholder={editing ? "••••••" : ""}
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              />
            </UField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <UField label="Nombre" htmlFor="u-name">
              <input
                id="u-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              />
            </UField>
            <UField label="Apellido" htmlFor="u-last">
              <input
                id="u-last"
                value={form.last_name ?? ""}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              />
            </UField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <UField label="Correo" htmlFor="u-email">
              <input
                id="u-email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              />
            </UField>
            <UField label="Teléfono" htmlFor="u-phone">
              <input
                id="u-phone"
                value={form.cell_phone ?? ""}
                onChange={(e) => setForm({ ...form, cell_phone: e.target.value })}
                className="w-full rounded bg-muted px-3 py-2 text-sm text-foreground outline-none"
              />
            </UField>
          </div>

          <div className="flex items-center gap-2">
            <StatusToggle
              active={form.active === 1}
              onToggle={() => setForm({ ...form, active: form.active === 1 ? 0 : 1 })}
              label="Activo"
            />
            <span className="text-sm text-muted-foreground">
              {form.active === 1 ? "Activo" : "Inactivo"}
            </span>
          </div>

          <ConfigModalActions
            onCancel={() => setModalOpen(false)}
            submitLabel={editing ? "Guardar cambios" : "Crear usuario"}
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
        entity="usuario"
      />

      <UserProfilesModal
        open={!!profilesUser}
        onClose={() => setProfilesUser(null)}
        user={profilesUser}
        perfiles={perfiles}
        assignments={assignments}
      />
    </div>
  )
}

function UField({
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
      <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}
