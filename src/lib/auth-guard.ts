import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { KEYCLOAK_SIGNIN_PATH } from "@/lib/auth-middleware";

/**
 * Guard server-side para layouts protegidos. Llama a `auth()` y si no hay
 * sesión válida hace `redirect()` server-side ANTES de renderizar nada del
 * subtree.
 *
 * Por qué este guard además del middleware:
 *  - El callback `authorized` de NextAuth v5 beta no siempre corta requests
 *    (especialmente prefetches RSC client-side). El layout server-side, en
 *    cambio, corre dentro del render del árbol — si llama `redirect()`, el
 *    cliente recibe el redirect sin ver el shell de la página protegida.
 *    Eso elimina el "flash" entre click y redirect.
 *  - Defensa en profundidad: incluso si en el futuro alguien modifica el
 *    matcher del middleware y deja una ruta sin cubrir, el layout sigue
 *    protegiendo.
 *
 * Uso: en `src/app/<ruta>/layout.tsx`:
 *
 *     export default async function Layout({ children }) {
 *         await requireSesion("/configuracion");
 *         return <PageFlagGate flag="...">{children}</PageFlagGate>;
 *     }
 *
 * El `callbackUrl` se pasa explícito porque dentro del layout server-side
 * no tenemos acceso a `request.nextUrl` (es código RSC, no de middleware).
 * Pasalo como path conocido del propio layout — es lo que el user querría
 * volver tras login.
 */
export async function requireSesion(callbackUrl: string): Promise<void> {
    const session = await auth();
    const autorizado =
        Boolean(session?.accessToken) && session?.error !== "RefreshAccessTokenError";
    if (autorizado) return;

    const params = new URLSearchParams({ callbackUrl });
    redirect(`${KEYCLOAK_SIGNIN_PATH}?${params.toString()}`);
}
