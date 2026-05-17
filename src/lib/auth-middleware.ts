import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

/**
 * Endpoint que dispara el flujo de login con Keycloak (auto-trigger sin la
 * pantalla intermedia de NextAuth). Centralizado para que el middleware y
 * cualquier redirect manual usen el mismo path.
 */
export const KEYCLOAK_SIGNIN_PATH = "/api/auth/signin/keycloak";

/**
 * Evalúa si una request tiene sesión válida.
 *
 * Retorna:
 *  - `true` → la request pasa al siguiente handler.
 *  - `NextResponse.redirect(...)` → forzar redirect a Keycloak preservando
 *    `callbackUrl` (path + query) para volver al destino tras el login.
 *
 * Vive en su propio módulo (no en `auth.ts`) para que los tests puedan
 * importarlo sin arrastrar el setup completo de NextAuth y `next/server`
 * desde dependencias internas del provider (que rompen en Vitest).
 *
 * Motivo del redirect explícito (vs retornar `false` desde el callback
 * `authorized`): NextAuth v5 beta tiene comportamiento inconsistente cuando
 * el callback retorna `false` y no hay `pages.signIn` configurado — a veces
 * deja pasar la request, lo que se manifestaba como home accesible sin login
 * y "flash" de página protegida al navegar a sub-rutas. Devolver
 * `NextResponse.redirect` garantiza redirect server-side ANTES de cualquier
 * render del cliente.
 */
export function evaluarAcceso(
    session: Session | null,
    request: NextRequest,
): true | NextResponse {
    const autorizado =
        Boolean(session?.accessToken) && session?.error !== "RefreshAccessTokenError";
    if (autorizado) return true;

    const destino = request.nextUrl.pathname + request.nextUrl.search;
    const signInUrl = new URL(KEYCLOAK_SIGNIN_PATH, request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", destino);
    return NextResponse.redirect(signInUrl);
}
