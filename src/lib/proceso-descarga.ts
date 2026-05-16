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
 * <p><b>Retorno</b>: {@code true} si la descarga efectivamente se gatilló
 * (el {@code saveAs} corrió). {@code false} si el ZIP descargado no contenía
 * el PDF pedido — en ese caso ya se mostró un {@code toast.warning} desde
 * acá y el caller debería evitar mostrar un toast de éxito contradictorio.
 *
 * <p><b>Errores</b>: los errores HTTP los muestra el interceptor axios
 * global; acá los re-lanzamos para que el caller maneje su propio loading
 * state via try/catch.
 */
export async function descargarArchivoProceso(
    procesoId: string,
    tipo: DescargaTipo,
    fetchBlob: (procesoId: string) => Promise<Blob>
): Promise<boolean> {
    const blob = await fetchBlob(procesoId);
    const idCorto = procesoId.slice(0, 8);

    if (tipo === "zip") {
        saveAs(blob, `distribucion-${idCorto}.zip`);
        return true;
    }

    const { etiquetas, resumen } = await extractPdfsFromZip(blob);
    if (tipo === "etiquetas") {
        if (!etiquetas) {
            toast.warning("No hay PDF de etiquetas en este proceso.");
            return false;
        }
        saveAs(etiquetas, `etiquetas-${idCorto}.pdf`);
        return true;
    }

    // tipo === "resumen"
    if (!resumen) {
        toast.warning("No hay PDF de resumen en este proceso.");
        return false;
    }
    saveAs(resumen, `resumen-${idCorto}.pdf`);
    return true;
}
