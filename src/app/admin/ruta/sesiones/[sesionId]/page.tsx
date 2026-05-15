"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    eliminarRegistroRuta,
    listarRegistrosDeSesion,
    obtenerSesionRuta,
} from "@/lib/api";
import type {
    SesionRutaRegistroResponseDTO,
    SesionRutaResponseDTO,
} from "@/types";
import { formatFechaHora } from "@/lib/date-format";
import { shortId } from "@/lib/format-id";

export default function AdminSesionRutaDetailPage() {
    const params = useParams<{ sesionId: string }>();
    const sesionId = params.sesionId;

    const [sesion, setSesion] = useState<SesionRutaResponseDTO | null>(null);
    const [registros, setRegistros] = useState<SesionRutaRegistroResponseDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [vendedorFiltro, setVendedorFiltro] = useState("");
    const [soloCompletados, setSoloCompletados] = useState<boolean | null>(null);
    const [camposIncompletos, setCamposIncompletos] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const params: {
                completado?: boolean;
                vendedorNombre?: string;
                camposIncompletos?: boolean;
            } = {};
            if (soloCompletados !== null) params.completado = soloCompletados;
            if (vendedorFiltro.trim()) params.vendedorNombre = vendedorFiltro.trim();
            if (camposIncompletos) params.camposIncompletos = true;

            const [s, r] = await Promise.all([
                obtenerSesionRuta(sesionId),
                listarRegistrosDeSesion(sesionId, params),
            ]);
            setSesion(s);
            setRegistros(r);
        } catch {
            // toast global
        } finally {
            setCargando(false);
        }
    }, [sesionId, soloCompletados, vendedorFiltro, camposIncompletos]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar();
    }, [cargar]);

    const handleEliminarRegistro = async (id: number) => {
        if (!confirm("¿Eliminar este registro?")) return;
        try {
            await eliminarRegistroRuta(id);
            toast.success("Registro eliminado");
            setRegistros((prev) => prev.filter((r) => r.id !== id));
        } catch {
            // toast global
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="mb-6">
                <Link
                    href="/admin/ruta/sesiones"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Volver al listado
                </Link>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Detalle de sesión</h1>
                        {sesion && (
                            <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-mono">{shortId(sesion.sesionId)}</span> ·
                                creada {formatFechaHora(sesion.createdAt)} por {sesion.createdBy || "—"} ·
                                estado <strong>{sesion.estado}</strong> ·
                                {sesion.registrosCompletados ?? 0}/{sesion.totalRegistros ?? 0} completos
                            </p>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                        <span className="ml-2 hidden sm:inline">Recargar</span>
                    </Button>
                </div>
            </div>

            <form
                className="flex flex-wrap items-end gap-3 mb-4 p-4 rounded-lg border bg-card"
                onSubmit={(e) => {
                    e.preventDefault();
                    cargar();
                }}
            >
                <div className="grid gap-1.5">
                    <Label htmlFor="filtro-vendedor">Vendedor</Label>
                    <Input
                        id="filtro-vendedor"
                        placeholder="nombre…"
                        value={vendedorFiltro}
                        onChange={(e) => setVendedorFiltro(e.target.value)}
                        className="h-9 w-48"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="filtro-completado">Estado</Label>
                    <select
                        id="filtro-completado"
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={soloCompletados === null ? "" : soloCompletados ? "true" : "false"}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSoloCompletados(v === "" ? null : v === "true");
                        }}
                    >
                        <option value="">Todos</option>
                        <option value="true">Solo completados</option>
                        <option value="false">Solo pendientes</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 h-9">
                    <Switch
                        id="campos-incompletos"
                        checked={camposIncompletos}
                        onCheckedChange={setCamposIncompletos}
                    />
                    <Label htmlFor="campos-incompletos" className="cursor-pointer">
                        Campos incompletos
                    </Label>
                </div>
                <Button type="submit" size="sm" disabled={cargando}>
                    Filtrar
                </Button>
            </form>

            {cargando && registros.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-3" />
                    Cargando…
                </div>
            ) : registros.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                    No hay registros para los filtros aplicados.
                </div>
            ) : (
                <div className="rounded-lg border bg-card overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vendedor</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Sen.</TableHead>
                                <TableHead className="text-right">Tlb.</TableHead>
                                <TableHead className="text-right">Pago 1</TableHead>
                                <TableHead className="text-right">Pago 2</TableHead>
                                <TableHead>Nota</TableHead>
                                <TableHead>Completo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registros.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {r.vendedorNombre || "—"}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs whitespace-nowrap">
                                        {r.fecha}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {r.seneteTotalEnviado ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {r.telebingoTotalEnviado ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {r.pago1 ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {r.pago2 ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                        {r.nota || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {r.completado ? (
                                            <Check className="h-4 w-4 text-emerald-600" aria-label="Completado" />
                                        ) : (
                                            <span className="text-muted-foreground text-xs">pendiente</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEliminarRegistro(r.id)}
                                            aria-label="Eliminar registro"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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
