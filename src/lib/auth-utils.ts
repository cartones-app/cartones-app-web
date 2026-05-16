"use client";

import { useSession } from "next-auth/react";

import { rolesIncluyeAdmin } from "./auth-roles";

// Re-export para no romper imports existentes
// (`import { rolesIncluyeAdmin } from "@/lib/auth-utils"`).
export { rolesIncluyeAdmin };

export interface UserPermissions {
    /** true mientras NextAuth resuelve la sesión inicial. */
    loading: boolean;
    /** true si el usuario está autenticado. */
    autenticado: boolean;
    /** true si tiene rol admin en Keycloak. */
    esAdmin: boolean;
    /** Lista cruda de roles desde el JWT, lowercased. */
    roles: string[];
    /** Display name si está disponible. */
    displayName: string | null;
}

/**
 * Hook centralizado para permisos del usuario. Reemplaza el patrón de
 * leer session.user en cada componente y reescribir la lógica de rol.
 */
export function useUserPermissions(): UserPermissions {
    const { data: session, status } = useSession();
    return {
        loading: status === "loading",
        autenticado: status === "authenticated",
        esAdmin: rolesIncluyeAdmin(session?.roles),
        roles: (session?.roles ?? []).map((r) => r.toLowerCase()),
        displayName: session?.user?.name ?? session?.user?.email ?? null,
    };
}
