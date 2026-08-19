"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { User, RoleName } from "@/lib/data/types"
import { roleLabels } from "@/lib/role-labels"
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Pencil, Trash2, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface UserFormData {
  name: string
  email: string
  role: RoleName
  password: string
  hireDate: string
}

const emptyForm: UserFormData = {
  name: "",
  email: "",
  role: "employee",
  password: "",
  hireDate: new Date().toISOString().slice(0, 10),
}

export function AdminUsersClient({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm)

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  function openCreate() {
    setEditingUser(null)
    setForm(emptyForm)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      hireDate: user.hireDate,
    })
    setError(null)
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload: Record<string, string | undefined> = {
      name: form.name,
      email: form.email,
      role: form.role,
      hireDate: form.hireDate,
    }
    if (form.password) payload.password = form.password

    startTransition(async () => {
      const result = editingUser
        ? await updateUserAction(editingUser.id, payload)
        : await createUserAction({ ...payload, password: form.password })

      if (!result.ok) {
        setError(result.error ?? "Error")
      } else {
        setDialogOpen(false)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    setError(null)
    startTransition(async () => {
      const result = await deleteUserAction(deleteTarget.id)
      if (!result.ok) setError(result.error ?? "Error al eliminar")
      else {
        setDeleteTarget(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Administración
        </Link>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las cuentas del portal.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Nuevo usuario
          </Button>
        </header>
      </div>

      {error && !dialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Contratación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabels[u.role]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.hireDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    {u.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario. Deja la contraseña vacía para mantener la actual."
                : "Completa los datos para crear una nueva cuenta."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && dialogOpen && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-role">Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as RoleName })}
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="approver">Encargado</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-hire">Fecha de contratación</Label>
              <Input
                id="user-hire"
                type="date"
                value={form.hireDate}
                onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-pass">
                Contraseña{editingUser ? " (dejar vacía para no cambiar)" : ""}
              </Label>
              <Input
                id="user-pass"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={editingUser ? 0 : 4}
                required={!editingUser}
                placeholder={editingUser ? "••••••••" : ""}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                {editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a <strong>{deleteTarget?.name}</strong> y todos sus permisos asignados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
