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
    hour12: false,
    hourCycle: "h23",
};

const FECHA_HORA_CORTA_OPTS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
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
 *
 * Reconstruimos el string a partir de `formatToParts` porque `toLocaleString`
 * con `2-digit` en es-AR ignora el padding cuando NO hay `year` en las opts
 * (variantes de ICU devuelven "16/5, 22:00" en lugar de "16/05, 22:00"). Esto
 * mantiene el contrato DD/MM independiente de la versión de Node/ICU.
 */
export function formatFechaHoraCorta(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
        const parts = new Intl.DateTimeFormat("es-AR", FECHA_HORA_CORTA_OPTS)
            .formatToParts(parseBackendIso(iso));
        const get = (type: Intl.DateTimeFormatPartTypes) =>
            parts.find((p) => p.type === type)?.value ?? "";
        const dd = get("day").padStart(2, "0");
        const mm = get("month").padStart(2, "0");
        const hh = get("hour").padStart(2, "0");
        const min = get("minute").padStart(2, "0");
        return `${dd}/${mm}, ${hh}:${min}`;
    } catch {
        return iso;
    }
}

// --- Helpers para Date (no ISO del backend) ------------------------------

const FECHA_LARGA_OPTS: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
};

/**
 * Formato largo "27 de mayo de 2026" en español. Equivalente al
 * `format(d, "PPP", { locale: es })` de date-fns, pero con Intl nativo
 * (cero KB de bundle).
 */
export function formatFechaLarga(d: Date): string {
    return new Intl.DateTimeFormat("es-AR", FECHA_LARGA_OPTS).format(d);
}

/**
 * ISO `yyyy-MM-dd` en el huso horario del BROWSER que ejecuta esta función
 * (no UTC). "Local" = la TZ del visitante de la app, no la del servidor ni
 * la del desarrollador. Útil para fechas sin componente horario, donde
 * cada usuario debería ver "su día calendario".
 *
 * Si usáramos `toISOString().slice(0,10)` un usuario en hora UTC-3 a las
 * 22:00 vería el día siguiente — y eso casi nunca es lo deseado.
 *
 * Round-trip estable con el constructor `new Date(y, m-1, d)` dentro del
 * mismo browser (ambos lados usan getFullYear/getMonth/getDate locales).
 */
export function dateToIsoLocal(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
