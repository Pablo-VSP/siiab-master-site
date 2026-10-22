# Estándares de Código — AllForOne

## Convenciones Generales

- **Idioma del código**: Nombres de variables/funciones en inglés. Comentarios, labels de UI y mensajes al usuario en **español**.
- **TypeScript estricto**: `strict: true`. No usar `any`; preferir tipos explícitos o `unknown` + narrowing.
- **Imports**: Usar alias `@/` para rutas desde la raíz del proyecto. No imports relativos con `../..`.
- **Archivos**: Un componente principal por archivo. Nombre en kebab-case para archivos, PascalCase para componentes exportados.

## React & Next.js

- **Server Components por defecto**. Solo marcar `"use client"` cuando se necesite estado, efectos o event handlers del navegador.
- **Server Actions** (`"use server"`) para mutaciones. Siempre revalidar permisos dentro de la action (no confiar en el cliente).
- **Formularios**: Usar formularios nativos HTML + `action` prop con Server Actions. No `react-hook-form` (no está instalado).
- **Validación**: Esquemas Zod compartidos en `lib/validation/`. Validar en servidor siempre; opcionalmente en cliente para UX.
- **Params en App Router**: Los params de rutas dinámicas son `Promise` en Next.js 16. Siempre hacer `const { id } = await params`.
- **Metadata**: Exportar `metadata` o `generateMetadata` en pages para SEO básico.

## Estilos y Componentes UI

- **Tailwind v4** con `@tailwindcss/postcss`. No archivo `tailwind.config` — configuración en CSS.
- **shadcn/ui** basado en Base UI React (`@base-ui/react`). Componentes en `components/ui/`.
- Usar `cn()` de `lib/utils.ts` para merge de clases condicionales.
- Preferir composición de componentes shadcn existentes antes de crear nuevos.
- **Responsive**: Mobile-first. Breakpoints `sm:`, `md:`, `lg:`.
- **Accesibilidad**: `aria-label` en inputs sin label visible, roles ARIA en componentes interactivos, contraste suficiente.

## Data Layer

- **No hay base de datos local.** Toda la persistencia vive en Keymaster/Gatekeeper.
- Para consumir Keymaster usa el cliente genérico `lib/services/keymaster-crud.ts`
  (`readResource` / `createResource` / `patchResource` / `deleteResource`).
- Los recursos protegidos (`menu_build`, `menu_perfil_user`) requieren reenviar el
  token: obtenlo con `getToken()` y pásalo al cliente.
- Create/Patch reciben **array de objetos**; Delete recibe **array de PKs**.

## Auth y Permisos

- `requireUser()` — redirige a `/login` si no hay sesión (deriva el usuario del JWT, sin DB).
- `requireRole(...roles)` — exige sesión válida; redirige a `/` solo si el token trae un rol explícito no permitido.
- `canApproveVacations(user)` / `isAdmin(user)` — utilidades de rol puras.
- **Siempre** verificar la sesión en Server Actions; la autorización fina la impone Keymaster.

## Estructura de Archivos

```
app/actions/         — Server Actions agrupadas por dominio
lib/                 — Lógica de negocio, utilidades
lib/services/        — Clientes de Gatekeeper/Keymaster
lib/data/types.ts    — Tipos de dominio (sin persistencia)
lib/validation/      — Esquemas Zod compartidos
components/          — Componentes de la app (no pages)
components/config/   — Pantallas de Configuración (gestión de menús vía Keymaster)
components/ui/       — Primitivos de shadcn/ui (no modificar directamente salvo necesidad)
```

## Manejo de Errores

- Server Actions devuelven `{ ok: boolean; error?: string }`. El cliente muestra el error con toast (sonner) o inline.
- No lanzar excepciones en actions salvo errores inesperados del sistema.
- Usar `notFound()` de next/navigation cuando un recurso no existe.

## Git

- Commits en español o inglés, concisos.
- No commitear `.env` ni secretos. El secreto de sesión se configura vía `PORTAL_SESSION_SECRET`.
