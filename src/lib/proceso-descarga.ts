import { saveAs } from "file-saver";
import { toast } from "sonner";

import { extractPdfsFromZip } from "@/lib/pdf-from-zip";

/** Tipo de archivo a descargar de un proceso de distribución. */
export type DescargaTipo = "etiquetas" | "resumen" | "zip";

/**
 * Descarga un PDF (etiquetas / resumen) o el ZIP completo de un proceso.
 *
 * <p>El caller pasa el fetcher (ej: `downloadPdfs` o `downloadPdfsAdmin`)
 * para que el helper no conozca el endpoint — usa el que corresponde según
 * el contexto (DISTRIBUIDOR vs ADMIN, etc.).
 *
 * <p>Errores: los errores HTTP los muestra el interceptor axios global, así
 * que acá solo lanzamos para que el caller maneje su propio loading state.
 * Los casos de "ZIP descargado pero no contiene el PDF pedido" se reportan
 * como `toast.warning` (no es un error técnico, es un dato faltante esperable).
 */
export async function descargarArchivoProceso(
    procesoId: string,
    tipo: DescargaTipo,
    fetchBlob: (procesoId: string) => Promise<Blob>
): Promise<void> {
    const blob = await fetchBlob(procesoId);
    const idCorto = procesoId.slice(0, 8);

    if (tipo === "zip") {
        saveAs(blob, `distribucion-${idCorto}.zip`);
        return;
    }

    const { etiquetas, resumen } = await extractPdfsFromZip(blob);
    if (tipo === "etiquetas") {
        if (!etiquetas) {
            toast.warning("No hay PDF de etiquetas en este proceso.");
            return;
        }
        saveAs(etiquetas, `etiquetas-${idCorto}.pdf`);
        return;
    }

    // tipo === "resumen"
    if (!resumen) {
        toast.warning("No hay PDF de resumen en este proceso.");
        return;
    }
    saveAs(resumen, `resumen-${idCorto}.pdf`);
}
