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

- **Nunca importar `MemoryStore` directamente**. Siempre consumir `getStore()` desde `lib/data/store.ts`.
- Las funciones del store son `async` (preparadas para I/O real). Siempre usar `await`.
- Nuevos métodos deben agregarse primero a la interfaz `DataStore`, luego implementar en `MemoryStore` y documentar en `BigQueryStore`.

## Auth y Permisos

- `requireUser()` — redirige a `/login` si no hay sesión.
- `requireRole(...roles)` — redirige a `/` si el rol no coincide.
- `canAccessProject(user, projectId)` — verifica permiso granular.
- `canApproveVacations(user)` — true para admin y approver.
- **Siempre** verificar permisos en Server Actions y en Server Components que renderizan datos sensibles.

## Estructura de Archivos

```
app/actions/         — Server Actions agrupadas por dominio
lib/                 — Lógica de negocio, utilidades, data layer
lib/data/            — DataStore interface + implementaciones
lib/validation/      — Esquemas Zod compartidos
components/          — Componentes de la app (no pages)
components/ui/       — Primitivos de shadcn/ui (no modificar directamente salvo necesidad)
```

## Manejo de Errores

- Server Actions devuelven `{ ok: boolean; error?: string }`. El cliente muestra el error con toast (sonner) o inline.
- No lanzar excepciones en actions salvo errores inesperados del sistema.
- Usar `notFound()` de next/navigation cuando un recurso no existe.

## PDF y Email

- `lib/pdf.ts` — Generación con jsPDF, se ejecuta solo en el navegador (`"use client"`).
- `lib/vacation-format.ts` — Utilidades de formato (fechas, labels, draft de email, mailto URL). Puede usarse en cliente y servidor.
- El correo usa `mailto:` con body pre-llenado. No hay servicio de envío backend.

## Git

- Commits en español o inglés, concisos.
- No commitear `.env` ni secretos. El secreto de sesión se configura vía `PORTAL_SESSION_SECRET`.
