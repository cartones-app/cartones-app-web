"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
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
}: RutaRegistrosStepProps) {
    const [registros, setRegistros] = useState<RegistroRutaDTO[]>(registrosIniciales);

    const actualizar = (idx: number, campo: EditableField, valor: string) => {
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
    };

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
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Exportar Excel
                </Button>
            </div>

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
                            <TableRow key={`${r.vendedorId}-${r.fecha}-${r.numeroFila}`}>
                                <TableCell className="font-medium whitespace-nowrap">
                                    {r.nombre}
                                </TableCell>
                                <TableCell className="font-mono text-xs whitespace-nowrap">
                                    {r.fecha}
                                </TableCell>
                                {NUMERIC_FIELDS.map((f) => (
                                    <TableCell key={f} className="text-right">
                                        <NumericInput
                                            value={r[f] as number | null}
                                            onChange={(v) => actualizar(idx, f, v)}
                                            aria-label={`${f} de ${r.nombre}`}
                                        />
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Input
                                        value={r.nota ?? ""}
                                        onChange={(e) => actualizar(idx, "nota", e.target.value)}
                                        className="h-8 min-w-[120px]"
                                        aria-label={`Nota de ${r.nombre}`}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

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
