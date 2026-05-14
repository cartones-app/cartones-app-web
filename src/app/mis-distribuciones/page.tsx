"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DistribucionesTable } from "@/components/DistribucionesTable";
import { listarMisDistribuciones } from "@/lib/api";
import type { ProcesoDistribucionResumenDTO } from "@/types";

export default function MisDistribucionesPage() {
    const [procesos, setProcesos] = useState<ProcesoDistribucionResumenDTO[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargar = async () => {
        setCargando(true);
        try {
            const data = await listarMisDistribuciones();
            setProcesos(data);
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

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Volver al inicio
                    </Link>
                    <h1 className="text-2xl font-semibold">Mis distribuciones</h1>
                    <p className="text-sm text-muted-foreground">
                        Procesos que generaste — descargá los PDFs cuando quieras.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                    <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                    <span className="ml-2 hidden sm:inline">Recargar</span>
                </Button>
            </div>

            {cargando && procesos.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-3" />
                    Cargando…
                </div>
            ) : (
                <DistribucionesTable procesos={procesos} />
            )}
        </main>
    );
}
