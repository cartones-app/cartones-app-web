"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { obtenerFlagsPublicos } from "@/lib/api";
import type { PublicFeatureFlags } from "@/types";

const CACHE_KEY = "public-feature-flags-cache";

/**
 * Lee el cache de flags del último login. Se llama desde el lazy init de
 * useState — corre exactamente una vez al montar el provider en el cliente.
 *
 * <p>El cache puede quedar segundos desactualizado vs. el servidor; lo
 * reconciliamos siempre con un fetch en el {@code useEffect}. La ganancia
 * está en evitar el flash de "todos los items visibles" durante el ~1er
 * segundo después del reload, mostrando el último snapshot conocido.
 */
function readCachedFlags(): PublicFeatureFlags | null {
    if (typeof globalThis.window === "undefined") return null;
    try {
        const raw = globalThis.window.localStorage.getItem(CACHE_KEY);
        return raw ? (JSON.parse(raw) as PublicFeatureFlags) : null;
    } catch {
        return null;
    }
}

function writeCachedFlags(flags: PublicFeatureFlags | null): void {
    if (typeof globalThis.window === "undefined") return;
    try {
        if (flags === null) {
            globalThis.window.localStorage.removeItem(CACHE_KEY);
        } else {
            globalThis.window.localStorage.setItem(CACHE_KEY, JSON.stringify(flags));
        }
    } catch {
        // QuotaExceeded / Safari privado / etc. — no es crítico, el provider
        // sigue funcionando sin cache (con flash en el próximo reload).
    }
}

interface FeatureFlagsState {
    /** Map de clave → string. {} mientras carga / si falla. */
    flags: PublicFeatureFlags;
    /** true durante el primer fetch sin cache previo. */
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
 * <p><b>Hidratación inicial (en orden de prioridad)</b>:
 * <ol>
 *   <li>{@code initialFlags} pasado desde el root layout (SSR) — elimina el
 *       flash porque el HTML llega con los flags ya resueltos.</li>
 *   <li>Cache de localStorage del último login — fallback cuando SSR no pudo
 *       (sesión expirada, backend down, etc.).</li>
 *   <li>{@code null} — render con todos los flags en default true hasta que
 *       el fetch client-side resuelva (flash inevitable la primera vez).</li>
 * </ol>
 *
 * <p><b>Por qué los setState están en callbacks .then/.catch del effect</b>:
 * la regla {@code react-hooks/set-state-in-effect} prohibe disparar setState
 * sincrónicamente en el body del effect. Derivamos {@code flags} de
 * {@code fetched + status} para no necesitar un setState al desautenticar.
 */
export function FeatureFlagsProvider({
    children,
    initialFlags,
}: {
    readonly children: ReactNode;
    readonly initialFlags?: PublicFeatureFlags | null;
}) {
    const { status } = useSession();
    // Prioridad: SSR initial > localStorage cache > null.
    // El lazy init corre una sola vez (en SSR y en hydration con el mismo
    // valor vía la prop) — no hay hydration mismatch.
    const [fetched, setFetched] = useState<PublicFeatureFlags | null>(
        () => initialFlags ?? readCachedFlags()
    );

    // Derivado: mientras NextAuth no diga explícitamente "unauthenticated"
    // confiamos en `fetched` (vino de SSR o cache). Si no hay nada, {} —
    // los gating callers caen al default true.
    // Solo limpiamos a {} cuando el status es unauthenticated, para no
    // reintroducir el flash durante la hidratación inicial de NextAuth (que
    // arranca con status="loading" en el cliente).
    const flags: PublicFeatureFlags = useMemo(
        () => (status === "unauthenticated" ? {} : (fetched ?? {})),
        [status, fetched]
    );
    const loading = fetched === null && status !== "unauthenticated";

    const refresh = useCallback((): Promise<void> => {
        if (status !== "authenticated") return Promise.resolve();
        return obtenerFlagsPublicos()
            .then((data) => {
                setFetched(data);
                writeCachedFlags(data);
            })
            .catch((err) => {
                console.error("FeatureFlagsProvider: falló GET /api/feature-flags", err);
                setFetched({});
            });
    }, [status]);

    useEffect(() => {
        if (status === "unauthenticated") {
            // Logout: descartar cache para que la próxima sesión no vea
            // flags de otro usuario (aunque hoy son globales, mañana podrían
            // ser per-user).
            writeCachedFlags(null);
            return;
        }
        if (status !== "authenticated") return;
        let cancelled = false;
        obtenerFlagsPublicos()
            .then((data) => {
                if (cancelled) return;
                setFetched(data);
                writeCachedFlags(data);
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
