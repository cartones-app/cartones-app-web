"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
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
            // El interceptor global muestra el toast.
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        // Patrón "load on mount" en Client Component. La regla
        // react-hooks/set-state-in-effect recomienda Server Components o
        // SWR/React Query — pendiente migrar a RSC en una pasada futura.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargar();
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
            <div className="relative z-10">
                <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <h1 className="font-semibold text-lg">Gestión de Bingos</h1>
                        </div>
                        <ThemeToggle />
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8 max-w-6xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Volver al inicio
                            </Link>
                            <h2 className="text-2xl font-semibold">Mis distribuciones</h2>
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
            </div>
        </div>
    );
}
