# syntax=docker/dockerfile:1.7

# ==========================================
# ETAPA 1: BUILD (Next.js standalone, pnpm)
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# corepack habilita la versión pinneada de pnpm declarada en package.json
# (packageManager: pnpm@x.y.z). Sin esto, "pnpm" no existiría en la imagen.
RUN corepack enable

# BACKEND_INTERNAL_URL es RUNTIME-only: la lee Next al arrancar para
# configurar los rewrites de `/api-proxy/*`. No la seteamos en build
# porque next.config.ts omite el guard durante PHASE_PRODUCTION_BUILD.
# El valor real se inyecta en compose como `environment:`.
# El bundle del cliente NO contiene la URL del backend (todo va via
# /api-proxy/* same-origin). Las credenciales/issuer de Keycloak y
# AUTH_URL son runtime-only y también se inyectan en compose.

# 1. Cachea dependencias por separado del código (cache de pnpm en /root/.local/share/pnpm).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY .npmrc* ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 2. Copia código y compila.
COPY . .
# `public/` puede no existir en el repo (no hay assets estáticos propios).
# Lo creamos para que el `COPY /app/public` del runtime no falle el build.
RUN mkdir -p public
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm build

# ==========================================
# ETAPA 2: RUNTIME (Node.js minimal)
# ==========================================
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Output standalone (incluye server + deps mínimas).
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs:nextjs

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]
