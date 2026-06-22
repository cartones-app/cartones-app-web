"use client";

import { memo, useCallback, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { RegistroRutaDTO } from "@/types";

interface RutaRegistrosStepProps {
    registros: RegistroRutaDTO[];
    onExportar: (registros: RegistroRutaDTO[]) => void;
    cargando: boolean;
    /**
     * `true` cuando el último intento de exportar falló (HTTP no-2xx). El
     * componente surfacea un mensaje en línea para que el usuario sepa que
     * el click no fue ignorado, y para diferenciarlo del estado "todo OK,
     * podés intentar más tarde".
     */
    errorExportar: boolean;
}

type EditableField =
    | "seneteTotalEnviado"
    | "telebingoTotalEnviado"
    | "refSenete"
    | "refTelb"
    | "devSen"
    | "devTelb"
    | "pago1"
    | "pago2"
    | "nota";

const NUMERIC_FIELDS: EditableField[] = [
    "seneteTotalEnviado",
    "telebingoTotalEnviado",
    "refSenete",
    "refTelb",
    "devSen",
    "devTelb",
    "pago1",
    "pago2",
];

export function RutaRegistrosStep({
    registros: registrosIniciales,
    onExportar,
    cargando,
    errorExportar,
}: Readonly<RutaRegistrosStepProps>) {
    const [registros, setRegistros] = useState<RegistroRutaDTO[]>(registrosIniciales);

    // useCallback con [] de deps: la función es estable entre renders, lo que
    // permite que el React.memo de RegistroRow compare por referencia y
    // saltee los rerenders de filas no tocadas en cada keystroke.
    const actualizar = useCallback((idx: number, campo: EditableField, valor: string) => {
        setRegistros((prev) => {
            const next = [...prev];
            const reg = { ...next[idx] };
            if (NUMERIC_FIELDS.includes(campo)) {
                const num = valor === "" ? null : Number(valor);
                (reg as Record<EditableField, number | string | null>)[campo] = num;
            } else {
                (reg as Record<EditableField, number | string | null>)[campo] = valor;
            }
            next[idx] = reg;
            return next;
        });
    }, []);

    const totalCompletados = registros.filter((r) => esCompletado(r)).length;

    if (registros.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                No hay registros para las fechas seleccionadas.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                    <p className="text-sm font-medium">
                        {registros.length} registro{registros.length === 1 ? "" : "s"} a completar
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {totalCompletados} completo{totalCompletados === 1 ? "" : "s"}, {registros.length - totalCompletados} pendiente{registros.length - totalCompletados === 1 ? "" : "s"}.
                    </p>
                </div>
                <Button onClick={() => onExportar(registros)} disabled={cargando}>
                    {cargando ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : errorExportar ? (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    {errorExportar ? "Reintentar exportación" : "Exportar Excel"}
                </Button>
            </div>
            {errorExportar && !cargando && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">No se pudo exportar el Excel</p>
                        <p className="text-destructive/80">
                            Revisá el mensaje del toast con el detalle. Si el problema persiste, volvé a empezar (Empezar de nuevo) o probá más tarde.
                        </p>
                    </div>
                </div>
            )}

            <div className="rounded-lg border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendedor</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Sen. tot.</TableHead>
                            <TableHead className="text-right">Tlb. tot.</TableHead>
                            <TableHead className="text-right">Ref. sen.</TableHead>
                            <TableHead className="text-right">Ref. tlb.</TableHead>
                            <TableHead className="text-right">Dev. sen.</TableHead>
                            <TableHead className="text-right">Dev. tlb.</TableHead>
                            <TableHead className="text-right">Pago 1</TableHead>
                            <TableHead className="text-right">Pago 2</TableHead>
                            <TableHead>Nota</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registros.map((r, idx) => (
                            <RegistroRow
                                key={`${r.vendedorId}-${r.fecha}-${r.numeroFila}`}
                                registro={r}
                                idx={idx}
                                onActualizar={actualizar}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

/**
 * Una fila de la tabla. {@link memo} para que el keystroke en una fila
 * solo re-renderice esa fila — sin la memoización, con N=100 filas y 11
 * inputs cada una, cada tecla disparaba un re-render de 1100 inputs.
 *
 * Las props {@code registro} (referencia nueva solo para la fila tocada) e
 * {@code idx} bastan para comparación por referencia. {@code onActualizar}
 * es estable por {@code useCallback([])} en el padre.
 */
const RegistroRow = memo(function RegistroRow({
    registro,
    idx,
    onActualizar,
}: {
    registro: RegistroRutaDTO;
    idx: number;
    onActualizar: (idx: number, campo: EditableField, valor: string) => void;
}) {
    return (
        <TableRow>
            <TableCell className="font-medium whitespace-nowrap">{registro.nombre}</TableCell>
            <TableCell className="font-mono text-xs whitespace-nowrap">{registro.fecha}</TableCell>
            {NUMERIC_FIELDS.map((f) => (
                <TableCell key={f} className="text-right">
                    <NumericInput
                        value={registro[f] as number | null}
                        onChange={(v) => onActualizar(idx, f, v)}
                        aria-label={`${f} de ${registro.nombre}`}
                    />
                </TableCell>
            ))}
            <TableCell>
                <Input
                    value={registro.nota ?? ""}
                    onChange={(e) => onActualizar(idx, "nota", e.target.value)}
                    className="h-8 min-w-[120px]"
                    aria-label={`Nota de ${registro.nombre}`}
                />
            </TableCell>
        </TableRow>
    );
});

function NumericInput({
    value,
    onChange,
    ...rest
}: {
    value: number | null;
    onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
    return (
        <Input
            type="number"
            inputMode="decimal"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-20 text-right tabular-nums"
            {...rest}
        />
    );
}

function esCompletado(r: RegistroRutaDTO): boolean {
    // Heurística mínima: tiene al menos pago1 cargado.
    return r.pago1 != null;
}
