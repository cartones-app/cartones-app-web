import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { rolesIncluyeAdmin } from "@/lib/auth-roles";

/**
 * Layout que protege TODA la subtree {@code /admin/*}. Server Component —
 * la verificación de rol corre en el server antes de generar HTML, así no
 * hay flash de spinner para los admins legítimos ni para los redirigidos.
 *
 * <p>Si el user no tiene rol ADMIN: {@code redirect("/")} — Next emite un
 * 307 hacia el home sin renderizar contenido. Si no hay sesión (debería ser
 * imposible porque el middleware redirige a /api/auth/signin), también
 * tiramos al home.
 *
 * <p>Defensa en capas: este check es UX (cero flash) — el backend sigue
 * siendo la verdadera última línea con {@code SecurityConfig} +
 * {@code @PreAuthorize("hasRole('ADMIN')")}.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth();
    if (!session || !rolesIncluyeAdmin(session.roles)) {
        redirect("/");
    }
    return children;
}
