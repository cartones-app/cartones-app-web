# Cartones App — Frontend Web

Cliente Next.js para el sistema de gestión de cartones de bingo (Senete y Telebingo). Sube Excel de vendedores, simula distribución, descarga PDFs y administra la ruta de cobro.

**Autor:** Elías González

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Estado | Zustand |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| Auth | NextAuth v5 + Keycloak (provider OIDC, client confidencial `frontend`) |
| Tests | Vitest (74 tests: lib + store + components + api) |
| Staging | Vercel (Hobby) |
| Producción | VPS Hetzner (subdominio `rgq-cartones.eliasg.uk`) |
| CI / Seguridad | GitHub Actions + CodeQL (`security-extended`) |

---

## Modelo de ramas

| Rama | Uso | Despliegue |
|------|-----|-----------|
| `master` | Producción | Push → workflow `deploy-vps.yml` → VPS |
| `develop` | Staging | Push → CI + CodeQL → al pasar, dispara Vercel Deploy Hook → Vercel (`cartones-app-web.vercel.app`, alias de producción) |
| `next` | Integración (rama de trabajo) | Solo CI + CodeQL; features mergean acá primero y luego se promueven a `develop` |

Vercel tiene `Auto-deploy on git push = disabled`. El único disparador del deploy de staging es el job `deploy-staging` de `ci.yml`, que solo corre si `build` y `CodeQL` terminan en `success`.

---

## Arranque local

```bash
npm install
cp .env.example .env.local   # crear con NEXT_PUBLIC_API_URL si no existe
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Variables de entorno

Server-side only. Nada de `NEXT_PUBLIC_*` para el backend: todas las llamadas pasan por las API routes / Server Actions de Next y se forwardean al backend desde el server con el JWT del usuario.

| Variable | Ejemplo local | Staging (Vercel) | Descripción |
|----------|--------------|------------------|-------------|
| `BACKEND_INTERNAL_URL` | `http://localhost:9001` | `https://backend-staging-de76.up.railway.app` | URL del backend desde el server de Next (no se expone al cliente) |
| `AUTH_URL` | `http://localhost:3000` | `https://cartones-app-web.vercel.app` | Base URL del frontend (NextAuth) |
| `AUTH_TRUST_HOST` | `true` | `true` | Requerido detrás de proxy / Vercel |
| `AUTH_SECRET` | random 32+ bytes | random 32+ bytes | Firma de sesiones/cookies de NextAuth |
| `AUTH_KEYCLOAK_ID` | `frontend` | `frontend` | Client ID en el realm |
| `AUTH_KEYCLOAK_SECRET` | (del realm) | (del realm) | Client secret — debe coincidir con `__CLIENT_SECRET__` del template de `infra-keycloak` |
| `AUTH_KEYCLOAK_ISSUER` | `http://localhost:8080/realms/cartones` | `https://keycloak-staging-085a.up.railway.app/realms/cartones` | URL del issuer del realm |

---

## Autenticación

NextAuth v5 con provider Keycloak (client confidencial `frontend`). El JWT y el refresh token se guardan en la sesión server-side; el cliente nunca ve el token. Cada request al backend se forwardea desde Next con `Authorization: Bearer <token>`. El backend valida la firma (Spring Resource Server) y autoriza por rol del claim `realm_access.roles`.

| Entorno | Keycloak | Realm |
|---------|----------|-------|
| Local | `http://localhost:8080` (docker-compose, `infra-keycloak`) | `cartones` |
| Staging | `https://keycloak-staging-085a.up.railway.app` | `cartones` |

Flujo de login:

- Página propia `/login` que llama directo a `signIn("keycloak")` — sin pantalla intermedia de NextAuth.
- Middleware con patrón explícito `auth((req) => ...)`: matcher de rutas protegidas y redirección a `/login` con `callbackUrl`.
- Guards server-side `requireSesion()` en los sub-layouts (`/admin`, flujos de distribución) — defense in depth además del middleware.

Usuarios demo del realm en staging Railway (passwords temporales, cambiar al primer login):

- `admin` / `admin123` — rol `ADMIN`
- `distribuidor` / `distribuidor123` — rol `DISTRIBUIDOR`

`redirectUris` y `webOrigins` del client `frontend` están registrados para `localhost:3000` y `cartones-app-web.vercel.app`. Si cambia la URL del frontend hay que actualizar el realm.

---

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # ESLint
npm run test    # vitest (suite completa, 74 tests)
```

CI corre `lint`, `build` y `test` en cada push / PR.

---

## UI y rutas principales

Estética editorial consistente en toda la app: `PageHeader`, hero por sección, eyebrow bar de contexto. Aplicada en:

- `/` (home), `/upload`, `/configuracion`
- `/resultados`, `/mis-distribuciones`, `/preferencias-etiquetas`

Rutas de admin (rol `ADMIN`):

- `/admin/configuracion-archivos` — política de retención
- `/admin/preferencias-etiquetas` — defaults globales
- `/admin/feature-flags`

## Estado y flujo de distribución

- Zustand `useProcesoStore`. `store.reset()` dispara fire-and-forget `POST /api/distribuciones/{id}/abandonar` para liberar el proceso server-side cuando el usuario reinicia el flujo.
- `DistribucionesTable` muestra badge dedicado para el estado `ABANDONADO`.
- Descarga de archivos: dos PDFs separados (Senete + Telebingo). Se discontinuó la entrega como ZIP.

## Performance

- Dynamic imports en pantallas pesadas (resultados, admin).
- `Intl.DateTimeFormat` / `Intl.NumberFormat` nativos en lugar de `date-fns` (menos bundle).
- Layout de `/admin` como Server Component puro (sin client boundary innecesario).
- `useDeferredValue` en filtros de tablas grandes.

---

## Despliegue

### Staging (Vercel)

1. Push a `develop`.
2. `ci.yml` corre `npm ci` + `npm run lint` + `npm run build`.
3. `codeql.yml` analiza el código.
4. Si ambos terminan en `success`, el job `deploy-staging` espera al check de CodeQL y golpea el Vercel Deploy Hook.
5. Vercel construye y despliega a `https://cartones-app-web.vercel.app`.

El Deploy Hook está guardado como secret `VERCEL_DEPLOY_HOOK_URL` del repo.

### Producción (VPS)

Push a `master` → workflow `deploy-vps.yml` → contenedor servido detrás de nginx-proxy + Cloudflare Tunnel en `rgq-cartones.eliasg.uk`.

---

## Estructura

```
src/
├── app/                # Rutas (App Router)
│   ├── configuracion/  # Panel de admin
│   ├── upload/         # Carga de Excel
│   └── resultados/     # Vista de distribución y PDFs
├── components/         # UI components (shadcn/ui + custom)
├── lib/
│   ├── api.ts          # Wrappers de endpoints
│   └── axios.ts        # Instancia + interceptors (toasts en errores)
├── store/              # Zustand stores
└── types/              # Tipos compartidos con el backend
```
