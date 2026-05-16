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
};

export default nextConfig;
