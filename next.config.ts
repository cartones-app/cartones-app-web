import type { NextConfig } from "next";

/**
 * Headers de seguridad aplicados a todas las respuestas. Equivalentes a los
 * que el backend ya inyecta para sus endpoints; acá blindamos también el
 * server de Next que sirve los assets, las páginas SSR y las route handlers.
 *
 *  - X-Content-Type-Options nosniff: el navegador respeta el MIME (evita
 *    que un .json se interprete como HTML por content-sniffing).
 *  - X-Frame-Options DENY: nadie puede embeber la app en un iframe (clickjacking).
 *  - Referrer-Policy strict-origin-when-cross-origin: no leakeamos URLs internas
 *    al navegar a sitios de terceros.
 *
 * No setamos CSP — la app sirve HTML con scripts inline de Next, requeriría
 * trabajo extra para enumerar sources. Aceptable diferirlo: la app es
 * autenticada y los headers de arriba ya mitigan los vectores comunes.
 */
const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

/**
 * URL interna del backend Spring Boot. Solo visible para el server de Next
 * (NO {@code NEXT_PUBLIC_*}). El browser nunca la ve — habla con el frontend
 * en same-origin y el Next forwardea via {@link nextConfig.rewrites}.
 *
 * Dev: {@code http://localhost:9001}.
 * Prod en VPS: {@code http://backend:9001} (DNS interno docker, mismo network
 * que el frontend en el stack del nginx-proxy).
 *
 * Falla en build si no está seteada (mejor explícito que silencioso).
 */
const backendInternalUrl = process.env.BACKEND_INTERNAL_URL;
if (!backendInternalUrl) {
    throw new Error(
        "BACKEND_INTERNAL_URL no está seteada. Ver .env.example.",
    );
}

const nextConfig: NextConfig = {
    // Build "standalone" para que la imagen Docker de prod sea liviana:
    // copia solo lo necesario en lugar de todo node_modules.
    // https://nextjs.org/docs/app/api-reference/config/next-config-js/output
    output: "standalone",

    // No agregar `X-Powered-By: Next.js` — informa al atacante qué stack
    // corremos. Ahorra un byte por response y reduce fingerprinting.
    poweredByHeader: false,

    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },

    /**
     * Proxy interno: el browser hace todas sus llamadas a `/api-proxy/...`
     * (same-origin) y el server de Next las reenvía al backend. La URL real
     * del backend queda fuera del bundle del cliente — solo Next la conoce
     * y solo se accede via DNS interno docker / loopback (no Cloudflare
     * Tunnel para tráfico front→back en prod).
     *
     * Prefijo `/api-proxy` (no `/api`) para no chocar con las rutas
     * `/api/auth/*` que maneja NextAuth.
     *
     * Los uploads multipart (Excel hasta 10MB) pasan por acá; Next stream
     * el body al backend sin buffering pesado. Si en el futuro la app
     * maneja archivos más grandes, evaluar si conviene servirlos directo
     * desde nginx con un rewrite a nivel de proxy reverso.
     */
    async rewrites() {
        return [
            {
                source: "/api-proxy/:path*",
                destination: `${backendInternalUrl}/:path*`,
            },
        ];
    },
};

export default nextConfig;
