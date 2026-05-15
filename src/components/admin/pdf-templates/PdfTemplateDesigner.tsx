"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wrapper React del Designer de pdfme.
 *
 * <p>Carga {@code @pdfme/ui} dinámicamente porque toca {@code window} y no
 * podemos correrlo en SSR. El padre le pasa el JSON inicial; el Designer
 * notifica cambios via {@code onTemplateChange}.
 *
 * <p>La instancia se monta una sola vez al primer render del cliente.
 * Si {@code initialSchemaJson} cambia después (ej. recarga), el componente
 * se desmonta vía la {@code key} que pase el padre.
 */
interface Props {
    initialSchemaJson: string;
    onTemplateChange: (schemaJson: string) => void;
    /** Altura fija del editor en pixels. Default 600. */
    height?: number;
}

export function PdfTemplateDesigner({ initialSchemaJson, onTemplateChange, height = 600 }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const designerRef = useRef<{ getTemplate?: () => unknown; destroy?: () => void } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    // Mantengo el callback en un ref para que el effect de montaje (que solo
    // corre una vez) siempre llame al callback más reciente sin re-instanciar
    // el Designer cada render.
    const onTemplateChangeRef = useRef(onTemplateChange);
    useEffect(() => {
        onTemplateChangeRef.current = onTemplateChange;
    }, [onTemplateChange]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { BLANK_PDF } = await import("@pdfme/common");
                const { Designer } = await import("@pdfme/ui");
                const { text, table, rectangle, line } = await import("@pdfme/schemas");
                if (cancelled || !containerRef.current) return;

                let parsed: { basePdf: string; schemas: unknown };
                try {
                    parsed = JSON.parse(initialSchemaJson);
                } catch {
                    parsed = { basePdf: BLANK_PDF, schemas: [[]] };
                    setError("El template tenía JSON inválido; se cargó uno vacío.");
                }
                // El seed inicial (V7) guarda basePdf como string literal "BLANK_PDF"
                // porque no podemos referenciar la constante en el SQL. pdfme intenta
                // parsear ese string como base64 PDF y revienta. Normalizamos acá.
                if (parsed.basePdf === "BLANK_PDF" || !parsed.basePdf) {
                    parsed.basePdf = BLANK_PDF;
                }

                const designer = new Designer({
                    domContainer: containerRef.current,
                    template: parsed as Parameters<typeof Designer.prototype.updateTemplate>[0],
                    plugins: { text, table, rectangle, line },
                });
                designer.onChangeTemplate(() => {
                    const tpl = designer.getTemplate();
                    onTemplateChangeRef.current(JSON.stringify(tpl));
                });
                designerRef.current = designer;
                setReady(true);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        })();

        return () => {
            cancelled = true;
            designerRef.current?.destroy?.();
            designerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // initialSchemaJson intencional fuera — re-mount via key del padre.

    return (
        <div className="space-y-2">
            {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}
            {!ready && !error && (
                <div className="text-sm text-muted-foreground">Cargando editor…</div>
            )}
            {/*
              overflow-hidden + max-w-full: pdfme.ui mide su container y a veces
              entra en un loop de re-cálculo si el parent es flex/grid sin
              constraint de ancho — el container crece pixel a pixel. Lo
              clavamos al ancho del padre.
            */}
            <div
                ref={containerRef}
                className="border rounded-lg bg-card overflow-hidden max-w-full"
                style={{ height, minHeight: 400, width: "100%" }}
            />
        </div>
    );
}
