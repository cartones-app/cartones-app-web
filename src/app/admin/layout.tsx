import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { rolesIncluyeAdmin } from "@/lib/auth-roles";

/**
 * Layout que protege TODA la subtree {@code /admin/*}. Server Component —
 * la verificación de rol corre en el server antes de generar HTML, así no
 * hay flash de spinner.
 *
 * <p>Capas de protección para esta subtree:
 *  <ol>
 *    <li>Middleware ({@code middleware.ts} + {@code evaluarAcceso}) valida
 *        que haya sesión válida → si no, redirect a {@code /login}.</li>
 *    <li>Este layout valida el rol ADMIN además de la sesión. Si está
 *        logueado pero NO es admin, {@code redirect("/")} sin callbackUrl —
 *        no queremos que vuelva a {@code /admin} tras un eventual relogin.</li>
 *    <li>Backend con {@code @PreAuthorize("hasRole('ADMIN')")} — última
 *        línea de defensa real.</li>
 *  </ol>
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const session = await auth();
    if (!session || !rolesIncluyeAdmin(session.roles)) {
        redirect("/");
    }
    return children;
}
