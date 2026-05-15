/**
 * Helpers compartidos para representar el estado de un ProcesoDistribucion en
 * la UI. Centralizado acá para no duplicar el mapa de colores ni la lógica de
 * normalización en cada vista que muestra un badge de estado.
 *
 * <p>El backend serializa los estados en lowercase (enum `EstadoEnum` con
 * `@JsonValue`). En la UI los matcheamos UPPERCASE — si el case cambia en
 * el backend, alcanza con tocar {@link normalizarEstado}.
 */

export type EstadoProceso = "PENDIENTE" | "SIMULADO" | "COMPLETADO";

/** Clases tailwind por estado. Usá `ESTADO_PROCESO_COLOR[normalizarEstado(s)] ?? FALLBACK_COLOR`. */
export const ESTADO_PROCESO_COLOR: Record<string, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    SIMULADO: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    COMPLETADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

/** Fallback neutro para estados desconocidos / no mapeados. */
export const ESTADO_PROCESO_COLOR_FALLBACK = "bg-muted text-muted-foreground border-border";

/** Normaliza a UPPERCASE para matchear el mapa de colores y la presentación. */
export function normalizarEstado(estado: string | undefined | null): string {
    return (estado ?? "").trim().toUpperCase();
}
