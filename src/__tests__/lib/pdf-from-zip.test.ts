import { describe, expect, it } from "vitest";

import { extractPdfsFromZip } from "@/lib/pdf-from-zip";

/**
 * Construye un ZIP en memoria con los archivos pasados. Usa el JSZip
 * real (no mockeado) — son tests de comportamiento, no unit aislado.
 */
async function buildZip(files: Record<string, string>): Promise<Blob> {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
        zip.file(name, content);
    }
    const buf = await zip.generateAsync({ type: "uint8array" });
    return new Blob([buf as BlobPart], { type: "application/zip" });
}

// String simple en lugar de Uint8Array: jsdom/vitest tienen issues con
// Uint8Array dentro de JSZip en este setup; string evita el problema y
// el contenido real del PDF es irrelevante para los tests de matching.
const FAKE_PDF = "%PDF-1.4 fake content";

describe("extractPdfsFromZip", () => {
    it("matchea etiquetas y resumen por nombre en español", async () => {
        const zip = await buildZip({
            "Imprimir_etiquetas.pdf": FAKE_PDF,
            "Resumen_entrega.pdf": FAKE_PDF,
        });

        const out = await extractPdfsFromZip(zip);
        expect(out.etiquetas).toBeInstanceOf(Blob);
        expect(out.resumen).toBeInstanceOf(Blob);
        expect(out.etiquetas?.type).toBe("application/pdf");
        expect(out.resumen?.type).toBe("application/pdf");
    });

    it("matchea por keywords en inglés también (label/summary)", async () => {
        const zip = await buildZip({
            "labels.pdf": FAKE_PDF,
            "summary.pdf": FAKE_PDF,
        });

        const out = await extractPdfsFromZip(zip);
        expect(out.etiquetas).toBeInstanceOf(Blob);
        expect(out.resumen).toBeInstanceOf(Blob);
    });

    it("matching es case-insensitive", async () => {
        const zip = await buildZip({
            "ETIQUETAS.pdf": FAKE_PDF,
            "RESUMEN.pdf": FAKE_PDF,
        });

        const out = await extractPdfsFromZip(zip);
        expect(out.etiquetas).toBeInstanceOf(Blob);
        expect(out.resumen).toBeInstanceOf(Blob);
    });

    it("sin match por nombre: primer PDF es etiquetas, segundo resumen", async () => {
        const zip = await buildZip({
            "primero.pdf": FAKE_PDF,
            "segundo.pdf": FAKE_PDF,
        });

        const out = await extractPdfsFromZip(zip);
        expect(out.etiquetas).toBeInstanceOf(Blob);
        expect(out.resumen).toBeInstanceOf(Blob);
    });

    it("un solo PDF: queda como etiquetas, resumen null", async () => {
        const zip = await buildZip({ "etiquetas.pdf": FAKE_PDF });

        const out = await extractPdfsFromZip(zip);
        expect(out.etiquetas).toBeInstanceOf(Blob);
        expect(out.resumen).toBeNull();
    });

    it("zip vacío: ambos null", async () => {
        const zip = await buildZip({});
        const out = await extractPdfsFromZip(zip);
        expect(out.etiquetas).toBeNull();
        expect(out.resumen).toBeNull();
    });
});
