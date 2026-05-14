"use client";

import { useSession } from "next-auth/react";

/**
 * Convención: Keycloak realm-role `admin` (case-insensitive). El backend usa
 * `KeycloakRolesConverter` que mapea `realm_access.roles` a Spring
 * `ROLE_admin`/`ROLE_ADMIN` y el `@PreAuthorize("hasRole('ADMIN')")` matchea
 * sin importar la capitalización.
 *
 * Mantengo el matching client-side también case-insensitive para evitar
 * inconsistencias UX si Keycloak emite el role con otra capitalización.
 */
const ADMIN_ROLE_NAMES = new Set(["admin"]);

export function rolesIncluyeAdmin(roles: string[] | undefined): boolean {
    if (!roles) return false;
    return roles.some((r) => ADMIN_ROLE_NAMES.has(r.toLowerCase()));
}

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
