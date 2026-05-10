"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { ProcesoDistribucionResumenDTO } from "@/types";
import { downloadPdfs, downloadPdfsAdmin } from "@/lib/api";

interface DistribucionesTableProps {
    procesos: ProcesoDistribucionResumenDTO[];
    /** Si true, muestra columna createdBy y descarga vía endpoint admin. */
    adminMode?: boolean;
}

const ESTADO_COLOR: Record<string, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    VERIFICANDO: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    COMPLETADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

function fmtFecha(iso: string): string {
    try {
        return new Date(iso).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function fmtBytes(bytes: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DistribucionesTable({ procesos, adminMode = false }: DistribucionesTableProps) {
    const [descargandoId, setDescargandoId] = useState<string | null>(null);

    const handleDescargar = async (procesoId: string) => {
        setDescargandoId(procesoId);
        try {
            const blob = adminMode
                ? await downloadPdfsAdmin(procesoId)
                : await downloadPdfs(procesoId);
            saveAs(blob, `distribucion-${procesoId.slice(0, 8)}.zip`);
            toast.success("Descarga iniciada");
        } catch {
            // El interceptor global ya muestra el toast de error.
        } finally {
            setDescargandoId(null);
        }
    };

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
                        <TableHead className="text-right">Etiquetas</TableHead>
                        <TableHead className="text-right">Resumen</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {procesos.map((p) => {
                        const puedeDescargar = p.tieneEtiquetas || p.tieneResumen;
                        return (
                            <TableRow key={p.procesoId}>
                                <TableCell className="whitespace-nowrap text-sm">
                                    {fmtFecha(p.createdAt)}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {p.procesoId.slice(0, 8)}…
                                </TableCell>
                                {adminMode && (
                                    <TableCell className="text-sm text-muted-foreground">
                                        {p.createdBy || "—"}
                                    </TableCell>
                                )}
                                <TableCell>
                                    <span
                                        className={`inline-block px-2 py-0.5 rounded text-xs border ${
                                            ESTADO_COLOR[p.estado] ??
                                            "bg-muted text-muted-foreground border-border"
                                        }`}
                                    >
                                        {p.estado}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                                    {fmtBytes(p.tamanoEtiquetasBytes)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                                    {fmtBytes(p.tamanoResumenBytes)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={!puedeDescargar || descargandoId === p.procesoId}
                                        onClick={() => handleDescargar(p.procesoId)}
                                    >
                                        {descargandoId === p.procesoId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        <span className="ml-2 hidden sm:inline">ZIP</span>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
