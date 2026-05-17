import { describe, expect, it } from "vitest";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";

import {
    KEYCLOAK_SIGNIN_PATH,
    evaluarAcceso,
    requiereSesion,
} from "@/lib/auth-middleware";

/**
 * Construye un mínimo `NextRequest` con `nextUrl` que basta para `evaluarAcceso`.
 * No usamos el constructor real de NextRequest porque arrastra dependencias del
 * runtime de Next; la función solo lee `nextUrl.{pathname,search,origin}`.
 */
function mockRequest(pathname: string, search = ""): NextRequest {
    const url = new URL(`http://app.local${pathname}${search}`);
    return {
        nextUrl: url,
        url: url.toString(),
    } as unknown as NextRequest;
}

function sessionConToken(over: Partial<Session> = {}): Session {
    return {
        // El tipo Session de next-auth tiene `expires` requerido; el resto lo
        // augmentamos con accessToken/error en types/next-auth.d.ts.
        expires: new Date(Date.now() + 60_000).toISOString(),
        accessToken: "fake.jwt.token",
        ...over,
    } as Session;
}

describe("evaluarAcceso", () => {
    it("sin sesión → redirect a Keycloak signin con callbackUrl=path", () => {
        const result = evaluarAcceso(null, mockRequest("/configuracion"));
        expect(result).not.toBe(true);
        const response = result as Response;
        expect(response.status).toBe(307);
        const location = new URL(response.headers.get("location")!);
        expect(location.pathname).toBe(KEYCLOAK_SIGNIN_PATH);
        expect(location.searchParams.get("callbackUrl")).toBe("/configuracion");
    });

    it("la home `/` es pública y pasa sin sesión", () => {
        // La home es landing/anónima — muestra "Gestión de cartones" como
        // texto genérico cuando no hay sesión, y saludo personalizado cuando
        // sí. Negarle el acceso anónimo rompería ese contrato.
        const result = evaluarAcceso(null, mockRequest("/"));
        expect(result).toBe(true);
    });

    it("preserva query strings en callbackUrl", () => {
        const result = evaluarAcceso(
            null,
            mockRequest("/admin/distribuciones", "?page=2&q=test"),
        );
        const location = new URL((result as Response).headers.get("location")!);
        expect(location.searchParams.get("callbackUrl")).toBe(
            "/admin/distribuciones?page=2&q=test",
        );
    });

    it("con accessToken válido y sin error → true (passthrough)", () => {
        const result = evaluarAcceso(sessionConToken(), mockRequest("/configuracion"));
        expect(result).toBe(true);
    });

    it("con sesión pero error=RefreshAccessTokenError → redirect", () => {
        const result = evaluarAcceso(
            sessionConToken({ error: "RefreshAccessTokenError" } as Partial<Session>),
            mockRequest("/configuracion"),
        );
        expect(result).not.toBe(true);
        expect((result as Response).status).toBe(307);
    });

    it("con session vacía (sin accessToken) en ruta protegida → redirect", () => {
        // Caso del bug: session existe pero sin accessToken. La versión anterior
        // del callback retornaba `false` y NextAuth v5 beta no redirigía con
        // confiabilidad → la página quedaba accesible.
        const result = evaluarAcceso(
            { expires: new Date(Date.now() + 60_000).toISOString() } as Session,
            mockRequest("/upload"),
        );
        expect(result).not.toBe(true);
        expect((result as Response).status).toBe(307);
    });

    it("la home `/` es pública incluso con sesión rota (no redirige)", () => {
        // Si por algún motivo se accede a `/` con sesión inválida, el
        // middleware igual deja pasar — la home se las arregla mostrando el
        // texto anónimo. No tiene sentido forzar login para una landing.
        const result = evaluarAcceso(
            { expires: new Date(Date.now() + 60_000).toISOString() } as Session,
            mockRequest("/"),
        );
        expect(result).toBe(true);
    });

    it("el redirect apunta al origin de la request (no a un host hardcoded)", () => {
        // En prod la app corre en distintos dominios (Vercel preview, prod, dev).
        // El redirect debe ser relativo al origin actual, sin asumir el host.
        const url = new URL("https://staging.example.com/configuracion");
        const request = {
            nextUrl: url,
            url: url.toString(),
        } as unknown as NextRequest;
        const result = evaluarAcceso(null, request);
        const location = new URL((result as Response).headers.get("location")!);
        expect(location.origin).toBe("https://staging.example.com");
    });
});

describe("requiereSesion", () => {
    it("`/` no requiere sesión (ruta pública)", () => {
        expect(requiereSesion("/")).toBe(false);
    });

    it("cualquier subruta requiere sesión", () => {
        expect(requiereSesion("/upload")).toBe(true);
        expect(requiereSesion("/configuracion")).toBe(true);
        expect(requiereSesion("/admin/distribuciones")).toBe(true);
        expect(requiereSesion("/resultados")).toBe(true);
    });

    it("paths que solo empiezan con `/` pero no son la home siguen siendo protegidos", () => {
        // Guard contra implementación que use startsWith en vez de igualdad
        // exacta — si alguien escribe `/info` no debería pasar como público.
        expect(requiereSesion("/info")).toBe(true);
        expect(requiereSesion("//")).toBe(true);
    });
});
