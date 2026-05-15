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
                const { Designer } = await import("@pdfme/ui");
                const { text, table } = await import("@pdfme/schemas");
                if (cancelled || !containerRef.current) return;

                let parsed: Parameters<typeof Designer.prototype.updateTemplate>[0];
                try {
                    parsed = JSON.parse(initialSchemaJson);
                } catch {
                    parsed = { basePdf: "BLANK_PDF", schemas: [[]] } as never;
                    setError("El template tenía JSON inválido; se cargó uno vacío.");
                }

                const designer = new Designer({
                    domContainer: containerRef.current,
                    template: parsed,
                    plugins: { text, table },
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
            <div
                ref={containerRef}
                className="border rounded-lg bg-card"
                style={{ height, minHeight: 400 }}
            />
        </div>
    );
}
