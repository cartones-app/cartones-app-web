# syntax=docker/dockerfile:1.7

# ==========================================
# ETAPA 1: BUILD (Next.js standalone)
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# Argumento de build para la URL pública del backend.
# Next.js bakea NEXT_PUBLIC_* en el bundle al hacer build, no se puede
# inyectar en runtime. El workflow lo pasa como --build-arg.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 1. Cachea dependencias por separado del código.
COPY package.json package-lock.json ./

# Cache mount de npm para no re-descargar entre builds del runner.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# 2. Copia código y compila.
COPY . .
RUN --mount=type=cache,target=/root/.npm \
    npm run build

# ==========================================
# ETAPA 2: RUNTIME (Node.js minimal)
# ==========================================
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root.
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copia el output standalone (incluye el server, dependencias mínimas).
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs:nextjs

EXPOSE 3000

# server.js es el entrypoint generado por output: 'standalone'.
ENTRYPOINT ["node", "server.js"]
