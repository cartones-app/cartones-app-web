"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { PdfTemplateTipo } from "@/types";

interface Variable {
    key: string;
    descripcion: string;
}

/**
 * Variables disponibles para usar como nombres de fields en el Designer.
 *
 * <p>El admin agrega un Text field, le pone como nombre uno de estos valores
 * (ej. {@code nombre_1}) y el cliente al renderizar reemplaza el placeholder
 * con el dato real del proceso.
 *
 * <p>Para ETIQUETAS, los campos por-vendedor tienen sufijo {@code _N} donde
 * N va de 1 a {@code slotsPorPagina} del template.
 */
const VARIABLES_BY_TIPO: Record<PdfTemplateTipo, Variable[]> = {
    ETIQUETAS: [
        { key: "fechaSorteoSenete", descripcion: "Fecha sorteo Seneté (dd/MM/yyyy)" },
        { key: "fechaSorteoTelebingo", descripcion: "Fecha sorteo Telebingo (dd/MM/yyyy)" },
        { key: "numeroVendedor_N", descripcion: "Número de vendedor (N = slot)" },
        { key: "nombre_N", descripcion: "Nombre del vendedor" },
        { key: "saldo_N", descripcion: "Saldo" },
        { key: "seneteRangos_N", descripcion: "Rangos Seneté (multilinea)" },
        { key: "seneteCartones_N", descripcion: "Cantidad cartones Seneté" },
        { key: "resultadoSenete_N", descripcion: "Resultado Seneté" },
        { key: "telebingoRangos_N", descripcion: "Rangos Telebingo (multilinea)" },
        { key: "telebingoCartones_N", descripcion: "Cantidad cartones Telebingo" },
        { key: "resultadoTelebingo_N", descripcion: "Resultado Telebingo" },
    ],
    RESUMEN: [
        { key: "fechaSorteoSenete", descripcion: "Fecha sorteo Seneté (dd/MM/yyyy)" },
        { key: "fechaSorteoTelebingo", descripcion: "Fecha sorteo Telebingo (dd/MM/yyyy)" },
        { key: "tabla", descripcion: "Tabla con vendedores. Usar field tipo 'table'. Columnas: número, nombre, rangos senete (del-al), cantidad senete, rangos telebingo (del-al), cantidad telebingo." },
    ],
};

interface Props {
    tipo: PdfTemplateTipo;
    slotsPorPagina?: number;
}

export function VariablesPanel({ tipo, slotsPorPagina = 3 }: Props) {
    const variables = VARIABLES_BY_TIPO[tipo];

    const copiar = async (key: string) => {
        try {
            await navigator.clipboard.writeText(key);
            toast.success(`'${key}' copiado al portapapeles`);
        } catch {
            toast.error("No se pudo copiar al portapapeles");
        }
    };

    return (
        <div className="border rounded-lg bg-card p-4 space-y-3">
            <div>
                <h3 className="font-medium text-sm">Variables disponibles</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Click para copiar. Usá la key exacta como nombre del field en el Designer.
                </p>
                {tipo === "ETIQUETAS" && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Reemplazá <code>N</code> por el número del slot (1 a {slotsPorPagina}).
                    </p>
                )}
            </div>
            <ul className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {variables.map((v) => (
                    <li key={v.key} className="flex items-start gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="font-mono text-xs h-7 px-2 shrink-0"
                            onClick={() => copiar(v.key)}
                            title="Click para copiar"
                        >
                            <Copy className="h-3 w-3 mr-1" />
                            {v.key}
                        </Button>
                        <span className="text-xs text-muted-foreground mt-1">{v.descripcion}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
