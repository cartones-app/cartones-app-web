/**
 * Helpers compartidos para representar el estado de una SesionRuta en la UI.
 * Paralelo a {@link proceso-estado} pero del dominio de ruta — los estados
 * son distintos ({@code ACTIVA / COMPLETADA / ARCHIVADA}).
 */

export const ESTADO_SESION_RUTA_COLOR: Record<string, string> = {
    ACTIVA: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    COMPLETADA: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    ARCHIVADA: "bg-muted text-muted-foreground border-border",
};

export const ESTADO_SESION_RUTA_COLOR_FALLBACK = "bg-muted text-muted-foreground border-border";
