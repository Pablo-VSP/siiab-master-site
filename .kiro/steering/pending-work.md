---
inclusion: manual
---

# Trabajo Pendiente — AllForOne

## Estado Actual del Proyecto

### ✅ Completado

| Módulo | Detalle |
|--------|---------|
| **Data Layer** | Interfaz `DataStore`, `MemoryStore` con seed completo, `BigQueryStore` stub, `schema.sql`, tipos |
| **Auth** | Login/logout con JWT+cookie, `requireUser`, `requireRole`, `verifyPassword`, middleware de protección |
| **Permisos** | `isAdmin`, `canApproveVacations`, `getProjectAccess`, `canAccessProject`, `getAccessibleProjects` |
| **Login** | `app/login/page.tsx` con formulario funcional |
| **Layout App** | Sidebar + mobile nav filtrados por rol, guard de sesión |
| **Dashboard** | Página principal con stats y búsqueda global de recursos (`CatalogSearch`) |
| **Proyectos - Lista** | `app/(app)/projects/page.tsx` con cards por proyecto, conteos de recursos |
| **Proyectos - Detalle** | `app/(app)/projects/[id]/page.tsx` con reportes (iframe modal) y sitios (link externo) |
| **Componentes UI** | shadcn/ui completo: button, card, dialog, badge, input, table, tabs, toggle, skeleton, empty, etc. |
| **Report Viewer** | Modal con iframe para Looker Studio embebido |
| **Catalog Search** | Búsqueda client-side con filtro por tipo (todos/reportes/sitios) |
| **Vacaciones - Actions** | `createVacationRequestAction`, `approveVacationAction`, `rejectVacationAction` |
| **Vacaciones - Validación** | Esquemas Zod: `vacationRequestSchema`, `rejectSchema` |
| **PDF** | `lib/pdf.ts` — genera PDF con jsPDF (datos, delegación, firmas) |
| **Email Draft** | `lib/vacation-format.ts` — `buildEmailDraft`, `buildMailtoUrl`, formateo de fechas/estados |
| **Nav Items** | `buildNavItems()` con lógica de visibilidad por rol |

### 🚧 Pendiente — Módulo de Vacaciones (Páginas)

| Ruta | Descripción | Prioridad |
|------|-------------|-----------|
| `app/(app)/vacations/page.tsx` | Lista de "Mis solicitudes" del usuario actual + botón "Nueva solicitud". Mostrar estado con badge de color. | Alta |
| `app/(app)/vacations/new/page.tsx` | Formulario de nueva solicitud. Campos: nombre, fecha contratación (prellenados del user), periodo (inicio/fin), delegado (nombre, proyecto, actividad). Validar con `vacationRequestSchema`. Usar Server Action `createVacationRequestAction`. Redirigir al detalle tras éxito. | Alta |
| `app/(app)/vacations/[id]/page.tsx` | Detalle de solicitud: todos los datos, estado, badge. Botones: exportar PDF (client), generar correo (textarea editable + selección destinatarios + mailto). Si el usuario es approver y el status es pending: botones aprobar/rechazar (rechazar pide motivo obligatorio). | Alta |
| `app/(app)/vacations/inbox/page.tsx` | Bandeja de aprobación (solo approver/admin). Lista solicitudes pendientes de todos los usuarios. Acciones rápidas de aprobar/rechazar. Guard con `requireRole("admin", "approver")` o similar. | Alta |

#### Notas para Vacaciones

- El formulario `new` debe prellenar `employeeName` y `hireDate` del usuario en sesión.
- El detalle `[id]` debe verificar que el usuario sea el dueño de la solicitud O sea approver/admin.
- El componente de correo en `[id]` debe: mostrar textarea editable con el body pre-generado, permitir seleccionar/escribir destinatarios, tener vista previa, y botón que abra `mailto:`.
- El PDF se genera en el navegador — el botón debe estar en un componente `"use client"`.

### 🚧 Pendiente — Módulo de Administración

| Ruta | Descripción | Prioridad |
|------|-------------|-----------|
| `app/(app)/admin/page.tsx` | Panel principal de admin. Vista general con links a sub-secciones. Guard `requireRole("admin")`. | Media |
| `app/(app)/admin/users/page.tsx` | CRUD de usuarios: lista en tabla, crear/editar (dialog o página), eliminar con confirmación. No permitir eliminar el propio usuario. | Media |
| `app/(app)/admin/projects/page.tsx` | CRUD de proyectos + sus recursos. Crear/editar proyecto, agregar/editar/eliminar recursos dentro de cada proyecto. | Media |
| `app/(app)/admin/permissions/page.tsx` | Asignación de permisos: seleccionar usuario, mostrar proyectos con toggle de acceso (view/manage/ninguno). | Media |

#### Notas para Admin

- Todas las páginas de admin requieren `requireRole("admin")`.
- Server Actions para admin deben crearse en `app/actions/admin.ts` (o dividir por sub-dominio).
- Usar dialogs de shadcn para formularios de creación/edición cuando sea apropiado.
- Confirmación antes de eliminar (AlertDialog).
- Los cambios de contraseña de usuario solo necesitan el campo nuevo (no pedir el anterior, es admin).

### 🚧 Pendiente — Server Actions Faltantes

| Action | Archivo | Descripción |
|--------|---------|-------------|
| `createProjectAction` | `app/actions/admin.ts` | Crear proyecto. Solo admin. |
| `updateProjectAction` | `app/actions/admin.ts` | Editar proyecto. Solo admin. |
| `deleteProjectAction` | `app/actions/admin.ts` | Eliminar proyecto + sus recursos y permisos. Solo admin. |
| `createResourceAction` | `app/actions/admin.ts` | Crear recurso en un proyecto. Solo admin. |
| `updateResourceAction` | `app/actions/admin.ts` | Editar recurso. Solo admin. |
| `deleteResourceAction` | `app/actions/admin.ts` | Eliminar recurso. Solo admin. |
| `createUserAction` | `app/actions/admin.ts` | Crear usuario. Solo admin. |
| `updateUserAction` | `app/actions/admin.ts` | Editar usuario (nombre, email, rol, contraseña). Solo admin. |
| `deleteUserAction` | `app/actions/admin.ts` | Eliminar usuario + sus permisos. Solo admin. No auto-eliminarse. |
| `setPermissionAction` | `app/actions/admin.ts` | Asignar/cambiar permiso de usuario en proyecto. Solo admin. |
| `removePermissionAction` | `app/actions/admin.ts` | Quitar permiso. Solo admin. |

### 🚧 Pendiente — Validación Zod Faltante

| Esquema | Archivo | Campos |
|---------|---------|--------|
| `projectSchema` | `lib/validation/admin.ts` | name (min 2), description (min 5) |
| `resourceSchema` | `lib/validation/admin.ts` | projectId, title (min 2), type (site\|report), url (url válida), description |
| `userSchema` | `lib/validation/admin.ts` | name (min 2), email (email), role (admin\|approver\|employee), password (min 4, opcional en update) |
| `permissionSchema` | `lib/validation/admin.ts` | userId, projectId, access (view\|manage) |

## Orden de Implementación Sugerido

1. **Vacaciones — páginas** (el backend ya existe, solo faltan las vistas)
2. **Admin — actions + validación** (base para las páginas de admin)
3. **Admin — páginas** (UI de gestión)
4. **Refinamientos** (estados de carga, errores edge-case, UX polish)
