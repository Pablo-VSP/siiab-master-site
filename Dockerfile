# =============================================================================
# Dockerfile para la app Next.js 16 (App Router, Server Components).
#
# Esta app NO es una SPA estática: necesita un servidor Node en runtime para
# Server Actions, middleware y las llamadas server-side a Gatekeeper/Keymaster.
# Por eso se usa el output "standalone" de Next (next.config.mjs) en lugar de
# servir archivos con nginx.
#
# Las URLs de los backends se leen en RUNTIME desde GATEKEEPER_URL y
# KEYMASTER_URL (ver lib/services/*.ts). NO son variables de build; configúralas
# como env vars del servicio en Cloud Run.
# =============================================================================

# ---- 1) Dependencias -------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# El proyecto usa pnpm. Se activa una versión concreta de forma determinista
# (no depende de que exista un package.json en este punto del build).
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

# pnpm-workspace.yaml es necesario: ahí viven los overrides (hono) que pnpm 10+
# ya NO lee desde package.json.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- 2) Build --------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.5 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compilación de Next (genera .next/standalone + .next/static).
RUN pnpm build

# ---- 3) Runner (imagen final mínima) ---------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run inyecta PORT (8080 por defecto). Next lo respeta con -p $PORT.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Usuario no-root por seguridad.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# El output standalone incluye node_modules mínimos + server.js.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 8080

# server.js es el entrypoint que genera el output standalone.
CMD ["node", "server.js"]
