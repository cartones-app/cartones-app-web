"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { obtenerFlagsPublicos } from "@/lib/api";
import type { PublicFeatureFlags } from "@/types";

interface FeatureFlagsState {
    /** Map de clave → string. {} mientras carga / si falla. */
    flags: PublicFeatureFlags;
    /** true durante el primer fetch. */
    loading: boolean;
    /** true si el flag es BOOLEAN y vale "true". Si no existe, devuelve {@code defaultValue}. */
    isEnabled: (key: string, defaultValue?: boolean) => boolean;
    /** Refetch manual (ej: después de que el admin cambia un flag). */
    refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsState | null>(null);

/**
 * Carga los flags públicos al autenticarse y los cachea en memoria por sesión.
 * Los componentes consumen via {@link useFeatureFlags}.
 *
 * <p>No-autenticado: no llama al endpoint (devuelve 401). Cuando el status
 * pasa a authenticated, dispara el fetch. Si la llamada falla, {@code flags}
 * queda en {} — los gating callers ven default {@code true} y la app no se
 * rompe (fail-open).
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
    const { status } = useSession();
    const [flags, setFlags] = useState<PublicFeatureFlags>({});
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (status !== "authenticated") return;
        setLoading(true);
        try {
            const data = await obtenerFlagsPublicos();
            setFlags(data);
        } catch (err) {
            // fail-open: dejamos flags={} y los callers caen al default true.
            // Logueamos para que aparezca en consola / Sentry / lo que monitoree el browser.
            console.error("FeatureFlagsProvider: falló GET /api/feature-flags", err);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status === "authenticated") {
            refresh();
        } else if (status === "unauthenticated") {
            setFlags({});
        }
    }, [status, refresh]);

    const isEnabled = useCallback(
        (key: string, defaultValue = true): boolean => {
            const raw = flags[key];
            if (raw === undefined) return defaultValue;
            return raw.toLowerCase() === "true";
        },
        [flags]
    );

    return (
        <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, refresh }}>
            {children}
        </FeatureFlagsContext.Provider>
    );
}

export function useFeatureFlags(): FeatureFlagsState {
    const ctx = useContext(FeatureFlagsContext);
    if (!ctx) {
        throw new Error("useFeatureFlags debe usarse dentro de <FeatureFlagsProvider>");
    }
    return ctx;
}

// Claves expuestas — duplican las constantes del backend FlagRegistry.
export const FLAG_PAGE_UPLOAD = "page.upload.enabled";
export const FLAG_PAGE_MIS_DISTRIBUCIONES = "page.mis-distribuciones.enabled";
export const FLAG_PAGE_CONFIGURACION = "page.configuracion.enabled";
export const FLAG_PAGE_RUTA = "page.ruta.enabled";
