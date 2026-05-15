"use client";

import { useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Flag } from "lucide-react";

/*
 * Página de SPIKE — descartable.
 *
 * Objetivo: validar que @pdfme/{ui,generator,common,schemas} funcionan en este
 * stack (Next.js 15 App Router + React 19 + pnpm strict) antes de empezar la
 * Fase 1 del proyecto. No está enlazada en el sidebar; acceso solo por URL
 * directa /admin/pdf-spike.
 *
 * Criterios de éxito:
 *   - El Designer renderiza sin errores de runtime.
 *   - Al apretar "Generar PDF", baja un PDF válido con el placeholder
 *     {nombre} reemplazado por un valor de prueba.
 *
 * Si algo falla, ver pdf-editor/open-questions.md Q1 y replantear.
 */
export default function PdfSpikePage() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Lazy refs a las APIs de pdfme — se importan dinámicamente para evitar
    // problemas de SSR (pdfme requiere `window`).
    const designerRef = useRef<unknown>(null);
    const [template, setTemplate] = useState<unknown>(null);
    const [status, setStatus] = useState<string>("Cargando pdfme…");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { BLANK_PDF } = await import("@pdfme/common");
                const { Designer } = await import("@pdfme/ui");
                const { text } = await import("@pdfme/schemas");

                if (cancelled || !containerRef.current) return;

                // Template trivial: una sola página A4 con un text field bindable.
                const initialTemplate = {
                    basePdf: BLANK_PDF,
                    schemas: [
                        [
                            {
                                name: "nombre",
                                type: "text",
                                position: { x: 20, y: 30 },
                                width: 100,
                                height: 15,
                                fontSize: 24,
                                fontColor: "#000000",
                            },
                            {
                                name: "saldo",
                                type: "text",
                                position: { x: 20, y: 60 },
                                width: 80,
                                height: 10,
                                fontSize: 12,
                                fontColor: "#666666",
                            },
                        ],
                    ],
                };

                const designer = new Designer({
                    domContainer: containerRef.current,
                    template: initialTemplate,
                    plugins: { text },
                });
                // El Designer expone onChangeTemplate para sincronizar el state.
                designer.onChangeTemplate((tpl: unknown) => setTemplate(tpl));

                designerRef.current = designer;
                setTemplate(initialTemplate);
                setStatus("Designer activo. Probá mover los campos.");
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
                setStatus("Falló la inicialización del Designer.");
            }
        })();

        return () => {
            cancelled = true;
            const d = designerRef.current as { destroy?: () => void } | null;
            d?.destroy?.();
            designerRef.current = null;
        };
    }, []);

    const handleGenerarPdf = async () => {
        const designer = designerRef.current as { getTemplate?: () => unknown } | null;
        if (!designer?.getTemplate) {
            setError("Designer no inicializado");
            return;
        }
        try {
            const { generate } = await import("@pdfme/generator");
            const { text } = await import("@pdfme/schemas");

            // Leer el template FRESCO del Designer al momento de generar.
            // No confiar en el state — onChangeTemplate puede no haber disparado
            // para algunos cambios y el state queda stale.
            const currentTemplate = designer.getTemplate() as {
                schemas: Array<Array<{ name: string }>>;
            };

            // Armar inputs dinámicamente con valores de prueba para CADA field
            // que tenga el template, así el admin ve que todo lo que agregó
            // se renderiza. Valores especiales para los names conocidos del
            // template inicial.
            const sampleByName: Record<string, string> = {
                nombre: "Vendedor de prueba",
                saldo: "$ 12.345",
            };
            const input: Record<string, string> = {};
            for (const page of currentTemplate.schemas ?? []) {
                for (const field of page ?? []) {
                    input[field.name] = sampleByName[field.name] ?? `[${field.name}]`;
                }
            }

            const pdf = await generate({
                template: currentTemplate as Parameters<typeof generate>[0]["template"],
                inputs: [input],
                plugins: { text },
            });

            const arrayBuffer = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
            const blob = new Blob([arrayBuffer], { type: "application/pdf" });
            saveAs(blob, "pdf-spike.pdf");
            setStatus(`PDF generado. ${Object.keys(input).length} campo(s) renderizado(s).`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <PageHeader
                title="PDF Spike (pdfme)"
                description="Página descartable para validar que pdfme funciona en este stack. No está en el sidebar."
                icon={Flag}
                admin
                actions={
                    <Button size="sm" onClick={handleGenerarPdf}>
                        Generar PDF
                    </Button>
                }
            />

            <div className="text-sm text-muted-foreground mb-2">{status}</div>
            {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-3 mb-3 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div
                ref={containerRef}
                className="border rounded-lg bg-card"
                style={{ height: "75vh", minHeight: 600 }}
            />
        </main>
    );
}
