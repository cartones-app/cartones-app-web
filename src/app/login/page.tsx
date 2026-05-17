"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

/**
 * Page intermedia que dispara automáticamente el flujo de signin con
 * Keycloak. Existe para evitar la pantalla built-in de NextAuth (botón
 * "Sign in with Keycloak" → click manual) y los problemas de invocar el
 * endpoint `/api/auth/signin/keycloak` por GET (requiere POST con CSRF
 * en v5 → error=Configuration).
 *
 * Al montar:
 *  1. Lee `callbackUrl` del query (lo pone el middleware o el guard de
 *     layouts protegidos).
 *  2. Llama `signIn("keycloak", { callbackUrl })` que genera POST con CSRF
 *     interno de NextAuth y redirige al provider OAuth.
 *
 * UX: el usuario ve un spinner brevísimo antes de saltar a Keycloak.
 */
export default function LoginPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const callbackUrl = searchParams.get("callbackUrl") ?? "/";
        // redirect: true hace que NextAuth navegue al provider después del POST
        // (default). Lo explicitamos para que el comportamiento sea evidente.
        signIn("keycloak", { callbackUrl, redirect: true });
    }, [searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                <p className="text-sm">Redirigiendo al inicio de sesión…</p>
            </div>
        </div>
    );
}
