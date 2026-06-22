"use client";

import { useState } from "react";
import { FileText, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { archivosDisponibles, type ProcesoDistribucionResumenDTO } from "@/types";
import {
    descargarEtiquetas,
    descargarEtiquetasAdmin,
    descargarResumen,
    descargarResumenAdmin,
} from "@/lib/api";
import { formatFechaHora } from "@/lib/date-format";
import { shortId } from "@/lib/format-id";
import {
    ESTADO_PROCESO_COLOR,
    ESTADO_PROCESO_COLOR_FALLBACK,
    normalizarEstado,
} from "@/lib/proceso-estado";
import { descargarPdfProceso, type DescargaTipo } from "@/lib/proceso-descarga";

interface DistribucionesTableProps {
    procesos: ProcesoDistribucionResumenDTO[];
    /** Si true, muestra columna createdBy y descarga vía endpoint admin. */
    adminMode?: boolean;
}

export function DistribucionesTable({ procesos, adminMode = false }: DistribucionesTableProps) {
    const [descargando, setDescargando] = useState<{ id: string; tipo: DescargaTipo } | null>(null);

    const handleDescargar = async (procesoId: string, tipo: DescargaTipo) => {
        setDescargando({ id: procesoId, tipo });
        try {
            const fetcher = adminMode
                ? tipo === "etiquetas"
                    ? descargarEtiquetasAdmin
                    : descargarResumenAdmin
                : tipo === "etiquetas"
                ? descargarEtiquetas
                : descargarResumen;
            await descargarPdfProceso(procesoId, tipo, fetcher);
            toast.success("Descarga iniciada");
        } catch {
            // El interceptor global ya muestra el toast de error.
        } finally {
            setDescargando(null);
        }
    };

    const isBusy = (procesoId: string, tipo: DescargaTipo) =>
        descargando?.id === procesoId && descargando?.tipo === tipo;

    if (procesos.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">
                    No hay distribuciones para mostrar.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proceso</TableHead>
                        {adminMode && <TableHead>Usuario</TableHead>}
                        <TableHead>Estado</TableHead>
                        <TableHead>Archivos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {procesos.map((p) => {
                        const disponibles = archivosDisponibles(p);
                        const yaBorrado = p.archivosBorradosEn !== null;
                        const sinGenerar = p.archivosGeneradosEn === null;
                        return (
                            <TableRow key={p.procesoId}>
                                <TableCell className="whitespace-nowrap text-sm">
                                    {formatFechaHora(p.createdAt)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {shortId(p.procesoId)}
                                </TableCell>
                                {adminMode && (
                                    <TableCell className="text-sm text-muted-foreground">
                                        {p.createdBy || "—"}
                                    </TableCell>
                                )}
                                <TableCell>
                                    {(() => {
                                        const estado = normalizarEstado(p.estado);
                                        return (
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded text-xs border ${
                                                    ESTADO_PROCESO_COLOR[estado] ?? ESTADO_PROCESO_COLOR_FALLBACK
                                                }`}
                                            >
                                                {estado}
                                            </span>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {disponibles ? (
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            Disponibles
                                        </span>
                                    ) : yaBorrado ? (
                                        <span className="text-muted-foreground">No disponibles</span>
                                    ) : sinGenerar ? (
                                        <span className="text-muted-foreground">Sin generar</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={!disponibles || isBusy(p.procesoId, "etiquetas")}
                                            onClick={() => handleDescargar(p.procesoId, "etiquetas")}
                                            title={
                                                disponibles
                                                    ? "Descargar etiquetas (PDF)"
                                                    : "Archivos no disponibles"
                                            }
                                            aria-label="Descargar etiquetas"
                                        >
                                            {isBusy(p.procesoId, "etiquetas") ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Tag className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={!disponibles || isBusy(p.procesoId, "resumen")}
                                            onClick={() => handleDescargar(p.procesoId, "resumen")}
                                            title={
                                                disponibles
                                                    ? "Descargar resumen (PDF)"
                                                    : "Archivos no disponibles"
                                            }
                                            aria-label="Descargar resumen"
                                        >
                                            {isBusy(p.procesoId, "resumen") ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
