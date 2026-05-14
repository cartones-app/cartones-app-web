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
| Auth | Keycloak (OIDC PKCE, client público `frontend`) |
| Staging | Vercel (Hobby) |
| Producción | VPS Hetzner (subdominio `rgq-cartones.eliasg.uk`) |
| CI / Seguridad | GitHub Actions + CodeQL (`security-extended`) |

---

## Modelo de ramas

| Rama | Uso | Despliegue |
|------|-----|-----------|
| `master` | Producción | Push → workflow `deploy-vps.yml` → VPS |
| `develop` | Staging | Push → CI + CodeQL → al pasar, Vercel deploya nativo + workflow `staging-alias.yml` reasigna `cartones-app-web-staging.vercel.app` al nuevo deploy |

Vercel tiene `Wait for CI` activado: solo deploya `develop` cuando los workflows GitHub Actions están en `success`. El alias custom de staging se actualiza vía un workflow separado (`staging-alias.yml`) que escucha `workflow_run` sobre CI.

---

## Arranque local

Este repo usa **pnpm** (no npm) por el aislamiento estricto de módulos y la supply-chain protection. La versión está pinneada en `packageManager` de `package.json` y la maneja Corepack automáticamente.

```bash
corepack enable pnpm@latest    # una sola vez si nunca lo usaste
pnpm install
cp .env.example .env.local     # crear con NEXT_PUBLIC_API_URL si no existe
pnpm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Variables de entorno

| Variable | Ejemplo local | Staging (Vercel) | Descripción |
|----------|--------------|------------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:9001` | `https://backend-staging-de76.up.railway.app` | URL base del backend Spring Boot |

`NEXT_PUBLIC_*` se expone al cliente. No poner secretos con ese prefijo.

---

## Autenticación

El frontend obtiene el JWT directamente desde Keycloak via el client público `frontend` (PKCE, `S256`). El backend valida el token (Spring Resource Server) y autoriza por rol del claim `realm_access.roles`.

| Entorno | Keycloak | Realm |
|---------|----------|-------|
| Local | `http://localhost:8080` (docker-compose) | `cartones` |
| Staging | `https://keycloak-staging-085a.up.railway.app` | `cartones` |

Usuarios demo del realm (passwords temporales, cambiar al primer login):

- `admin` / `admin123` — rol `ADMIN`
- `distribuidor` / `distribuidor123` — rol `DISTRIBUIDOR`

`redirectUris` y `webOrigins` del client `frontend` están registrados para `localhost:3000` y `cartones-app-web.vercel.app`. Si cambia la URL del frontend hay que actualizar el realm.

---

## Scripts

```bash
pnpm run dev     # dev server (Turbopack)
pnpm run build   # build de producción
pnpm run start   # servir el build
pnpm run lint    # ESLint
```

### Aprobar install scripts de paquetes nuevos

pnpm 11 bloquea por defecto los install scripts de paquetes recién agregados
(mitigación de supply-chain attacks). Si al instalar aparece:

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: foo@1.0.0
```

Editá `pnpm-workspace.yaml` y agregalo a `allowBuilds:`, marcándolo `true`
(si auditaste el script y lo querés correr) o `false` (si querés mantenerlo
bloqueado explícitamente).

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
