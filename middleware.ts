import { auth } from "@/auth";
import { evaluarAcceso } from "@/lib/auth-middleware";

/**
 * Middleware con patrón explícito `auth((req) => ...)` en lugar de
 * `export { auth as middleware }`. El primero garantiza que el handler corra
 * y respete el `NextResponse` retornado; el segundo (que usa el callback
 * `authorized` interno) tiene comportamiento inconsistente en NextAuth v5 beta.
 *
 * Cortamos server-side ANTES de cualquier render del cliente → no hay flash
 * ni pantalla negra durante la transición a rutas protegidas.
 */
export default auth((req) => {
    const session = req.auth;
    const decision = evaluarAcceso(session, req);
    if (decision === true) {
        // Sin `return` se entiende como passthrough en NextAuth v5.
        return;
    }
    return decision;
});

export const config = {
    matcher: [
        /*
         * Protege todas las rutas excepto:
         * - /api/auth/* (handlers de NextAuth)
         * - /login (la page propia que dispara el flow OAuth — evita loop)
         * - /_next/static y /_next/image (assets)
         * - /favicon.ico, /robots.txt, /sitemap.xml
         */
        "/((?!api/auth|login|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};
