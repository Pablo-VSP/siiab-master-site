"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Project, ProjectPermission, User, ProjectAccess } from "@/lib/data/types"
import { roleLabels } from "@/lib/role-labels"
import { setPermissionAction, removePermissionAction } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Shield, X } from "lucide-react"

const accessLabels: Record<ProjectAccess, string> = {
  view: "Ver",
  manage: "Gestionar",
}

export function AdminPermissionsClient({
  users,
  projects,
  permissions,
}: {
  users: User[]
  projects: Project[]
  permissions: ProjectPermission[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string>(
    users.find((u) => u.role !== "admin")?.id ?? users[0]?.id ?? ""
  )

  // Los admin no necesitan permisos explícitos (ven todo)
  const nonAdminUsers = users.filter((u) => u.role !== "admin")

  const userPermissions = permissions.filter((p) => p.userId === selectedUser)
  const permMap = new Map(userPermissions.map((p) => [p.projectId, p.access]))

  function handleSetPermission(projectId: string, access: ProjectAccess) {
    setError(null)
    startTransition(async () => {
      const result = await setPermissionAction({
        userId: selectedUser,
        projectId,
        access,
      })
      if (!result.ok) setError(result.error ?? "Error")
      else router.refresh()
    })
  }

  function handleRemovePermission(projectId: string) {
    setError(null)
    startTransition(async () => {
      const result = await removePermissionAction(selectedUser, projectId)
      if (!result.ok) setError(result.error ?? "Error")
      else router.refresh()
    })
  }

  const selectedUserData = users.find((u) => u.id === selectedUser)

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
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Permisos por Proyecto</h1>
          <p className="text-sm text-muted-foreground">
            Asigna el nivel de acceso de cada usuario a los proyectos del catálogo.
            Los administradores tienen acceso total implícito.
          </p>
        </header>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <label className="text-sm font-medium" htmlFor="perm-user-select">
            Seleccionar usuario
          </label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger id="perm-user-select">
              <SelectValue placeholder="Selecciona un usuario" />
            </SelectTrigger>
            <SelectContent>
              {nonAdminUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({roleLabels[u.role]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserData?.role === "admin" ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-4">
            <Shield className="size-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Los administradores tienen acceso completo a todos los proyectos sin necesidad de permisos explícitos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Acceso actual</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const currentAccess = permMap.get(p.id)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        {currentAccess ? (
                          <Badge variant={currentAccess === "manage" ? "default" : "secondary"}>
                            {accessLabels[currentAccess]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin acceso</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={currentAccess ?? "none"}
                            onValueChange={(v) => {
                              if (v === "none") handleRemovePermission(p.id)
                              else handleSetPermission(p.id, v as ProjectAccess)
                            }}
                            disabled={isPending}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin acceso</SelectItem>
                              <SelectItem value="view">Ver</SelectItem>
                              <SelectItem value="manage">Gestionar</SelectItem>
                            </SelectContent>
                          </Select>
                          {currentAccess && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemovePermission(p.id)}
                              disabled={isPending}
                              aria-label="Quitar acceso"
                            >
                              {isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5 text-destructive" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
