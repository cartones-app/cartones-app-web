import "server-only";

import { auth } from "@/auth";
import type { PublicFeatureFlags } from "@/types";

/**
 * Fetch server-side de los flags públicos. Llamado desde el root layout para
 * que el HTML que llega al navegador ya tenga los flags hidratados — así no
 * hay flash de items deshabilitados visibles durante el primer fetch client-side.
 *
 * <p>Devuelve {@code null} si no hay sesión, no hay URL configurada o el
 * backend falla. En esos casos el provider client-side hace fallback a su
 * cache de localStorage o al fetch tradicional.
 *
 * <p>{@code cache: "no-store"}: cada render trae el snapshot fresco. El
 * costo es ~10-50ms por request — aceptable porque el alternative es el
 * flash visible. Si en algún momento es problema, agregar un `revalidate`
 * de 30s ó cachear con tags por usuario.
 */
export async function obtenerFlagsPublicosServer(): Promise<PublicFeatureFlags | null> {
    const session = await auth();
    if (!session?.accessToken) return null;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return null;

    try {
        const res = await fetch(`${baseUrl}/api/feature-flags`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
            cache: "no-store",
        });
        if (!res.ok) return null;
        return (await res.json()) as PublicFeatureFlags;
    } catch {
        // Cualquier error de red / parsing: el provider client-side se hace cargo
        // con su cache o fetch tradicional. No rompemos el render.
        return null;
    }
}
