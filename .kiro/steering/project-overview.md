# AllForOne — Portal Interno

## Descripción General

Aplicación interna en **Next.js 16 (App Router)** que sirve como:

1. **Catálogo central** de sitios web y reportes de Looker Studio, organizados por proyecto, con búsqueda.
2. **Control de acceso** por roles + permisos granulares por proyecto (login con credenciales).
3. **Módulo de vacaciones** con flujo de aprobación, exportación a PDF (cliente) y generación de correo editable (borrador + mailto).

## Stack Tecnológico

- **Framework**: Next.js 16 con App Router (React 19, Server Components por defecto)
- **Estilos**: Tailwind CSS v4 + shadcn/ui (Base UI React)
- **Validación**: Zod v4 (sin react-hook-form; formularios nativos + Server Actions)
- **Auth**: JWT firmado con `jose`, cookie HttpOnly (`portal_session`)
- **PDF**: jsPDF (generación en navegador)
- **Package Manager**: pnpm
- **Lenguaje**: TypeScript estricto

## Arquitectura de Datos

La app consume **siempre** `getStore()` desde `lib/data/store.ts`. Nunca se acopla a una implementación concreta.

- `lib/data/store.ts` — interfaz `DataStore` con métodos CRUD.
- `lib/data/memory-store.ts` — implementación activa (datos seed en memoria).
- `lib/data/bigquery-store.ts` — stub documentado para migración futura.
- `lib/data/schema.sql` — esquema DDL pensado para BigQuery.
- `lib/data/types.ts` — tipos de dominio compartidos.

Los datos se reinician con cada reinicio del servidor. El singleton se guarda en `globalThis` para sobrevivir al hot-reload de Next en desarrollo.

## Roles y Permisos

| Rol | Capacidad |
|-----|-----------|
| `admin` | Gestiona usuarios, roles, proyectos, recursos y permisos. Ve todo. |
| `approver` | Ve bandeja de aprobaciones, aprueba/rechaza solicitudes de vacaciones. |
| `employee` | Ve solo proyectos asignados y crea solicitudes de vacaciones. |

El acceso a proyectos es granular vía `project_permissions` (view \| manage). Los admins tienen acceso implícito a todo.

## Usuarios Seed (Demo)

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@portal.com | admin123 | admin |
| encargado@portal.com | encargado123 | approver |
| empleado@portal.com | empleado123 | employee |

## Estructura de Rutas

```
app/
├── login/page.tsx                  — Formulario de acceso
├── (app)/
│   ├── layout.tsx                  — Layout con sidebar + guard de sesión
│   ├── page.tsx                    — Dashboard: búsqueda global de recursos
│   ├── projects/
│   │   ├── page.tsx                — Lista de proyectos (filtrada por permisos)
│   │   └── [id]/page.tsx           — Recursos del proyecto (reportes + sitios)
│   ├── vacations/
│   │   ├── page.tsx                — Mis solicitudes + botón "Nueva solicitud"
│   │   ├── new/page.tsx            — Formulario de nueva solicitud
│   │   ├── [id]/page.tsx           — Detalle: estado, PDF, correo, aprobar/rechazar
│   │   └── inbox/page.tsx          — Bandeja de aprobación (solo approver/admin)
│   └── admin/
│       ├── page.tsx                — Panel principal de administración
│       ├── users/page.tsx          — Gestión de usuarios
│       ├── projects/page.tsx       — Gestión de proyectos y recursos
│       └── permissions/page.tsx    — Asignación de permisos por proyecto
```

## Dependencias Clave

- `jose` — Firma y verificación de JWT para sesiones
- `jspdf` — Generación de PDF de solicitudes de vacaciones en el navegador
- `zod` — Validación de formularios (esquemas compartidos cliente/servidor)
- `lucide-react` — Iconos
- `shadcn` (Base UI + CVA + tailwind-merge) — Sistema de componentes

## Fuera de Alcance (por ahora)

- Conexión real a BigQuery (solo esquema + stub documentado).
- Envío de correo vía servidor (se usa `mailto:`).
- Firma electrónica dentro del PDF (se dejan espacios para firma manual).
- `react-hook-form` / `@hookform/resolvers` (no está instalado; se usan formularios nativos con Server Actions).
