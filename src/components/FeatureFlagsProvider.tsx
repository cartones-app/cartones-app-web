"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
 *
 * <p><b>Por qué los setState están en callbacks .then/.catch del effect</b>:
 * la regla {@code react-hooks/set-state-in-effect} prohibe disparar setState
 * sincrónicamente en el body del effect. Aprovechamos para derivar
 * {@code flags} de {@code fetched + status} (cuando el usuario se desautentica
 * no queremos exponer flags cacheados de la sesión previa, pero tampoco
 * necesitamos un setState para limpiarlos — la derivación basta).
 */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
    const { status } = useSession();
    // null = aún no se intentó fetch; {} = intentado (vacío o fallido);
    // populado = OK. Permite derivar `loading` sin un setState extra.
    const [fetched, setFetched] = useState<PublicFeatureFlags | null>(null);

    // Derivado: cuando no estamos autenticados no exponemos ningún flag —
    // evita leaks entre sesiones sin necesidad de un `setFlags({})` síncrono
    // en el effect (que rompería la regla react-hooks/set-state-in-effect).
    // useMemo para que la identidad de `flags` sea estable cuando ni status
    // ni fetched cambian — si no, el useCallback de isEnabled se invalida en
    // cada render.
    const flags: PublicFeatureFlags = useMemo(
        () => (status === "authenticated" && fetched ? fetched : {}),
        [status, fetched]
    );
    const loading = status === "authenticated" && fetched === null;

    const refresh = useCallback((): Promise<void> => {
        if (status !== "authenticated") return Promise.resolve();
        return obtenerFlagsPublicos()
            .then((data) => {
                setFetched(data);
            })
            .catch((err) => {
                // fail-open: marcamos como intentado con map vacío y los
                // callers caen al default true.
                console.error("FeatureFlagsProvider: falló GET /api/feature-flags", err);
                setFetched({});
            });
    }, [status]);

    useEffect(() => {
        if (status !== "authenticated") return;
        let cancelled = false;
        obtenerFlagsPublicos()
            .then((data) => {
                if (!cancelled) setFetched(data);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("FeatureFlagsProvider: falló GET /api/feature-flags", err);
                setFetched({});
            });
        return () => {
            cancelled = true;
        };
    }, [status]);

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
