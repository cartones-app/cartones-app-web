/**
 * Formateo de timestamps que vienen del backend.
 *
 * El backend serializa `LocalDateTime` sin zona (p.ej. "2026-05-14T22:26:43"),
 * pero los valores son UTC (el container corre en UTC). Si parseamos eso con
 * `new Date(...)` directo, el browser los interpreta como hora local —
 * resultado: se ve la hora "literal" del backend, no convertida al huso
 * del usuario.
 *
 * Solución: si la cadena no incluye marca de zona (Z o ±HH:MM), forzamos
 * UTC agregándole 'Z' antes de parsear. Así `toLocaleString` puede
 * convertir al huso real del browser.
 */
function parseBackendIso(iso: string): Date {
    const tieneZona = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
    return new Date(tieneZona ? iso : `${iso}Z`);
}

const FECHA_HORA_OPTS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
};

const FECHA_HORA_CORTA_OPTS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
};

/**
 * Formato largo "DD/MM/YYYY, HH:mm" en el huso horario del usuario.
 * Locale es-AR por convención del proyecto.
 */
export function formatFechaHora(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
        return parseBackendIso(iso).toLocaleString("es-AR", FECHA_HORA_OPTS);
    } catch {
        return iso;
    }
}

/**
 * Formato corto "DD/MM HH:mm" en el huso horario del usuario. Para listados
 * compactos donde el año no aporta.
 */
export function formatFechaHoraCorta(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
        return parseBackendIso(iso).toLocaleString("es-AR", FECHA_HORA_CORTA_OPTS);
    } catch {
        return iso;
    }
}
