/**
 * Helpers de matching de roles, isomórficos (server + client). Sin
 * {@code "use client"} a propósito — un Server Component que necesita
 * decidir si redirigir basándose en el rol del JWT puede importar de acá.
 *
 * Convención: Keycloak realm-role {@code admin} (case-insensitive). El
 * backend usa {@code KeycloakRolesConverter} que mapea
 * {@code realm_access.roles} a Spring {@code ROLE_admin}/{@code ROLE_ADMIN};
 * el {@code @PreAuthorize("hasRole('ADMIN')")} matchea sin importar la
 * capitalización. Reproducimos el mismo comportamiento case-insensitive
 * en el front.
 */
const ADMIN_ROLE_NAMES = new Set(["admin"]);

export function rolesIncluyeAdmin(roles: string[] | undefined): boolean {
    if (!roles) return false;
    return roles.some((r) => ADMIN_ROLE_NAMES.has(r.toLowerCase()));
}
