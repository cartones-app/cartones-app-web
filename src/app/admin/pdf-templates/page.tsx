"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { PdfTemplatesTable } from "@/components/admin/pdf-templates/PdfTemplatesTable";
import {
    activarPdfTemplate,
    eliminarPdfTemplate,
    listarPdfTemplates,
} from "@/lib/api";
import type { PdfTemplateResumen } from "@/types";

export default function AdminPdfTemplatesPage() {
    const [templates, setTemplates] = useState<PdfTemplateResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const cargar = async () => {
        setCargando(true);
        try {
            const data = await listarPdfTemplates();
            setTemplates(data);
        } catch {
            // toast global
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        listarPdfTemplates()
            .then((data) => {
                if (!cancelled) setTemplates(data);
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setCargando(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleActivar = async (id: string) => {
        setBusyId(id);
        try {
            await activarPdfTemplate(id);
            toast.success("Template activado");
            await cargar();
        } catch {
            // toast global
        } finally {
            setBusyId(null);
        }
    };

    const handleEliminar = async (id: string) => {
        if (!confirm("¿Eliminar este template? No se puede deshacer.")) return;
        setBusyId(id);
        try {
            await eliminarPdfTemplate(id);
            toast.success("Template eliminado");
            setTemplates((prev) => prev.filter((t) => t.id !== id));
        } catch {
            // toast global
        } finally {
            setBusyId(null);
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <PageHeader
                title="Templates PDF"
                description="Diseñá el layout de etiquetas y resumen. El template activo de cada tipo se usa al generar los PDFs."
                icon={FileText}
                admin
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                            <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                            <span className="ml-2 hidden sm:inline">Recargar</span>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/admin/pdf-templates/nuevo">
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo
                            </Link>
                        </Button>
                    </>
                }
            />

            {cargando && templates.length === 0 ? (
                <TableSkeleton rows={3} columns={6} />
            ) : (
                <PdfTemplatesTable
                    templates={templates}
                    onActivar={handleActivar}
                    onEliminar={handleEliminar}
                    busyId={busyId}
                />
            )}
        </main>
    );
}
