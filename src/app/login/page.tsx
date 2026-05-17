"use client";

import { Suspense, useEffect } from "react";
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
 *
 * Notas de seguridad:
 *  - El `callbackUrl` se pasa tal cual a `signIn`. NextAuth lo valida
 *    contra `AUTH_URL` (o el `Host` con `AUTH_TRUST_HOST=true`) antes
 *    de redirigir, lo que mitiga open-redirect. Es crítico que en prod
 *    `AUTH_URL` esté seteada al dominio real bajo el proxy reverso.
 */
function LoginInner() {
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

/**
 * `useSearchParams` en client components fuerza al árbol entero a rendering
 * dinámico salvo que esté dentro de un `<Suspense>` boundary. Sin esto,
 * Next 16 emite warning en build y no puede streamear el spinner antes de
 * resolver el query.
 */
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2
                        className="h-6 w-6 animate-spin text-muted-foreground"
                        aria-hidden="true"
                    />
                </div>
            }
        >
            <LoginInner />
        </Suspense>
    );
}
