#!/usr/bin/env bash
# Renombra una variable de entorno en Vercel para los tres scopes
# (production / preview / development).
#
# Vercel CLI no tiene `env rename` nativo, así que el flujo es:
#   1) pullear el valor actual desde el environment dado,
#   2) agregar la variable nueva con ese mismo valor,
#   3) borrar la vieja.
#
# Pide el token interactivamente con `read -s` para no dejar rastro en
# history. Usa el token como argumento explícito `--token` (no env var
# global) por las dudas; el script no lo escribe a disco.
#
# Uso (desde la raíz del repo):
#   ./scripts/vercel-rename-env-var.sh
# El script pide:
#   - Token de Vercel.
#   - Nombre viejo de la variable (default: NEXT_PUBLIC_API_URL).
#   - Nombre nuevo (default: BACKEND_INTERNAL_URL).

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v vercel >/dev/null 2>&1; then
    echo "ERROR: 'vercel' CLI no está en PATH. Instalá con 'npm i -g vercel'." >&2
    exit 1
fi

read -rsp "Vercel token: " VERCEL_TOKEN
echo
if [[ -z "$VERCEL_TOKEN" ]]; then
    echo "ERROR: token vacío." >&2
    exit 1
fi

read -rp "Nombre viejo [NEXT_PUBLIC_API_URL]: " OLD_NAME
OLD_NAME="${OLD_NAME:-NEXT_PUBLIC_API_URL}"

read -rp "Nombre nuevo [BACKEND_INTERNAL_URL]: " NEW_NAME
NEW_NAME="${NEW_NAME:-BACKEND_INTERNAL_URL}"

if [[ "$OLD_NAME" == "$NEW_NAME" ]]; then
    echo "ERROR: el nombre viejo y el nuevo son iguales." >&2
    exit 1
fi

# Linkear el proyecto si todavía no lo está (idempotente).
if [[ ! -f .vercel/project.json ]]; then
    echo "==> Linkeando proyecto..."
    vercel link --yes --token "$VERCEL_TOKEN"
fi

TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

renombrar_en() {
    local env="$1"
    echo "==> $env"

    # Pull el snapshot de envs de ese environment a un archivo temporal.
    # --yes para no preguntar overwrite del archivo destino.
    if ! vercel env pull --environment "$env" --yes --token "$VERCEL_TOKEN" "$TMP_ENV" >/dev/null 2>&1; then
        echo "   No se pudo pullear el snapshot (¿no hay vars en $env?). Skipeando."
        return 0
    fi

    # Buscar la línea OLD_NAME=...; despojar el = inicial y los posibles "..." que
    # Vercel escribe alrededor de valores con caracteres especiales.
    local raw value
    raw="$(grep -E "^${OLD_NAME}=" "$TMP_ENV" || true)"
    if [[ -z "$raw" ]]; then
        echo "   '$OLD_NAME' no existe en $env, skipeando."
        return 0
    fi
    value="${raw#${OLD_NAME}=}"
    # Sacar comillas dobles si vienen.
    value="${value%\"}"
    value="${value#\"}"

    echo "   Valor encontrado (${#value} caracteres). Agregando '$NEW_NAME'..."
    # `vercel env add KEY environments...` lee el valor por stdin si no se pasa
    # como argumento. Pasamos el valor con echo -n para no agregar \n al final.
    if printf '%s' "$value" | vercel env add "$NEW_NAME" "$env" --token "$VERCEL_TOKEN" >/dev/null 2>&1; then
        echo "   '$NEW_NAME' agregada."
    else
        echo "   ADVERTENCIA: no se pudo agregar '$NEW_NAME' (¿ya existía?). Revisar manualmente."
        return 0
    fi

    echo "   Removiendo '$OLD_NAME'..."
    if vercel env rm "$OLD_NAME" "$env" --yes --token "$VERCEL_TOKEN" >/dev/null 2>&1; then
        echo "   '$OLD_NAME' removida."
    else
        echo "   ADVERTENCIA: no se pudo remover '$OLD_NAME'. Revisar manualmente."
    fi
}

for env in production preview development; do
    renombrar_en "$env"
done

echo
echo "Listo. Verificá con:"
echo "  vercel env ls --token \$VERCEL_TOKEN"
