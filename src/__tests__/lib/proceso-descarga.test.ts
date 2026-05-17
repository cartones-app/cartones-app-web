import { describe, expect, it, vi } from "vitest";
import { descargarPdfProceso } from "@/lib/proceso-descarga";

vi.mock("file-saver", () => ({
    saveAs: vi.fn(),
}));

describe("descargarPdfProceso", () => {
    it("llama al fetcher con el procesoId y dispara saveAs con nombre por tipo", async () => {
        const { saveAs } = await import("file-saver");
        const saveAsMock = vi.mocked(saveAs);
        saveAsMock.mockClear();

        const blob = new Blob(["pdf-bytes"], { type: "application/pdf" });
        const fetcher = vi.fn().mockResolvedValue(blob);

        await descargarPdfProceso("abcdef1234567890", "etiquetas", fetcher);

        expect(fetcher).toHaveBeenCalledWith("abcdef1234567890");
        expect(saveAsMock).toHaveBeenCalledTimes(1);
        const [savedBlob, savedName] = saveAsMock.mock.calls[0];
        expect(savedBlob).toBe(blob);
        // Prefijo del tipo + procesoId truncado a 8 chars + extensión
        expect(savedName).toBe("etiquetas-abcdef12.pdf");
    });

    it("usa el prefijo 'resumen' cuando el tipo es resumen", async () => {
        const { saveAs } = await import("file-saver");
        const saveAsMock = vi.mocked(saveAs);
        saveAsMock.mockClear();

        const fetcher = vi.fn().mockResolvedValue(new Blob(["x"]));

        await descargarPdfProceso("zzz12345678", "resumen", fetcher);

        expect(saveAsMock.mock.calls[0][1]).toBe("resumen-zzz12345.pdf");
    });

    it("propaga el error si el fetcher rechaza", async () => {
        const err = new Error("boom");
        const fetcher = vi.fn().mockRejectedValue(err);
        await expect(
            descargarPdfProceso("id1", "etiquetas", fetcher),
        ).rejects.toBe(err);
    });
});
