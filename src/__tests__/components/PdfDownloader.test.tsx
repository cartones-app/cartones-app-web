import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PdfDownloader } from "@/components/PdfDownloader";

vi.mock("@/lib/api", () => ({
    descargarEtiquetas: vi.fn().mockResolvedValue(new Blob(["et"])),
    descargarResumen: vi.fn().mockResolvedValue(new Blob(["res"])),
    generarArchivosProceso: vi.fn(),
}));

vi.mock("file-saver", () => ({
    saveAs: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock("@/store/useProcesoStore", () => ({
    useProcesoStore: vi.fn(
        (
            selector: (s: {
                procesoCompletado: boolean;
                marcarProcesoCompletado: () => void;
            }) => unknown,
        ) => selector({ procesoCompletado: false, marcarProcesoCompletado: vi.fn() }),
    ),
}));

describe("PdfDownloader", () => {
    it("antes de generar muestra el CTA y oculta los botones de descarga", () => {
        render(<PdfDownloader procesoId="p1" onBack={() => {}} onReset={() => {}} />);
        // El botón aparece tanto en la card como en el floating dock (2 instancias)
        expect(screen.getAllByRole("button", { name: /generar archivos/i }).length).toBeGreaterThan(0);
        expect(screen.queryByRole("button", { name: /descargar etiquetas/i })).not.toBeInTheDocument();
    });

    it("genera archivos y revela los botones de descarga", async () => {
        const api = await import("@/lib/api");
        const genSpy = vi.mocked(api.generarArchivosProceso);
        genSpy.mockClear();
        genSpy.mockResolvedValue({
            procesoId: "p1",
            archivosGeneradosEn: "2026-05-17T12:00:00",
        });

        render(<PdfDownloader procesoId="p1" onBack={() => {}} onReset={() => {}} />);
        fireEvent.click(screen.getAllByRole("button", { name: /generar archivos/i })[0]);

        await waitFor(() => {
            expect(genSpy).toHaveBeenCalledWith("p1");
        });
        await waitFor(() => {
            expect(screen.getAllByRole("button", { name: /descargar etiquetas/i }).length).toBeGreaterThan(0);
            expect(screen.getAllByRole("button", { name: /descargar resumen/i }).length).toBeGreaterThan(0);
        });
    });

    it("dispara descarga de etiquetas usando el endpoint user", async () => {
        const api = await import("@/lib/api");
        vi.mocked(api.generarArchivosProceso).mockResolvedValue({
            procesoId: "p1",
            archivosGeneradosEn: "2026-05-17T12:00:00",
        });
        const descSpy = vi.mocked(api.descargarEtiquetas);
        descSpy.mockClear();

        render(<PdfDownloader procesoId="p1" onBack={() => {}} onReset={() => {}} />);
        fireEvent.click(screen.getAllByRole("button", { name: /generar archivos/i })[0]);
        await waitFor(() =>
            expect(screen.getAllByRole("button", { name: /descargar etiquetas/i }).length).toBeGreaterThan(0),
        );

        fireEvent.click(screen.getAllByRole("button", { name: /descargar etiquetas/i })[0]);
        await waitFor(() => expect(descSpy).toHaveBeenCalledWith("p1"));
    });

    it("no muestra UI relacionada a ZIP", () => {
        render(<PdfDownloader procesoId="p1" onBack={() => {}} onReset={() => {}} />);
        expect(screen.queryByText(/zip/i)).not.toBeInTheDocument();
    });

    it("si la generación falla (ej. 422), entra en estado de error y no avanza", async () => {
        const api = await import("@/lib/api");
        const genSpy = vi.mocked(api.generarArchivosProceso);
        genSpy.mockClear();
        genSpy.mockRejectedValue(new Error("422"));

        render(<PdfDownloader procesoId="p1" onBack={() => {}} onReset={() => {}} />);
        fireEvent.click(screen.getAllByRole("button", { name: /generar archivos/i })[0]);

        await waitFor(() => {
            expect(screen.getByText(/error al generar los archivos/i)).toBeInTheDocument();
        });
        // Sigue mostrando el CTA, no aparecen los botones de descarga
        expect(screen.queryByRole("button", { name: /descargar etiquetas/i })).not.toBeInTheDocument();
    });
});
