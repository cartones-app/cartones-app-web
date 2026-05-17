import { describe, expect, it } from "vitest";
import { archivosDisponibles, type ProcesoDistribucionResumenDTO } from "@/types";

function row(over: Partial<ProcesoDistribucionResumenDTO> = {}): ProcesoDistribucionResumenDTO {
    return {
        procesoId: "p1",
        estado: "COMPLETADO",
        createdAt: "2026-05-17T00:00:00",
        updatedAt: "2026-05-17T00:00:00",
        createdBy: "user",
        archivosGeneradosEn: null,
        archivosBorradosEn: null,
        ...over,
    };
}

describe("archivosDisponibles", () => {
    it("false si nunca se generaron archivos", () => {
        expect(archivosDisponibles(row({ archivosGeneradosEn: null }))).toBe(false);
    });

    it("false si fueron borrados", () => {
        expect(
            archivosDisponibles(
                row({
                    archivosGeneradosEn: "2026-04-01T00:00:00",
                    archivosBorradosEn: "2026-05-01T00:00:00",
                }),
            ),
        ).toBe(false);
    });

    it("true si están generados y no borrados", () => {
        expect(
            archivosDisponibles(
                row({
                    archivosGeneradosEn: "2026-05-01T00:00:00",
                    archivosBorradosEn: null,
                }),
            ),
        ).toBe(true);
    });
});
