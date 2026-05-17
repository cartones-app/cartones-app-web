import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DistribucionesTable } from "@/components/DistribucionesTable";
import type { ProcesoDistribucionResumenDTO } from "@/types";

vi.mock("@/lib/api", () => ({
    descargarEtiquetas: vi.fn().mockResolvedValue(new Blob(["x"])),
    descargarResumen: vi.fn().mockResolvedValue(new Blob(["x"])),
    descargarEtiquetasAdmin: vi.fn().mockResolvedValue(new Blob(["x"])),
    descargarResumenAdmin: vi.fn().mockResolvedValue(new Blob(["x"])),
}));

vi.mock("file-saver", () => ({
    saveAs: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

function row(over: Partial<ProcesoDistribucionResumenDTO> = {}): ProcesoDistribucionResumenDTO {
    return {
        procesoId: "abcd1234-uuid",
        estado: "COMPLETADO",
        createdAt: "2026-05-17T12:00:00",
        updatedAt: "2026-05-17T12:00:00",
        createdBy: "user1",
        archivosGeneradosEn: "2026-05-17T12:00:00",
        archivosBorradosEn: null,
        ...over,
    };
}

describe("DistribucionesTable", () => {
    it("muestra fila vacía con mensaje cuando no hay procesos", () => {
        render(<DistribucionesTable procesos={[]} />);
        expect(screen.getByText(/no hay distribuciones/i)).toBeInTheDocument();
    });

    it("marca 'Disponibles' cuando archivosGeneradosEn != null y archivosBorradosEn == null", () => {
        render(<DistribucionesTable procesos={[row()]} />);
        expect(screen.getByText("Disponibles")).toBeInTheDocument();
    });

    it("marca 'No disponibles' cuando los archivos fueron borrados y deshabilita descargas", () => {
        const p = row({
            archivosGeneradosEn: "2026-01-01T00:00:00",
            archivosBorradosEn: "2026-05-01T00:00:00",
        });
        render(<DistribucionesTable procesos={[p]} />);
        expect(screen.getByText("No disponibles")).toBeInTheDocument();
        expect(screen.getByLabelText("Descargar etiquetas")).toBeDisabled();
        expect(screen.getByLabelText("Descargar resumen")).toBeDisabled();
    });

    it("marca 'Sin generar' cuando archivosGeneradosEn es null", () => {
        const p = row({ archivosGeneradosEn: null });
        render(<DistribucionesTable procesos={[p]} />);
        expect(screen.getByText("Sin generar")).toBeInTheDocument();
        expect(screen.getByLabelText("Descargar etiquetas")).toBeDisabled();
    });

    it("dispara descarga vía el endpoint user por default", async () => {
        const api = await import("@/lib/api");
        const spyUser = vi.mocked(api.descargarEtiquetas);
        const spyAdmin = vi.mocked(api.descargarEtiquetasAdmin);
        spyUser.mockClear();
        spyAdmin.mockClear();

        render(<DistribucionesTable procesos={[row()]} />);
        fireEvent.click(screen.getByLabelText("Descargar etiquetas"));

        expect(spyUser).toHaveBeenCalledWith("abcd1234-uuid");
        expect(spyAdmin).not.toHaveBeenCalled();
    });

    it("en adminMode usa el endpoint admin", async () => {
        const api = await import("@/lib/api");
        const spyUser = vi.mocked(api.descargarResumen);
        const spyAdmin = vi.mocked(api.descargarResumenAdmin);
        spyUser.mockClear();
        spyAdmin.mockClear();

        render(<DistribucionesTable procesos={[row()]} adminMode />);
        fireEvent.click(screen.getByLabelText("Descargar resumen"));

        expect(spyAdmin).toHaveBeenCalledWith("abcd1234-uuid");
        expect(spyUser).not.toHaveBeenCalled();
    });

    it("no muestra ningún botón de ZIP (eliminado del flujo)", () => {
        render(<DistribucionesTable procesos={[row()]} />);
        expect(screen.queryByText(/zip/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/zip/i)).not.toBeInTheDocument();
    });
});
