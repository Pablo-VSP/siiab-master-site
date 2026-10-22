# AllForOne — Portal Interno

## Descripción General

Aplicación interna en **Next.js 16 (App Router)** que sirve como:

1. **Catálogo central** de sitios web y reportes de Looker Studio, organizados por proyecto, con búsqueda. El catálogo se deriva del menú autorizado de **Keymaster**.
2. **Autenticación** vía **Gatekeeper** (JWT) y **autorización de navegación** vía **Keymaster** (menú por usuario).
3. **Configuración** (admin): pantallas para gestionar menús, submenús, opciones, usuarios y la construcción del menú, consumiendo directamente el CRUD de Keymaster.

## Stack Tecnológico

- **Framework**: Next.js 16 con App Router (React 19, Server Components por defecto)
- **Estilos**: Tailwind CSS v4 + shadcn/ui (Base UI React)
- **Validación**: Zod v4 (sin react-hook-form; formularios nativos + Server Actions)
- **Auth**: JWT emitido por Gatekeeper, cookie HttpOnly (`portal_session`). La app NO firma tokens.
- **Package Manager**: pnpm
- **Lenguaje**: TypeScript estricto

## Arquitectura de Datos

**No hay base de datos local.** La app no persiste datos propios: toda la información
de identidad, menús, usuarios y permisos de navegación vive en los servicios externos
**Gatekeeper** (emisor de tokens) y **Keymaster** (menús y catálogo CRUD).

- `lib/services/gatekeeper.ts` — autenticación (`POST /identity` → JWT).
- `lib/services/keymaster.ts` — menú autorizado y agrupado del usuario (pintar navegación).
- `lib/services/keymaster-crud.ts` — cliente genérico CRUD de los 6 recursos de Keymaster.
- `lib/services/menu-admin-data.ts` — lectores server-side para las pantallas de Configuración.
- `lib/services/catalog.ts` — deriva el catálogo (proyectos/recursos) del menú de Keymaster.
- `lib/data/types.ts` — tipos de dominio compartidos (User, Resource).

El usuario de dominio se deriva del JWT (sin I/O). El rol se toma de los claims si existen;
si no, por defecto `employee`. La autorización real de navegación la impone Keymaster.

## Recursos de Keymaster (contrato)

| Recurso | Ruta | Token | Pantalla de Configuración |
|---|---|---|---|
| menu_perfil | `/api/menus` | No | Menús |
| menu_menu | `/api/menumenu` | No | Submenús |
| menu_option | `/api/menuoption` | No | Opciones de Menú |
| user | `/api/securityuser` | No | Usuarios |
| menu_perfil_user | `/api/menuuser` | **Sí** | Menú por Usuario / Perfiles del usuario |
| menu_build | `/api/menubuild` | **Sí** | Construcción del menú |

Los recursos protegidos reenvían el JWT (`Authorization: Bearer <token>`).

## Roles

El rol (`admin`/`approver`/`employee`) solo existe si el token lo declara en sus claims.
`requireRole(...)` exige sesión válida y, si el token trae un rol explícito que no está
permitido, redirige al inicio. La fuente de verdad del acceso es el menú de Keymaster.

## Estructura de Rutas

```
app/
├── login/page.tsx                  — Formulario de acceso (Gatekeeper)
├── (app)/
│   ├── layout.tsx                  — Layout con sidebar (menú de Keymaster) + guard
│   ├── page.tsx                    — Dashboard: búsqueda global de recursos
│   ├── projects/
│   │   ├── page.tsx                — Lista de proyectos (del catálogo de Keymaster)
│   │   └── [id]/page.tsx           — Recursos del proyecto
│   └── admin/
│       ├── page.tsx                — Redirige a /admin/configuracion
│       └── configuracion/
│           ├── page.tsx            — Índice de Configuración
│           ├── menus/page.tsx      — menu_perfil
│           ├── submenus/page.tsx   — menu_menu
│           ├── opciones/page.tsx   — menu_option
│           ├── usuarios/page.tsx   — securityuser (+ perfiles del usuario)
│           ├── menu-usuario/page.tsx — menu_perfil_user
│           └── menu-build/page.tsx — menu_build (3 columnas)
```

Componentes de estas pantallas en `components/config/`.

## Dependencias Clave

- `jose` — Decodificación del JWT de Gatekeeper para la sesión
- `zod` — Validación de formularios
- `lucide-react` — Iconos
- `shadcn` (Base UI + CVA + tailwind-merge) — Sistema de componentes

## Fuera de Alcance (por ahora)

- **Vacaciones**: el módulo anterior se retiró; se reconstruirá consumiendo Keymaster.
- Persistencia local (no hay base de datos; todo vive en Gatekeeper/Keymaster).
- `react-hook-form` / `@hookform/resolvers` (se usan formularios nativos con Server Actions).
