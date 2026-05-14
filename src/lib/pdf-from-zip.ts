import JSZip from "jszip";

export interface ExtractedPdfs {
    etiquetas: Blob | null;
    resumen: Blob | null;
}

/**
 * Abre el blob del ZIP devuelto por el backend (/api/distribuciones/{id}/pdfs)
 * y separa los dos PDFs por nombre de archivo, devolviéndolos como Blobs
 * application/pdf listos para guardar con saveAs.
 *
 * Matching es case-insensitive con palabras clave en español e inglés
 * (etiqueta/label, resumen/summary). Si no hay match por nombre, el primer
 * PDF se asigna como etiquetas y el segundo como resumen (heurística que
 * coincide con cómo el backend arma el ZIP).
 */
export async function extractPdfsFromZip(zipBlob: Blob): Promise<ExtractedPdfs> {
    const zip = await JSZip.loadAsync(zipBlob);

    let etiquetas: Blob | null = null;
    let resumen: Blob | null = null;

    for (const [filename, file] of Object.entries(zip.files)) {
        if (file.dir) continue;

        const content = await file.async("blob");
        const pdfBlob = new Blob([content], { type: "application/pdf" });

        const lowerName = filename.toLowerCase();
        if (lowerName.includes("etiqueta") || lowerName.includes("label")) {
            etiquetas = pdfBlob;
        } else if (lowerName.includes("resumen") || lowerName.includes("summary")) {
            resumen = pdfBlob;
        } else if (!etiquetas) {
            etiquetas = pdfBlob;
        } else if (!resumen) {
            resumen = pdfBlob;
        }
    }

    return { etiquetas, resumen };
}
