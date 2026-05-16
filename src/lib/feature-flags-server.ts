import "server-only";

import { unstable_cache } from "next/cache";

import { auth } from "@/auth";
import type { PublicFeatureFlags } from "@/types";

const FLAGS_CACHE_KEY = "feature-flags";
const FLAGS_CACHE_REVALIDATE_S = 60;

/**
 * Fetch crudo cacheado por usuario via {@link unstable_cache}. La key incluye
 * el {@code sub} del JWT y el accessToken (el último cambia con cada refresh
 * de NextAuth, lo que provoca un re-fetch natural cuando el user renueva
 * sesión). La cache TTL es {@link FLAGS_CACHE_REVALIDATE_S} segundos —
 * suficiente porque los flags rara vez cambian y el admin tiene un botón
 * "Recargar" client-side que pisa el provider local en su propia sesión.
 *
 * <p>Tag {@code feature-flags}: podemos {@code revalidateTag("feature-flags")}
 * desde un route handler para invalidar inmediatamente si en el futuro se
 * cablea con el endpoint admin del backend.
 */
const fetchFlagsCached = unstable_cache(
    async (accessToken: string, baseUrl: string): Promise<PublicFeatureFlags | null> => {
        try {
            const res = await fetch(`${baseUrl}/api/feature-flags`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: "no-store", // dentro del unstable_cache, evitamos doble cache layer
            });
            if (!res.ok) return null;
            return (await res.json()) as PublicFeatureFlags;
        } catch {
            return null;
        }
    },
    [FLAGS_CACHE_KEY],
    { tags: [FLAGS_CACHE_KEY], revalidate: FLAGS_CACHE_REVALIDATE_S },
);

/**
 * Fetch server-side de los flags públicos. Llamado desde el root layout para
 * que el HTML que llega al navegador ya tenga los flags hidratados — así no
 * hay flash de items deshabilitados visibles durante el primer fetch client-side.
 *
 * <p>Devuelve {@code null} si no hay sesión, no hay URL configurada o el
 * backend falla. En esos casos el provider client-side hace fallback a su
 * cache de localStorage o al fetch tradicional.
 *
 * <p><strong>Cache</strong>: respuesta cacheada con {@link unstable_cache}
 * por TTL de 60s. Antes era {@code cache: "no-store"} → fetch al backend en
 * CADA navegación SSR, agregando 10-50ms (más latencia de Cloudflare Tunnel
 * en prod) al TTFB de toda la app. Trade-off: cambios de flags pueden
 * tardar hasta 60s en propagar al SSR, pero el provider client-side
 * conserva su botón "Recargar" para feedback inmediato del admin.
 */
export async function obtenerFlagsPublicosServer(): Promise<PublicFeatureFlags | null> {
    const session = await auth();
    if (!session?.accessToken) return null;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return null;

    return fetchFlagsCached(session.accessToken, baseUrl);
}
