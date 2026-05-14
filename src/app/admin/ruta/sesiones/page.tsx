"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Eye,
    LayoutGrid,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    eliminarSesionRuta,
    listarSesionesRuta,
} from "@/lib/api";
import type { SesionRutaResponseDTO } from "@/types";

const ESTADO_COLOR: Record<string, string> = {
    ACTIVA: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    COMPLETADA: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    ARCHIVADA: "bg-muted text-muted-foreground border-border",
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

export default function AdminSesionesRutaPage() {
    const [sesiones, setSesiones] = useState<SesionRutaResponseDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroCreatedBy, setFiltroCreatedBy] = useState("");
    const [eliminando, setEliminando] = useState<string | null>(null);

    const cargar = async () => {
        setCargando(true);
        try {
            const params: { estado?: string; createdBy?: string } = {};
            if (filtroEstado.trim()) params.estado = filtroEstado.trim();
            if (filtroCreatedBy.trim()) params.createdBy = filtroCreatedBy.trim();
            const data = await listarSesionesRuta(params);
            setSesiones(data);
        } catch {
            // interceptor global muestra toast
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEliminar = async (sesionId: string) => {
        if (!confirm("¿Eliminar esta sesión y todos sus registros? Esta acción no se puede deshacer.")) {
            return;
        }
        setEliminando(sesionId);
        try {
            await eliminarSesionRuta(sesionId);
            toast.success("Sesión eliminada");
            setSesiones((prev) => prev.filter((s) => s.sesionId !== sesionId));
        } catch {
            // toast global
        } finally {
            setEliminando(null);
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <PageHeader
                title="Sesiones de ruta"
                description="Historial de sesiones del módulo ruta. Filtrá por estado o usuario."
                icon={LayoutGrid}
                admin
                actions={
                    <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                        <span className="ml-2 hidden sm:inline">Recargar</span>
                    </Button>
                }
            />

            <form
                className="flex flex-wrap items-end gap-3 mb-4 p-4 rounded-lg border bg-card"
                onSubmit={(e) => {
                    e.preventDefault();
                    cargar();
                }}
            >
                <div className="grid gap-1.5">
                    <Label htmlFor="filtro-estado">Estado</Label>
                    <Input
                        id="filtro-estado"
                        placeholder="ACTIVA, COMPLETADA, …"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="h-9 w-44"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="filtro-createdBy">Creado por</Label>
                    <Input
                        id="filtro-createdBy"
                        placeholder="username"
                        value={filtroCreatedBy}
                        onChange={(e) => setFiltroCreatedBy(e.target.value)}
                        className="h-9 w-48"
                    />
                </div>
                <Button type="submit" size="sm" disabled={cargando}>
                    Filtrar
                </Button>
            </form>

            {cargando && sesiones.length === 0 ? (
                <TableSkeleton rows={6} columns={6} />
            ) : sesiones.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center text-muted-foreground">
                    No hay sesiones que coincidan con los filtros.
                </div>
            ) : (
                <div className="rounded-lg border bg-card overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sesión</TableHead>
                                <TableHead>Creada</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Registros</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sesiones.map((s) => (
                                <TableRow key={s.sesionId}>
                                    <TableCell className="font-mono text-xs">
                                        {s.sesionId.slice(0, 8)}…
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm">
                                        {fmtFecha(s.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {s.createdBy || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded text-xs border ${
                                                ESTADO_COLOR[s.estado] ??
                                                "bg-muted text-muted-foreground border-border"
                                            }`}
                                        >
                                            {s.estado}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-sm tabular-nums">
                                        {s.registrosCompletados ?? 0} / {s.totalRegistros ?? 0}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/admin/ruta/sesiones/${s.sesionId}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="ml-2 hidden sm:inline">Ver</span>
                                                    <ChevronRight className="h-3 w-3 ml-1 hidden sm:inline" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={s.estado === "ACTIVA" || eliminando === s.sesionId}
                                                onClick={() => handleEliminar(s.sesionId)}
                                                aria-label="Eliminar sesión"
                                                title={
                                                    s.estado === "ACTIVA"
                                                        ? "No se puede eliminar una sesión activa"
                                                        : "Eliminar"
                                                }
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </main>
    );
}
