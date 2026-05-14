# syntax=docker/dockerfile:1.7

# ==========================================
# ETAPA 1: BUILD (Next.js standalone, pnpm)
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# corepack habilita la versión pinneada de pnpm declarada en package.json
# (packageManager: pnpm@x.y.z). Sin esto, "pnpm" no existiría en la imagen.
RUN corepack enable

# NEXT_PUBLIC_* se bakea en el bundle al build. El workflow lo pasa
# como --build-arg desde GitHub Variables.
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG KEYCLOAK_ISSUER
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV KEYCLOAK_ISSUER=${KEYCLOAK_ISSUER}

# 1. Cachea dependencias por separado del código (cache de pnpm en /root/.local/share/pnpm).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY .npmrc* ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 2. Copia código y compila.
COPY . .
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
