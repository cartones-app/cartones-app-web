"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, ListChecks, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DistribucionesTable } from "@/components/DistribucionesTable";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
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

    const stats = useMemo(() => {
        const total = procesos.length;
        // El backend serializa los estados en lowercase. Comparamos case-insensitive
        // para no atarnos a esa decisión.
        const completados = procesos.filter(
            (p) => (p.estado ?? "").toUpperCase() === "COMPLETADO",
        ).length;
        const pendientes = total - completados;
        return { total, completados, pendientes };
    }, [procesos]);

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <PageHeader
                title="Mis distribuciones"
                description="Procesos que generaste — descargá los PDFs cuando quieras."
                icon={ListChecks}
                actions={
                    <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                        <span className="ml-2 hidden sm:inline">Recargar</span>
                    </Button>
                }
            />

            {procesos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <StatCard label="Total" value={stats.total} />
                    <StatCard label="Completados" value={stats.completados} accent="emerald" />
                    <StatCard label="En proceso" value={stats.pendientes} accent="amber" />
                </div>
            )}

            {cargando && procesos.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
            ) : procesos.length === 0 ? (
                <EmptyState />
            ) : (
                <DistribucionesTable procesos={procesos} />
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
    accent?: "emerald" | "amber";
}) {
    const accentClass =
        accent === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : accent === "amber"
              ? "text-amber-600 dark:text-amber-400"
              : "text-foreground";
    return (
        <div className="rounded-lg border bg-card px-4 py-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div className={`text-2xl font-semibold tabular-nums ${accentClass}`}>{value}</div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-medium mb-1">Aún no tenés distribuciones</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Cuando subas un Excel de vendedores y simules una distribución, los procesos
                aparecen acá para que descargues los PDFs.
            </p>
            <Button asChild size="sm">
                <Link href="/upload">Crear distribución</Link>
            </Button>
        </div>
    );
}
