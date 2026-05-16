"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
    guardarMisPreferenciasEtiquetas,
    obtenerMisPreferenciasEtiquetas,
} from "@/lib/api";
import { formatFechaHoraCorta } from "@/lib/date-format";
import type { LayoutEtiqueta, OrdenEtiqueta, PreferenciasEtiquetasDTO } from "@/types";
import { LayoutOrdenSelector } from "@/components/LayoutOrdenSelector";

/**
 * Pantalla "Mis preferencias de impresión de etiquetas" — propia del distribuidor.
 *
 * El admin puede acceder a la misma para editar la suya (el componente del backend
 * no distingue por rol; los endpoints {@code /api/me/...} usan el sub del JWT).
 */
export default function PreferenciasEtiquetasPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [original, setOriginal] = useState<PreferenciasEtiquetasDTO | null>(null);
    const [layout, setLayout] = useState<LayoutEtiqueta>("TRES_POR_HOJA");
    const [orden, setOrden] = useState<OrdenEtiqueta>("SECUENCIAL");

    useEffect(() => {
        let cancelled = false;
        const cargar = async () => {
            try {
                const data = await obtenerMisPreferenciasEtiquetas();
                if (cancelled) return;
                setOriginal(data);
                setLayout(data.layoutEtiqueta);
                setOrden(data.ordenEtiqueta);
            } catch {
                // Error handled by axios interceptor.
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        cargar();
        return () => {
            cancelled = true;
        };
    }, []);

    const dirty =
        original !== null &&
        (layout !== original.layoutEtiqueta || orden !== original.ordenEtiqueta);

    const handleGuardar = async () => {
        setSaving(true);
        try {
            const saved = await guardarMisPreferenciasEtiquetas({
                layoutEtiqueta: layout,
                ordenEtiqueta: orden,
            });
            setOriginal(saved);
            toast.success("Preferencias guardadas", {
                description: "Se usarán al generar los próximos PDF de etiquetas.",
            });
        } catch {
            // Error handled by axios interceptor.
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
            <PageHeader
                title="Mis preferencias de etiquetas"
                description="Cómo se imprime el PDF de etiquetas para tus procesos."
                icon={Printer}
            />

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : (
                <div className="space-y-6">
                    <LayoutOrdenSelector
                        layout={layout}
                        orden={orden}
                        onLayoutChange={setLayout}
                        onOrdenChange={setOrden}
                    />

                    <div className="flex items-center justify-between gap-4 pt-2">
                        <div className="text-xs text-muted-foreground">
                            {original?.modifiedBy ? (
                                <>
                                    Última edición: {formatFechaHoraCorta(original.updatedAt)} por{" "}
                                    <span className="font-medium">{original.modifiedBy}</span>
                                </>
                            ) : (
                                <span>Sin cambios persistidos — se usan los valores por defecto.</span>
                            )}
                        </div>
                        <Button onClick={handleGuardar} disabled={!dirty || saving}>
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Guardar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
