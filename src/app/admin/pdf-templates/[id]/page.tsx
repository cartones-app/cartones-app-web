"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, CheckCircle2, FileText, Power, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { VariablesPanel } from "@/components/admin/pdf-templates/VariablesPanel";
import {
    activarPdfTemplate,
    actualizarPdfTemplate,
    obtenerPdfTemplate,
} from "@/lib/api";
import type { PdfTemplateDetalle } from "@/types";

// Designer importado dinámico — toca window y queremos evitar SSR.
const PdfTemplateDesigner = dynamic(
    () =>
        import("@/components/admin/pdf-templates/PdfTemplateDesigner").then(
            (m) => m.PdfTemplateDesigner
        ),
    { ssr: false, loading: () => <div className="text-sm text-muted-foreground">Cargando editor…</div> }
);

export default function EditarPdfTemplatePage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const [template, setTemplate] = useState<PdfTemplateDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [nombre, setNombre] = useState("");
    const [slotsPorPagina, setSlotsPorPagina] = useState<number>(3);
    const [schemaJson, setSchemaJson] = useState<string>("");
    const [guardando, setGuardando] = useState(false);
    const [activando, setActivando] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        obtenerPdfTemplate(id)
            .then((data) => {
                if (cancelled) return;
                setTemplate(data);
                setNombre(data.nombre);
                setSlotsPorPagina(data.slotsPorPagina);
                setSchemaJson(data.schemaJson);
            })
            .catch(() => {
                if (!cancelled) router.push("/admin/pdf-templates");
            })
            .finally(() => {
                if (!cancelled) setCargando(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, router]);

    const handleGuardar = async () => {
        if (!template) return;
        if (!nombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        setGuardando(true);
        try {
            const actualizado = await actualizarPdfTemplate(template.id, {
                nombre: nombre.trim(),
                schemaJson,
                slotsPorPagina: template.tipo === "ETIQUETAS" ? slotsPorPagina : undefined,
            });
            setTemplate(actualizado);
            toast.success("Template guardado");
        } catch {
            // toast global
        } finally {
            setGuardando(false);
        }
    };

    const handleActivar = async () => {
        if (!template) return;
        setActivando(true);
        try {
            const activado = await activarPdfTemplate(template.id);
            setTemplate(activado);
            toast.success("Template activado");
        } catch {
            // toast global
        } finally {
            setActivando(false);
        }
    };

    if (cargando) {
        return (
            <main className="container mx-auto px-4 py-8">
                <p className="text-sm text-muted-foreground">Cargando…</p>
            </main>
        );
    }

    if (!template) return null;

    return (
        <main className="container mx-auto px-4 py-8 pb-24 max-w-[1400px]">
            <PageHeader
                title={template.nombre}
                description={`Tipo ${template.tipo}${template.activo ? " · Activo" : ""}`}
                icon={FileText}
                admin
                actions={
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/admin/pdf-templates">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Link>
                    </Button>
                }
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Editor — min-w-0 evita que el Designer estire el grid si pdfme
                    intenta crecer por su contenido. */}
                <div className="space-y-4 min-w-0">
                    <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                        <div className="grid gap-1.5">
                            <Label htmlFor="t-nombre">Nombre</Label>
                            <Input
                                id="t-nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                maxLength={128}
                            />
                        </div>
                        {template.tipo === "ETIQUETAS" && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="t-slots">Etiquetas por página</Label>
                                <select
                                    id="t-slots"
                                    value={slotsPorPagina}
                                    onChange={(e) => setSlotsPorPagina(Number(e.target.value))}
                                    className="h-9 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value={3}>3</option>
                                    <option value={4}>4</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <PdfTemplateDesigner
                        // key={template.id} fuerza remount si Next reutiliza
                        // el componente entre rutas /[id]/ distintas. Sin esto,
                        // el Designer queda atascado con el schema del primer mount.
                        key={template.id}
                        initialSchemaJson={schemaJson}
                        onTemplateChange={setSchemaJson}
                        height={650}
                    />
                </div>

                {/* Sidebar variables */}
                <aside>
                    <VariablesPanel tipo={template.tipo} slotsPorPagina={slotsPorPagina} />
                </aside>
            </div>

            {/* Floating dock con acciones críticas, igual patrón que /resultados. */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-background/75 backdrop-blur-lg border border-border/40 shadow-xl rounded-full p-2 flex items-center justify-end gap-2">
                {!template.activo && (
                    <Button
                        onClick={handleActivar}
                        disabled={activando || guardando}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                    >
                        <Power className="h-4 w-4 mr-2" />
                        {activando ? "Activando…" : "Activar"}
                    </Button>
                )}
                {template.activo && (
                    <span className="inline-flex items-center gap-1 px-3 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Template activo
                    </span>
                )}
                <Button
                    onClick={handleGuardar}
                    disabled={guardando || activando}
                    size="sm"
                    className="rounded-full shadow-sm"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {guardando ? "Guardando…" : "Guardar"}
                </Button>
            </div>
        </main>
    );
}
