"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { crearPdfTemplate } from "@/lib/api";
import type { PdfTemplateTipo } from "@/types";

/** JSON mínimo válido (passa validación basePdf+schemas en el backend). */
const SCHEMA_INICIAL = '{"basePdf":"BLANK_PDF","schemas":[[]]}';

export default function NuevoPdfTemplatePage() {
    const router = useRouter();
    const [tipo, setTipo] = useState<PdfTemplateTipo>("ETIQUETAS");
    const [nombre, setNombre] = useState("");
    const [slotsPorPagina, setSlotsPorPagina] = useState<number>(3);
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async () => {
        if (!nombre.trim()) {
            toast.error("El nombre es obligatorio");
            return;
        }
        setGuardando(true);
        try {
            const creado = await crearPdfTemplate({
                tipo,
                nombre: nombre.trim(),
                schemaJson: SCHEMA_INICIAL,
                slotsPorPagina: tipo === "ETIQUETAS" ? slotsPorPagina : undefined,
            });
            toast.success("Template creado");
            router.push(`/admin/pdf-templates/${creado.id}`);
        } catch {
            // toast global
        } finally {
            setGuardando(false);
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-2xl">
            <PageHeader
                title="Nuevo template PDF"
                description="Definí tipo y nombre. Después diseñás el layout en el editor."
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

            <div className="space-y-4 rounded-lg border bg-card p-5">
                <div className="grid gap-1.5">
                    <Label htmlFor="t-tipo">Tipo</Label>
                    <select
                        id="t-tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as PdfTemplateTipo)}
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                        <option value="ETIQUETAS">Etiquetas</option>
                        <option value="RESUMEN">Resumen</option>
                    </select>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="t-nombre">Nombre</Label>
                    <Input
                        id="t-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Etiquetas A4 v2"
                        maxLength={128}
                        autoFocus
                    />
                </div>
                {tipo === "ETIQUETAS" && (
                    <div className="grid gap-1.5">
                        <Label htmlFor="t-slots">Etiquetas por página A4</Label>
                        <select
                            id="t-slots"
                            value={slotsPorPagina}
                            onChange={(e) => setSlotsPorPagina(Number(e.target.value))}
                            className="h-9 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value={3}>3 — layout original</option>
                            <option value={4}>4 — más compacto</option>
                        </select>
                    </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <Button asChild variant="ghost" size="sm" disabled={guardando}>
                        <Link href="/admin/pdf-templates">Cancelar</Link>
                    </Button>
                    <Button size="sm" onClick={handleGuardar} disabled={guardando}>
                        <Save className="h-4 w-4 mr-2" />
                        {guardando ? "Creando…" : "Crear y editar"}
                    </Button>
                </div>
            </div>
        </main>
    );
}
