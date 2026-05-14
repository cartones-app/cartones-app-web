"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    actualizarExclusion,
    crearExclusion,
    eliminarExclusion,
    listarExclusiones,
} from "@/lib/api";
import type { ExclusionRutaResponseDTO } from "@/types";

interface EditableState {
    id: number | "new";
    nombre: string;
    descripcion: string;
    activo: boolean;
}

export default function AdminExclusionesRutaPage() {
    const [exclusiones, setExclusiones] = useState<ExclusionRutaResponseDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [editing, setEditing] = useState<EditableState | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = async () => {
        setCargando(true);
        try {
            const data = await listarExclusiones();
            setExclusiones(data);
        } catch {
            // toast global
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar();
    }, []);

    const startCreate = () => {
        setEditing({ id: "new", nombre: "", descripcion: "", activo: true });
    };

    const startEdit = (e: ExclusionRutaResponseDTO) => {
        setEditing({
            id: e.id,
            nombre: e.nombre,
            descripcion: e.descripcion ?? "",
            activo: e.activo,
        });
    };

    const cancel = () => setEditing(null);

    const handleSave = async () => {
        if (!editing) return;
        if (!editing.nombre.trim()) {
            toast.error("El nombre es obligatorio.");
            return;
        }
        setGuardando(true);
        try {
            const body = {
                nombre: editing.nombre.trim(),
                descripcion: editing.descripcion.trim() || undefined,
                activo: editing.activo,
            };
            if (editing.id === "new") {
                const created = await crearExclusion(body);
                setExclusiones((prev) => [created, ...prev]);
                toast.success("Exclusión creada");
            } else {
                const updated = await actualizarExclusion(editing.id, body);
                setExclusiones((prev) =>
                    prev.map((e) => (e.id === updated.id ? updated : e))
                );
                toast.success("Exclusión actualizada");
            }
            setEditing(null);
        } catch {
            // toast global
        } finally {
            setGuardando(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar esta exclusión?")) return;
        try {
            await eliminarExclusion(id);
            toast.success("Exclusión eliminada");
            setExclusiones((prev) => prev.filter((e) => e.id !== id));
        } catch {
            // toast global
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-5xl">
            <PageHeader
                title="Exclusiones de ruta"
                description="Nombres de vendedores (o entradas como “TOTAL”) que el módulo ruta excluye automáticamente."
                icon={ShieldCheck}
                admin
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                            <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                            <span className="ml-2 hidden sm:inline">Recargar</span>
                        </Button>
                        <Button size="sm" onClick={startCreate} disabled={editing !== null}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva
                        </Button>
                    </>
                }
            />

            {editing && (
                <div className="mb-4 p-4 rounded-lg border bg-card">
                    <h2 className="font-medium mb-3">
                        {editing.id === "new" ? "Crear exclusión" : `Editar exclusión #${editing.id}`}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="ex-nombre">Nombre *</Label>
                            <Input
                                id="ex-nombre"
                                value={editing.nombre}
                                onChange={(e) =>
                                    setEditing({ ...editing, nombre: e.target.value })
                                }
                                placeholder="RECIBO DE CARTONES"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="ex-descripcion">Descripción</Label>
                            <Input
                                id="ex-descripcion"
                                value={editing.descripcion}
                                onChange={(e) =>
                                    setEditing({ ...editing, descripcion: e.target.value })
                                }
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="ex-activo"
                                checked={editing.activo}
                                onCheckedChange={(v) => setEditing({ ...editing, activo: v })}
                            />
                            <Label htmlFor="ex-activo" className="cursor-pointer">
                                Activa
                            </Label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" size="sm" onClick={cancel} disabled={guardando}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={guardando}>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar
                        </Button>
                    </div>
                </div>
            )}

            {cargando && exclusiones.length === 0 ? (
                <TableSkeleton rows={4} columns={5} />
            ) : exclusiones.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center text-muted-foreground">
                    No hay exclusiones cargadas todavía.
                </div>
            ) : (
                <div className="rounded-lg border bg-card overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Creada</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exclusiones.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell className="font-medium">{e.nombre}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {e.descripcion || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded text-xs border ${
                                                e.activo
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                    : "bg-muted text-muted-foreground border-border"
                                            }`}
                                        >
                                            {e.activo ? "Activa" : "Inactiva"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {e.createdBy || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => startEdit(e)}
                                                disabled={editing !== null}
                                                aria-label="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(e.id)}
                                                aria-label="Eliminar"
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
