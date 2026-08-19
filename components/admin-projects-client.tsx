"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Project, Resource, ResourceType } from "@/lib/data/types"
import {
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createResourceAction,
  updateResourceAction,
  deleteResourceAction,
} from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
  FolderKanban,
  BarChart3,
  Globe,
} from "lucide-react"

interface ProjectForm {
  name: string
  description: string
  logoUrl: string
}

interface ResourceForm {
  projectId: string
  title: string
  type: ResourceType
  url: string
  description: string
}

export function AdminProjectsClient({
  projects,
  resources,
}: {
  projects: Project[]
  resources: Resource[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Project dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectForm>({ name: "", description: "", logoUrl: "" })

  // Resource dialog state
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [resourceForm, setResourceForm] = useState<ResourceForm>({
    projectId: "",
    title: "",
    type: "report",
    url: "",
    description: "",
  })

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "project" | "resource"; id: string; name: string } | null>(null)

  // Expanded project (to see resources)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  function openCreateProject() {
    setEditingProject(null)
    setProjectForm({ name: "", description: "", logoUrl: "" })
    setError(null)
    setProjectDialogOpen(true)
  }

  function openEditProject(p: Project) {
    setEditingProject(p)
    setProjectForm({ name: p.name, description: p.description, logoUrl: p.logoUrl ?? "" })
    setError(null)
    setProjectDialogOpen(true)
  }

  function openCreateResource(projectId: string) {
    setEditingResource(null)
    setResourceForm({ projectId, title: "", type: "report", url: "", description: "" })
    setError(null)
    setResourceDialogOpen(true)
  }

  function openEditResource(r: Resource) {
    setEditingResource(r)
    setResourceForm({
      projectId: r.projectId,
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
    })
    setError(null)
    setResourceDialogOpen(true)
  }

  function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = editingProject
        ? await updateProjectAction(editingProject.id, projectForm)
        : await createProjectAction(projectForm)
      if (!result.ok) setError(result.error ?? "Error")
      else {
        setProjectDialogOpen(false)
        router.refresh()
      }
    })
  }

  function handleResourceSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = editingResource
        ? await updateResourceAction(editingResource.id, resourceForm)
        : await createResourceAction(resourceForm)
      if (!result.ok) setError(result.error ?? "Error")
      else {
        setResourceDialogOpen(false)
        router.refresh()
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result =
        deleteTarget.type === "project"
          ? await deleteProjectAction(deleteTarget.id)
          : await deleteResourceAction(deleteTarget.id)
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
            <h1 className="text-2xl font-semibold tracking-tight">Proyectos y Recursos</h1>
            <p className="text-sm text-muted-foreground">
              Administra el catálogo de proyectos, reportes y sitios web.
            </p>
          </div>
          <Button onClick={openCreateProject}>
            <Plus data-icon="inline-start" />
            Nuevo proyecto
          </Button>
        </header>
      </div>

      {error && !projectDialogOpen && !resourceDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {projects.map((p) => {
          const projectResources = resources.filter((r) => r.projectId === p.id)
          const isExpanded = expandedProject === p.id
          return (
            <div key={p.id} className="rounded-lg border border-border">
              <div className="flex items-center justify-between gap-4 p-4">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => setExpandedProject(isExpanded ? null : p.id)}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <FolderKanban className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {projectResources.length} recursos
                    </span>
                  </div>
                </button>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditProject(p)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget({ type: "project", id: p.id, name: p.name })}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recursos
                    </span>
                    <Button size="sm" variant="outline" onClick={() => openCreateResource(p.id)}>
                      <Plus className="size-3.5" data-icon="inline-start" />
                      Agregar recurso
                    </Button>
                  </div>
                  {projectResources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin recursos aún.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectResources.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.title}</TableCell>
                              <TableCell>
                                <Badge variant={r.type === "report" ? "default" : "secondary"} className="gap-1">
                                  {r.type === "report" ? <BarChart3 className="size-3" /> : <Globe className="size-3" />}
                                  {r.type === "report" ? "Reporte" : "Sitio"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => openEditResource(r)}>
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteTarget({ type: "resource", id: r.id, name: r.title })}
                                  >
                                    <Trash2 className="size-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Project dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
            <DialogDescription>
              {editingProject ? "Modifica los datos del proyecto." : "Crea un nuevo proyecto para el catálogo."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProjectSubmit} className="flex flex-col gap-4">
            {error && projectDialogOpen && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="proj-name">Nombre</Label>
              <Input
                id="proj-name"
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proj-desc">Descripción</Label>
              <Textarea
                id="proj-desc"
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                required
                minLength={5}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proj-logo">Logo (ruta en /logos/)</Label>
              <Input
                id="proj-logo"
                value={projectForm.logoUrl}
                onChange={(e) => setProjectForm({ ...projectForm, logoUrl: e.target.value })}
                placeholder="/logos/mi-proyecto.png"
              />
              <p className="text-xs text-muted-foreground">
                Coloca la imagen en public/logos/ y escribe la ruta aquí (ej. /logos/ventas.png)
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                {editingProject ? "Guardar" : "Crear proyecto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resource dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Editar recurso" : "Nuevo recurso"}</DialogTitle>
            <DialogDescription>
              {editingResource ? "Modifica los datos del recurso." : "Agrega un reporte o sitio web al proyecto."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResourceSubmit} className="flex flex-col gap-4">
            {error && resourceDialogOpen && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="res-title">Título</Label>
              <Input
                id="res-title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="res-type">Tipo</Label>
              <Select
                value={resourceForm.type}
                onValueChange={(v) => setResourceForm({ ...resourceForm, type: v as ResourceType })}
              >
                <SelectTrigger id="res-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="report">Reporte (Looker Studio)</SelectItem>
                  <SelectItem value="site">Sitio web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="res-url">URL</Label>
              <Input
                id="res-url"
                type="url"
                value={resourceForm.url}
                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="res-desc">Descripción</Label>
              <Textarea
                id="res-desc"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                required
                minLength={5}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setResourceDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                {editingResource ? "Guardar" : "Agregar recurso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {deleteTarget?.type === "project" ? "proyecto" : "recurso"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{deleteTarget?.name}</strong>
              {deleteTarget?.type === "project" && " junto con todos sus recursos y permisos asociados"}.
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
