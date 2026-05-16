"use client";

import { Fragment, useEffect, useState } from "react";
import { Loader2, Pencil, Printer, RefreshCw, Save, X } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { LayoutOrdenSelector } from "@/components/LayoutOrdenSelector";
import {
    guardarPreferenciasAdmin,
    listarPreferenciasAdmin,
} from "@/lib/api";
import { formatFechaHoraCorta } from "@/lib/date-format";
import type {
    LayoutEtiqueta,
    OrdenEtiqueta,
    PageResponse,
    PreferenciasEtiquetasDTO,
} from "@/types";

/**
 * Panel admin para editar las preferencias de etiquetas de cualquier distribuidor
 * (por cuenta del user — el cambio persiste igual que si lo hiciera él mismo).
 *
 * Doble defensa: la ruta {@code /admin/...} ya está restringida a ADMIN tanto
 * en el backend (SecurityConfig) como en el sidebar.
 */
export default function AdminPreferenciasEtiquetasPage() {
    const [page, setPage] = useState<PageResponse<PreferenciasEtiquetasDTO> | null>(null);
    const [cargando, setCargando] = useState(true);
    const [editing, setEditing] = useState<string | null>(null);
    const [draftLayout, setDraftLayout] = useState<LayoutEtiqueta>("TRES_POR_HOJA");
    const [draftOrden, setDraftOrden] = useState<OrdenEtiqueta>("SECUENCIAL");
    const [savingUser, setSavingUser] = useState<string | null>(null);
    const [pageIdx, setPageIdx] = useState(0);
    // Contador que el botón "Recargar" incrementa para re-triggerear el useEffect
    // sin duplicar la lógica de fetch. Patrón estándar para "refetch manual".
    const [revision, setRevision] = useState(0);
    const pageSize = 50;

    useEffect(() => {
        let cancelled = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const data = await listarPreferenciasAdmin(pageIdx, pageSize);
                if (!cancelled) setPage(data);
            } catch {
                // Error handled by axios interceptor.
            } finally {
                if (!cancelled) setCargando(false);
            }
        };
        void cargar();
        return () => {
            cancelled = true;
        };
    }, [pageIdx, revision]);

    const recargar = () => setRevision((r) => r + 1);

    const startEdit = (row: PreferenciasEtiquetasDTO) => {
        setEditing(row.username);
        setDraftLayout(row.layoutEtiqueta);
        setDraftOrden(row.ordenEtiqueta);
    };

    const cancelEdit = () => {
        setEditing(null);
    };

    const guardar = async (username: string) => {
        setSavingUser(username);
        try {
            const saved = await guardarPreferenciasAdmin(username, {
                layoutEtiqueta: draftLayout,
                ordenEtiqueta: draftOrden,
            });
            setPage((prev) =>
                prev
                    ? {
                          ...prev,
                          content: prev.content.map((r) =>
                              r.username === username ? saved : r,
                          ),
                      }
                    : prev,
            );
            setEditing(null);
            toast.success("Preferencias actualizadas", {
                description: `Las cambió por cuenta de ${username}. El distribuidor puede revertirlo cuando quiera.`,
            });
        } catch {
            // Error handled by axios interceptor.
        } finally {
            setSavingUser(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <PageHeader
                title="Preferencias de etiquetas"
                description="Ajustar el diseño y orden de impresión por distribuidor."
                icon={Printer}
                admin
                actions={
                    <Button variant="outline" size="sm" onClick={recargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${cargando ? "animate-spin" : ""}`} />
                        Recargar
                    </Button>
                }
            />

            {cargando && !page ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            ) : !page || page.content.length === 0 ? (
                <div className="text-sm text-muted-foreground py-12 text-center">
                    Aún no hay distribuidores con preferencias configuradas. Aparecerán acá una vez
                    que guarden algo desde su pantalla personal.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Distribuidor</TableHead>
                            <TableHead>Diseño</TableHead>
                            <TableHead>Orden</TableHead>
                            <TableHead>Última edición</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {page.content.map((row) => {
                            const isEditing = editing === row.username;
                            return (
                                <Fragment key={row.username}>
                                    <TableRow>
                                        <TableCell className="font-medium">{row.username}</TableCell>
                                        <TableCell>{labelLayout(row.layoutEtiqueta)}</TableCell>
                                        <TableCell>{labelOrden(row.ordenEtiqueta)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatFechaHoraCorta(row.updatedAt)}
                                            {row.modifiedBy && (
                                                <>
                                                    {" "}
                                                    por <span className="font-medium">{row.modifiedBy}</span>
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing ? (
                                                <div className="inline-flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={cancelEdit}
                                                        disabled={savingUser === row.username}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => guardar(row.username)}
                                                        disabled={savingUser === row.username}
                                                    >
                                                        {savingUser === row.username ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {isEditing && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="bg-muted/30 p-6">
                                                <LayoutOrdenSelector
                                                    layout={draftLayout}
                                                    orden={draftOrden}
                                                    onLayoutChange={setDraftLayout}
                                                    onOrdenChange={setDraftOrden}
                                                    disabled={savingUser === row.username}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            )}

            {page && page.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 pt-4">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                        disabled={page.first || cargando}
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                        Página {page.number + 1} de {page.totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPageIdx((i) => i + 1)}
                        disabled={page.last || cargando}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </div>
    );
}

function labelLayout(l: LayoutEtiqueta): string {
    return l === "TRES_POR_HOJA" ? "3 por hoja" : "4 por hoja";
}
function labelOrden(o: OrdenEtiqueta): string {
    return o === "SECUENCIAL" ? "Secuencial" : "Intercalado";
}
