import { saveAs } from "file-saver";

/** Tipo de archivo a descargar de un proceso de distribución. */
export type DescargaTipo = "etiquetas" | "resumen";

/**
 * Descarga el PDF (etiquetas o resumen) de un proceso. El backend ya no devuelve
 * ZIP — cada PDF tiene su propio endpoint y se baja en streaming via sendfile.
 *
 * <p>El caller pasa el fetcher correcto según el contexto (DISTRIBUIDOR o
 * ADMIN). Los errores HTTP los maneja el interceptor axios global; acá los
 * re-lanzamos para que el caller pueda hacer su propio try/catch del loading
 * state.
 */
export async function descargarPdfProceso(
    procesoId: string,
    tipo: DescargaTipo,
    fetchBlob: (procesoId: string) => Promise<Blob>,
): Promise<void> {
    const blob = await fetchBlob(procesoId);
    const idCorto = procesoId.slice(0, 8);
    const prefijo = tipo === "etiquetas" ? "etiquetas" : "resumen";
    saveAs(blob, `${prefijo}-${idCorto}.pdf`);
}
