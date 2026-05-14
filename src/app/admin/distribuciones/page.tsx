"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DistribucionesTable } from "@/components/DistribucionesTable";
import { listarTodasLasDistribuciones } from "@/lib/api";
import type { ProcesoDistribucionResumenDTO } from "@/types";

export default function AdminDistribucionesPage() {
    const [procesos, setProcesos] = useState<ProcesoDistribucionResumenDTO[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargar = async () => {
        setCargando(true);
        try {
            const data = await listarTodasLasDistribuciones();
            setProcesos(data);
        } catch {
            // 403 si no tenés rol ADMIN — el interceptor lo muestra.
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar();
    }, []);

    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Volver al inicio
                    </Link>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold">Distribuciones (admin)</h1>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                            ADMIN
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Vista global — todos los procesos del sistema.
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
                <DistribucionesTable procesos={procesos} adminMode />
            )}
        </main>
    );
}
