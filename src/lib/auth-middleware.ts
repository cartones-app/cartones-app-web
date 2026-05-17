import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

/**
 * Page propia que dispara `signIn("keycloak")` al mount. Evita la pantalla
 * built-in de NextAuth (un click extra) y el `error=Configuration` que tira
 * v5 beta cuando se invoca el endpoint del provider con GET.
 */
export const KEYCLOAK_SIGNIN_PATH = "/login";

/**
 * Rutas accesibles sin sesión. La home `/` actúa como landing/anónimo:
 * muestra "Gestión de cartones" genérico, y cuando hay sesión, switchea
 * al saludo personalizado.
 *
 * Match es por igualdad exacta de pathname — NO usa prefix. Para hacer
 * pública una subruta hay que agregarla explícita.
 */
const RUTAS_PUBLICAS = new Set<string>(["/"]);

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
    // Rutas marcadas como públicas siempre pasan, con o sin sesión. La home
    // tiene contenido condicional (saludo personalizado si hay session,
    // texto genérico si no), así que negarle el acceso anónimo rompería
    // ese contrato.
    if (RUTAS_PUBLICAS.has(request.nextUrl.pathname)) {
        return true;
    }

    const autorizado =
        Boolean(session?.accessToken) && session?.error !== "RefreshAccessTokenError";
    if (autorizado) return true;

    const destino = request.nextUrl.pathname + request.nextUrl.search;
    const signInUrl = new URL(KEYCLOAK_SIGNIN_PATH, request.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", destino);
    return NextResponse.redirect(signInUrl);
}

/**
 * Decide si el path requiere sesión válida para acceder. Útil en
 * server-side guards (layouts) que necesitan replicar el criterio del
 * middleware antes de renderizar.
 */
export function requiereSesion(pathname: string): boolean {
    return !RUTAS_PUBLICAS.has(pathname);
}
