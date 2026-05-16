import { describe, expect, it } from "vitest";

import {
    ESTADO_PROCESO_COLOR,
    ESTADO_PROCESO_COLOR_FALLBACK,
    normalizarEstado,
} from "@/lib/proceso-estado";

describe("normalizarEstado", () => {
    it("uppercase + trim", () => {
        expect(normalizarEstado("pendiente")).toBe("PENDIENTE");
        expect(normalizarEstado("  simulado  ")).toBe("SIMULADO");
        expect(normalizarEstado("COMPLETADO")).toBe("COMPLETADO");
    });

    it("trata null/undefined/empty como cadena vacía", () => {
        expect(normalizarEstado(null)).toBe("");
        expect(normalizarEstado(undefined)).toBe("");
        expect(normalizarEstado("")).toBe("");
    });
});

describe("ESTADO_PROCESO_COLOR", () => {
    it("tiene las 3 keys que el backend emite", () => {
        // Mantenido sincronizado con el EstadoEnum del backend.
        expect(ESTADO_PROCESO_COLOR.PENDIENTE).toBeTruthy();
        expect(ESTADO_PROCESO_COLOR.SIMULADO).toBeTruthy();
        expect(ESTADO_PROCESO_COLOR.COMPLETADO).toBeTruthy();
    });

    it("fallback no es undefined", () => {
        expect(ESTADO_PROCESO_COLOR_FALLBACK).toBeTruthy();
    });

    it("integra con normalizarEstado en el patrón de uso documentado", () => {
        // El patrón es: `ESTADO_PROCESO_COLOR[normalizarEstado(s)] ?? FALLBACK`
        expect(ESTADO_PROCESO_COLOR[normalizarEstado("pendiente")]).toBe(
            ESTADO_PROCESO_COLOR.PENDIENTE,
        );
        expect(
            ESTADO_PROCESO_COLOR[normalizarEstado("inexistente")] ?? ESTADO_PROCESO_COLOR_FALLBACK,
        ).toBe(ESTADO_PROCESO_COLOR_FALLBACK);
    });
});
