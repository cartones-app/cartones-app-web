"use client";

import { useState } from "react";
import { FileArchive, FileText, Loader2, Tag } from "lucide-react";
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
import { extractPdfsFromZip } from "@/lib/pdf-from-zip";
import { formatFechaHora } from "@/lib/date-format";
import { shortId } from "@/lib/format-id";

type DescargaTipo = "etiquetas" | "resumen" | "zip";

interface DistribucionesTableProps {
    procesos: ProcesoDistribucionResumenDTO[];
    /** Si true, muestra columna createdBy y descarga vía endpoint admin. */
    adminMode?: boolean;
}

const ESTADO_COLOR: Record<string, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    SIMULADO: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    COMPLETADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

/**
 * El backend serializa los estados en lowercase (enum EstadoEnum con @JsonValue).
 * Acá normalizamos a UPPERCASE solo para presentación y matching del mapa de
 * colores — así si en algún momento se cambia el case en el backend, no rompe.
 */
function normalizarEstado(estado: string | undefined | null): string {
    return (estado ?? "").trim().toUpperCase();
}

function fmtBytes(bytes: number): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DistribucionesTable({ procesos, adminMode = false }: DistribucionesTableProps) {
    const [descargando, setDescargando] = useState<{ id: string; tipo: DescargaTipo } | null>(null);

    const handleDescargar = async (procesoId: string, tipo: DescargaTipo) => {
        setDescargando({ id: procesoId, tipo });
        try {
            const blob = adminMode
                ? await downloadPdfsAdmin(procesoId)
                : await downloadPdfs(procesoId);

            const idCorto = procesoId.slice(0, 8);
            if (tipo === "zip") {
                saveAs(blob, `distribucion-${idCorto}.zip`);
            } else {
                const { etiquetas, resumen } = await extractPdfsFromZip(blob);
                if (tipo === "etiquetas") {
                    if (!etiquetas) {
                        toast.warning("No hay PDF de etiquetas en este proceso.");
                        return;
                    }
                    saveAs(etiquetas, `etiquetas-${idCorto}.pdf`);
                } else {
                    if (!resumen) {
                        toast.warning("No hay PDF de resumen en este proceso.");
                        return;
                    }
                    saveAs(resumen, `resumen-${idCorto}.pdf`);
                }
            }
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
                                                className={`inline-block px-2 py-0.5 rounded text-xs border ${ESTADO_COLOR[estado] ??
                                                    "bg-muted text-muted-foreground border-border"
                                                    }`}
                                            >
                                                {estado}
                                            </span>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                                    {fmtBytes(p.tamanoEtiquetasBytes)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                                    {fmtBytes(p.tamanoResumenBytes)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={!p.tieneEtiquetas || isBusy(p.procesoId, "etiquetas")}
                                            onClick={() => handleDescargar(p.procesoId, "etiquetas")}
                                            title="Descargar solo etiquetas (PDF)"
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
                                            disabled={!p.tieneResumen || isBusy(p.procesoId, "resumen")}
                                            onClick={() => handleDescargar(p.procesoId, "resumen")}
                                            title="Descargar solo resumen (PDF)"
                                            aria-label="Descargar resumen"
                                        >
                                            {isBusy(p.procesoId, "resumen") ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={!puedeDescargar || isBusy(p.procesoId, "zip")}
                                            onClick={() => handleDescargar(p.procesoId, "zip")}
                                            title="Descargar ZIP completo"
                                        >
                                            {isBusy(p.procesoId, "zip") ? (
                                                <Loader2 className="h-4 w-4" />
                                            ) : (
                                                <FileArchive className="h-4 w-4" />
                                            )}
                                            <span className="ml-2 hidden sm:inline">ZIP</span>
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
