/**
 * Formatea un UUID (u otro id largo) como prefijo corto + ellipsis, p.ej.
 * "9b36cd48…". Pensado para mostrar identificadores en UI sin abrumar.
 *
 * Devolvemos el id tal cual si es mas corto que `len`, asi un id ya truncado
 * en el backend o un identificador corto no se decora innecesariamente.
 */
export function shortId(id: string | null | undefined, len = 8): string {
    if (!id) return "—";
    if (id.length <= len) return id;
    return `${id.slice(0, len)}…`;
}
