"use client";

import { useState } from "react";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RutaFechasStepProps {
    fechasDisponibles: string[];
    onContinuar: (fechas: string[]) => void;
    cargando: boolean;
}

export function RutaFechasStep({
    fechasDisponibles,
    onContinuar,
    cargando,
}: RutaFechasStepProps) {
    const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

    const toggle = (fecha: string) => {
        setSeleccionadas((prev) => {
            const next = new Set(prev);
            if (next.has(fecha)) {
                next.delete(fecha);
            } else {
                next.add(fecha);
            }
            return next;
        });
    };

    const seleccionarTodas = () => setSeleccionadas(new Set(fechasDisponibles));
    const limpiar = () => setSeleccionadas(new Set());

    if (fechasDisponibles.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                <Calendar className="mx-auto h-6 w-6 mb-3" />
                El Excel no tiene fechas válidas. Revisá el archivo y volvé a subirlo.
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium mb-1">Elegí las fechas del recorrido</h2>
            <p className="text-sm text-muted-foreground mb-4">
                {fechasDisponibles.length} fecha{fechasDisponibles.length === 1 ? "" : "s"} disponible
                {fechasDisponibles.length === 1 ? "" : "s"} en el Excel.
            </p>

            <div className="flex items-center gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={seleccionarTodas}>
                    Seleccionar todas
                </Button>
                <Button variant="ghost" size="sm" onClick={limpiar}>
                    Limpiar
                </Button>
                <span className="ml-auto text-sm text-muted-foreground">
                    {seleccionadas.size} seleccionada{seleccionadas.size === 1 ? "" : "s"}
                </span>
            </div>

            <ul
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6"
                role="list"
            >
                {fechasDisponibles.map((fecha) => {
                    const checked = seleccionadas.has(fecha);
                    return (
                        <li key={fecha}>
                            <label
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                                    checked
                                        ? "border-primary bg-primary/5"
                                        : "border-input hover:bg-accent"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={checked}
                                    onChange={() => toggle(fecha)}
                                    aria-label={`Fecha ${fecha}`}
                                />
                                <span className="text-sm font-mono">{fecha}</span>
                            </label>
                        </li>
                    );
                })}
            </ul>

            <div className="flex justify-end">
                <Button
                    onClick={() => onContinuar(Array.from(seleccionadas))}
                    disabled={seleccionadas.size === 0 || cargando}
                >
                    {cargando ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Continuar
                </Button>
            </div>
        </div>
    );
}
