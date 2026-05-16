"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUserPermissions } from "@/lib/auth-utils";

/**
 * Layout que protege TODA la subtree {@code /admin/*}. Si el user no tiene rol
 * ADMIN, redirige a la home con un toast informativo.
 *
 * Defensa en capas: este check es UX-only — el backend es la verdadera última
 * línea con {@code SecurityConfig} + {@code @PreAuthorize("hasRole('ADMIN')")}.
 * Sin esta guarda client-side, un DISTRIBUIDOR podía navegar directo a la URL
 * y ver un loading state confuso antes de que el axios interceptor mostrara
 * un toast de error.
 */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { loading, esAdmin } = useUserPermissions();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !esAdmin) {
            toast.error("Acceso restringido", {
                description: "Esta sección es solo para administradores.",
            });
            router.replace("/");
        }
    }, [loading, esAdmin, router]);

    // Mientras carga la sesión, o mientras estamos a punto de redirigir,
    // mostrar un spinner — evita el flash de contenido admin para un user sin
    // permisos antes de que el useEffect de arriba dispare el replace().
    if (loading || !esAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <>{children}</>;
}
