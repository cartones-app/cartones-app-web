/**
 * Helpers para armar PDFs en el cliente con pdfme.
 *
 * <p>Flujo end-to-end:
 *   1. Backend devuelve {@link DistribucionDatosPdf} + {@link PdfTemplateActive}.
 *   2. {@link mapEtiquetasAInputs} / {@link mapResumenAInputs} convierten los
 *      datos a la forma {@code inputs} que pdfme espera ({@code Array<Record<string,unknown>>}).
 *   3. {@link generarPdfBlob} llama a {@code @pdfme/generator.generate} y
 *      devuelve un {@code Blob application/pdf} listo para {@code saveAs}.
 *
 * <p>pdfme se importa dinámicamente para que no infle el bundle de las páginas
 * que no usan PDF (todas excepto /resultados y /admin/pdf-templates).
 */

import type { DistribucionDatosPdf, EtiquetaInput, PdfTemplateActive, ResumenInput } from "@/types";

/** Convierte fecha ISO yyyy-MM-dd a dd/MM/yyyy para mostrar al usuario. */
function formatFechaPdf(iso: string | null | undefined): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return y && m && d ? `${d}/${m}/${y}` : "";
}

/**
 * Aplana un EtiquetaInput a un objeto plano con los placeholders que el
 * template de pdfme puede bindear ({@code nombre}, {@code seneteRangos},
 * etc.). pdfme no acepta arrays directamente como valores de text fields,
 * así que joineamos con saltos de línea — el admin verá las líneas
 * cuando configure el text field en el Designer.
 */
function etiquetaAPlaceholders(e: EtiquetaInput): Record<string, string> {
    return {
        numeroVendedor: String(e.numeroVendedor),
        nombre: e.nombre,
        saldo: e.saldo,
        seneteRangos: e.seneteRangos.join("\n"),
        seneteCartones: e.seneteCartones,
        resultadoSenete: e.resultadoSenete,
        telebingoRangos: e.telebingoRangos.join("\n"),
        telebingoCartones: e.telebingoCartones,
        resultadoTelebingo: e.resultadoTelebingo,
    };
}

/**
 * Agrupa las etiquetas en bloques de {@code slotsPorPagina} y devuelve cada
 * bloque como una fila de inputs con los nombres sufijados ({@code _1, _2, ...}).
 *
 * <p>El valor de {@code slotsPorPagina} viene del template activo en el backend
 * (el admin lo elige al editar). Soporta 3 (layout original) y 4 (más compacto).
 *
 * <p>Ejemplo con 5 etiquetas y slots=3:
 *   página 1: {nombre_1, nombre_2, nombre_3, saldo_1, ...}
 *   página 2: {nombre_1, nombre_2, fechas, ...}  (slot 3 vacío)
 *
 * <p>El template del admin debe usar fields con nombres {@code nombre_1},
 * {@code nombre_2}, etc. hasta {@code nombre_N} donde N=slotsPorPagina.
 * La fecha es global a la página.
 */
export function mapEtiquetasAInputs(
    etiquetas: EtiquetaInput[],
    fechaSorteoSenete: string,
    fechaSorteoTelebingo: string,
    slotsPorPagina: number
): Array<Record<string, string>> {
    if (slotsPorPagina < 1) {
        throw new Error(`slotsPorPagina debe ser >= 1, recibido: ${slotsPorPagina}`);
    }

    const inputs: Array<Record<string, string>> = [];
    const fechaSenete = formatFechaPdf(fechaSorteoSenete);
    const fechaTelebingo = formatFechaPdf(fechaSorteoTelebingo);

    for (let i = 0; i < etiquetas.length; i += slotsPorPagina) {
        const pagina: Record<string, string> = {
            fechaSorteoSenete: fechaSenete,
            fechaSorteoTelebingo: fechaTelebingo,
        };
        for (let slot = 1; slot <= slotsPorPagina; slot++) {
            const etq = etiquetas[i + slot - 1];
            if (!etq) {
                // Slots vacíos: dejamos los placeholders vacíos para que el
                // template no muestre datos viejos. pdfme tolera campos
                // missing — los renderiza como string vacío.
                continue;
            }
            const plano = etiquetaAPlaceholders(etq);
            for (const [key, value] of Object.entries(plano)) {
                pagina[`${key}_${slot}`] = value;
            }
        }
        inputs.push(pagina);
    }

    return inputs;
}

