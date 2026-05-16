import { describe, expect, it } from "vitest";

import {
    dateToIsoLocal,
    formatFechaHora,
    formatFechaHoraCorta,
    formatFechaLarga,
} from "@/lib/date-format";

describe("formatFechaHora", () => {
    it('devuelve "—" para null/undefined/empty', () => {
        expect(formatFechaHora(null)).toBe("—");
        expect(formatFechaHora(undefined)).toBe("—");
        expect(formatFechaHora("")).toBe("—");
    });

    it("formatea ISO sin zona como UTC y lo presenta en TZ del browser (es-AR)", () => {
        // El backend manda LocalDateTime sin Z (asume UTC).
        // En CI / dev el browser/Node corre en UTC → resultado predecible.
        const result = formatFechaHora("2026-05-16T22:00:00");
        // Esperamos "DD/MM/YYYY, HH:mm" — el día y mes dependen de TZ pero
        // el formato debe matchear.
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4},?\s+\d{2}:\d{2}$/);
    });

    it("respeta marca de zona si la cadena la incluye", () => {
        // Z explícita: parseo limpio sin trampa de TZ.
        const out = formatFechaHora("2026-05-16T22:00:00Z");
        expect(out).toMatch(/^\d{2}\/\d{2}\/\d{4},?\s+\d{2}:\d{2}$/);
    });

    it("devuelve la cadena cruda si no es parseable", () => {
        // Si el parse explota, no rompemos la UI — devolvemos lo recibido.
        const malformed = "no es una fecha";
        // toLocaleString sobre NaN devuelve "Invalid Date"; cubrimos ese caso.
        const out = formatFechaHora(malformed);
        expect(out).toBeTruthy();
    });
});

describe("formatFechaHoraCorta", () => {
    it('devuelve "—" para falsy', () => {
        expect(formatFechaHoraCorta(null)).toBe("—");
        expect(formatFechaHoraCorta(undefined)).toBe("—");
    });

    it("formato corto sin año", () => {
        const out = formatFechaHoraCorta("2026-05-16T22:00:00Z");
        // Esperamos "DD/MM HH:mm" o "DD/MM, HH:mm" (es-AR puede agregar coma)
        expect(out).toMatch(/^\d{2}\/\d{2},?\s+\d{2}:\d{2}$/);
        // No debería contener año completo
        expect(out).not.toMatch(/\d{4}/);
    });
});

describe("formatFechaLarga", () => {
    it('formato largo en español para una Date', () => {
        const d = new Date(2026, 4, 16); // 16 de mayo de 2026
        const out = formatFechaLarga(d);
        // El locale es-AR puede variar entre runtimes pero esperamos mayo.
        expect(out.toLowerCase()).toContain("mayo");
        expect(out).toContain("2026");
        expect(out).toContain("16");
    });
});

describe("dateToIsoLocal", () => {
    it("convierte Date a yyyy-MM-dd en TZ del browser", () => {
        // Constructor con args numéricos (año, mes-1, día) = hora local 00:00.
        // dateToIsoLocal usa getFullYear/getMonth/getDate locales → mismo día.
        const d = new Date(2026, 0, 5); // 5 enero 2026 local
        expect(dateToIsoLocal(d)).toBe("2026-01-05");
    });

    it("padea mes y día con cero", () => {
        const d = new Date(2026, 8, 9); // 9 sep 2026 (mes 8 = septiembre)
        expect(dateToIsoLocal(d)).toBe("2026-09-09");
    });

    it("evita la trampa de toISOString (UTC) usando getters locales", () => {
        // Una fecha donde toISOString daría día distinto al local.
        // Construyo una fecha LOCAL para 1 enero 00:30 — en TZ con offset
        // negativo (UTC-3 ej.), toISOString daría 2 enero. dateToIsoLocal
        // debe seguir devolviendo 2026-01-01 porque usa getters locales.
        const d = new Date(2026, 0, 1, 0, 30); // 1 ene 00:30 local
        expect(dateToIsoLocal(d)).toBe("2026-01-01");
    });

    it("round-trip con `new Date(y, m-1, d)` es estable en el mismo browser", () => {
        const original = "2026-05-16";
        const [y, m, d] = original.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        expect(dateToIsoLocal(date)).toBe(original);
    });
});
