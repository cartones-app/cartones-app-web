"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { listarTodasLasDistribuciones } from "@/lib/api";
import type { ProcesoDistribucionResumenDTO } from "@/types";

// Dynamic — ver justificación en mis-distribuciones/page.tsx.
const DistribucionesTable = dynamic(
    () => import("@/components/DistribucionesTable").then((m) => m.DistribucionesTable),
    { ssr: false, loading: () => <TableSkeleton rows={5} columns={7} /> },
);

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

    const stats = useMemo(() => {
        const total = procesos.length;
        const usuarios = new Set(procesos.map((p) => p.createdBy).filter(Boolean)).size;
        const completados = procesos.filter(
            (p) => (p.estado ?? "").toUpperCase() === "COMPLETADO",
        ).length;
        return { total, usuarios, completados };
    }, [procesos]);

    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl">
            <PageHeader
                title="Distribuciones"
                description="Vista global — todos los procesos del sistema."
                icon={Users2}
                admin
                actions={
                    <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                        <span className="ml-2 hidden sm:inline">Recargar</span>
                    </Button>
                }
            />

            {procesos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <StatCard label="Procesos" value={stats.total} />
                    <StatCard label="Usuarios distintos" value={stats.usuarios} />
                    <StatCard label="Completados" value={stats.completados} accent="emerald" />
                </div>
            )}

            {cargando && procesos.length === 0 ? (
                <TableSkeleton rows={6} columns={7} />
            ) : procesos.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center text-muted-foreground">
                    <p className="text-sm">Nadie generó distribuciones todavía.</p>
                </div>
            ) : (
                <DistribucionesTable procesos={procesos} adminMode />
            )}
        </main>
    );
}

function StatCard({
    label,
    value,
    accent,
}: {
    label: string;
    value: number;
    accent?: "emerald";
}) {
    const accentClass =
        accent === "emerald" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground";
    return (
        <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div className={`text-2xl font-semibold tabular-nums ${accentClass}`}>{value}</div>
        </div>
    );
}