/**
 * Mapea ResumenInput[] a una única fila de inputs con un placeholder
 * {@code tabla} que es un array 2D (filas × columnas) — el field de tipo
 * {@code table} de pdfme lo consume directamente.
 *
 * <p>Layout de la tabla: número, nombre, rangos senete (del-al), cantidad
 * senete, rangos telebingo (del-al), cantidad telebingo.
 */
export function mapResumenAInputs(
    resumen: ResumenInput[],
    fechaSorteoSenete: string,
    fechaSorteoTelebingo: string
): Array<Record<string, unknown>> {
    const filas: string[][] = resumen.map((r) => [
        String(r.numeroVendedor),
        r.nombre,
        formatRangos(r.seneteDelAl),
        String(r.cantidadSenete),
        formatRangos(r.telebingoDelAl),
        String(r.cantidadTelebingo),
    ]);
    return [
        {
            fechaSorteoSenete: formatFechaPdf(fechaSorteoSenete),
            fechaSorteoTelebingo: formatFechaPdf(fechaSorteoTelebingo),
            tabla: filas,
        },
    ];
}

/** Formatea { "100": "150", "200": "230" } → "100-150\n200-230". */
function formatRangos(delAl: Record<string, string>): string {
    return Object.entries(delAl)
        .map(([desde, hasta]) => `${desde}-${hasta}`)
        .join("\n");
}

/**
 * Genera un PDF a partir de un template (JSON string del schema) + inputs
 * pre-armados. Devuelve un Blob {@code application/pdf}.
 *
 * @throws Error si el template no parsea o pdfme falla al renderizar.
 */
export async function generarPdfBlob(
    schemaJson: string,
    inputs: Array<Record<string, unknown>>
): Promise<Blob> {
    const { generate } = await import("@pdfme/generator");
    const { text, table } = await import("@pdfme/schemas");

    let template: Parameters<typeof generate>[0]["template"];
    try {
        template = JSON.parse(schemaJson);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`Template inválido (JSON no parsea): ${msg}`);
    }

    const pdf = await generate({
        template,
        inputs,
        plugins: { text, table },
    });
    const arrayBuffer = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
    return new Blob([arrayBuffer], { type: "application/pdf" });
}

/**
 * Genera ambos PDFs (etiquetas + resumen) a partir de los datos del proceso
 * y los templates activos. Devuelve los blobs por separado.
 *
 * <p>{@code templateEtiquetas.slotsPorPagina} controla cuántas etiquetas
 * entran en una página A4 (el admin lo eligió al editar).
 */
export async function generarPdfsDeProceso(
    datos: DistribucionDatosPdf,
    templateEtiquetas: PdfTemplateActive,
    templateResumen: PdfTemplateActive
): Promise<{ etiquetas: Blob; resumen: Blob }> {
    const inputsEtiquetas = mapEtiquetasAInputs(
        datos.etiquetas,
        datos.fechaSorteoSenete,
        datos.fechaSorteoTelebingo,
        templateEtiquetas.slotsPorPagina
    );
    const inputsResumen = mapResumenAInputs(
        datos.resumen,
        datos.fechaSorteoSenete,
        datos.fechaSorteoTelebingo
    );

    const [etiquetas, resumen] = await Promise.all([
        generarPdfBlob(templateEtiquetas.schemaJson, inputsEtiquetas),
        generarPdfBlob(templateResumen.schemaJson, inputsResumen),
    ]);
    return { etiquetas, resumen };
}
