"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LayoutEtiqueta, OrdenEtiqueta } from "@/types";

interface Props {
    layout: LayoutEtiqueta;
    orden: OrdenEtiqueta;
    onLayoutChange: (l: LayoutEtiqueta) => void;
    onOrdenChange: (o: OrdenEtiqueta) => void;
    disabled?: boolean;
}

/**
 * Selector de las dos preferencias de impresión de etiquetas (layout + orden).
 * Reutilizado por la pantalla del distribuidor y por el panel admin.
 *
 * Se renderizan dos secciones independientes — son ortogonales:
 * 4 combinaciones disponibles (3/4 por hoja × secuencial/intercalado).
 */
export function LayoutOrdenSelector({
    layout,
    orden,
    onLayoutChange,
    onOrdenChange,
    disabled = false,
}: Readonly<Props>) {
    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <div>
                    <Label className="text-base font-semibold">Diseño</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cuántas etiquetas entran en una hoja A4. Más etiquetas por hoja = más
                        compacto.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <OptionCard
                        selected={layout === "TRES_POR_HOJA"}
                        onClick={() => onLayoutChange("TRES_POR_HOJA")}
                        disabled={disabled}
                        title="3 por hoja"
                        description="Diseño espacioso. Recomendado por defecto."
                    />
                    <OptionCard
                        selected={layout === "CUATRO_POR_HOJA"}
                        onClick={() => onLayoutChange("CUATRO_POR_HOJA")}
                        disabled={disabled}
                        title="4 por hoja"
                        description="Más compacto verticalmente. Útil para grandes volúmenes."
                    />
                </div>
            </section>

            <section className="space-y-3">
                <div>
                    <Label className="text-base font-semibold">Orden de impresión</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        Cómo se distribuyen las etiquetas entre las hojas. El intercalado pensado
                        para apilar varias hojas y cortarlas todas a la vez sin reordenar.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <OptionCard
                        selected={orden === "SECUENCIAL"}
                        onClick={() => onOrdenChange("SECUENCIAL")}
                        disabled={disabled}
                        title="Secuencial"
                        description="1, 2, 3 en la primera hoja; 4, 5, 6 en la segunda. Lectura natural."
                    />
                    <OptionCard
                        selected={orden === "INTERCALADO"}
                        onClick={() => onOrdenChange("INTERCALADO")}
                        disabled={disabled}
                        title="Intercalado para corte por pila"
                        description="Al apilar las hojas impresas y cortarlas todas juntas, las pilas quedan en orden 1..N sin reordenar."
                    />
                </div>
            </section>
        </div>
    );
}

function OptionCard({
    selected,
    onClick,
    disabled,
    title,
    description,
}: Readonly<{
    selected: boolean;
    onClick: () => void;
    disabled: boolean;
    title: string;
    description: string;
}>) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg",
                disabled && "opacity-60 cursor-not-allowed",
            )}
        >
            <Card
                className={cn(
                    "p-4 transition-colors border-2",
                    selected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/40",
                )}
            >
                <div className="font-medium">{title}</div>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</div>
            </Card>
        </button>
    );
}
