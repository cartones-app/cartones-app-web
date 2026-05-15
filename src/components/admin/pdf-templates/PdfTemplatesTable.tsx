"use client";

import Link from "next/link";
import { CheckCircle2, Pencil, Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatFechaHoraCorta } from "@/lib/date-format";
import type { PdfTemplateResumen } from "@/types";

interface Props {
    templates: PdfTemplateResumen[];
    onActivar: (id: string) => void;
    onEliminar: (id: string) => void;
    busyId: string | null;
}

export function PdfTemplatesTable({ templates, onActivar, onEliminar, busyId }: Props) {
    if (templates.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                No hay templates todavía.
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Slots/A4</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Actualizado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {templates.map((t) => {
                        const busy = busyId === t.id;
                        return (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.nombre}</TableCell>
                                <TableCell>
                                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">
                                        {t.tipo}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center text-sm tabular-nums">
                                    {t.tipo === "ETIQUETAS" ? t.slotsPorPagina : "—"}
                                </TableCell>
                                <TableCell>
                                    {t.activo ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Inactivo</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {formatFechaHoraCorta(t.updatedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1">
                                        <Button asChild size="sm" variant="ghost" title="Editar">
                                            <Link href={`/admin/pdf-templates/${t.id}`}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {!t.activo && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onActivar(t.id)}
                                                disabled={busy}
                                                title="Activar"
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onEliminar(t.id)}
                                            disabled={busy || t.activo}
                                            title={t.activo ? "Activá otro antes de eliminar" : "Eliminar"}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
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
