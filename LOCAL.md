# Desarrollo local — frontend + backend + keycloak

El stack local vive en el repo del backend (`cartones-app-api/docker-compose.yml`),
que ya levanta **postgres + keycloak (realm `cartones` seedeado) + backend**.
El frontend corre fuera del compose con `pnpm dev` para tener hot-reload.

## 1. Levantar el stack del backend

En el repo `cartones-app-api`:

```bash
cp .env.example .env       # editar PORT_DB, PORT_BACKEND, KEYCLOAK_ADMIN_PASSWORD
docker compose up -d
docker compose logs -f backend  # esperar "Started ... Application"
```

Quedan corriendo:

- `localhost:${PORT_DB}` — postgres
- `localhost:8080` — keycloak (admin: `admin` / lo que pusiste en `.env`)
- `localhost:${PORT_BACKEND}` — backend (default mapping en .env)

## 2. Configurar el frontend

```bash
cp .env.local.example .env.local
# Ajustar NEXT_PUBLIC_API_URL si tu PORT_BACKEND no es 9001.
pnpm install
pnpm dev
```

Frontend en `http://localhost:3000`.

## 3. Login

Usar el botón "Iniciar sesión" → te redirige a Keycloak. Credenciales seed:

| Usuario | Password | Roles |
|---|---|---|
| `admin` | `admin123` | `ADMIN` |
| `distribuidor` | `distribuidor123` | `DISTRIBUIDOR` |

Los passwords vienen marcados `temporary: true` en el realm — Keycloak te va
a pedir cambiarlos al primer login. Si querés evitarlo, editá
`cartones-app-api/keycloak/realm-cartones.json` y poné `"temporary": false`.

## Notas

- El client OIDC se llama `frontend` y es **público con PKCE** (sin secret).
  En `.env.local` dejá `AUTH_KEYCLOAK_SECRET=public-client` (placeholder).
- Backend con perfil `APP_PROFILE=local` desactiva la seguridad — útil si
  querés bypassear Keycloak temporalmente. Para e2e real usá `dev`.
- Si toqueteás el realm y querés re-importar:

  ```bash
  docker compose down keycloak
  docker volume rm $(docker volume ls -q | grep cartones)  # borra DB también
  docker compose up -d
  ```
