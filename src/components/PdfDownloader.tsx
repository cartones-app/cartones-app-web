"use client";

import { useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Loader2, Download, FileText, Tag, CheckCircle2, AlertTriangle, ArrowLeft, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadPdfs, obtenerDatosDistribucion, obtenerPdfTemplateActivo } from "@/lib/api";
import { generarPdfsDeProceso } from "@/lib/pdf-generator";
import { useFeatureFlags } from "@/components/FeatureFlagsProvider";

interface PdfDownloaderProps {
    procesoId: string;
    onBack: () => void;
    onReset: () => void;
}

interface ExtractedFiles {
    etiquetas: Blob | null;
    resumen: Blob | null;
}

/**
 * Flujo de descarga de PDFs.
 *
 * <p><b>Flujo principal (client-side, pdf.client.enabled=true)</b>:
 *   1. GET /api/distribuciones/{id}/datos — datos crudos.
 *   2. GET /api/pdf-templates/active?tipo=ETIQUETAS/RESUMEN — schemas.
 *   3. {@code generarPdfsDeProceso} con pdfme en el browser.
 *
 * <p><b>Fallback (pdf.client.enabled=false)</b>: GET /api/distribuciones/{id}/pdfs
 * que devuelve el ZIP server-side viejo y se extrae con JSZip. Permite rollback
 * sin redeploy si el flujo cliente falla en prod.
 *
 * <p>A diferencia del flujo viejo (one-shot), la generación cliente puede
 * repetirse — los datos viven en el SimulacionCache server-side y los
 * templates son inmutables a corto plazo. No bloqueamos al usuario.
 */
export function PdfDownloader({ procesoId, onBack, onReset }: PdfDownloaderProps) {
    const { isEnabled } = useFeatureFlags();
    const [isLoading, setIsLoading] = useState(false);
    const [extractedFiles, setExtractedFiles] = useState<ExtractedFiles>({
        etiquetas: null,
        resumen: null,
    });
    const [isExtracted, setIsExtracted] = useState(false);
    const [downloadError, setDownloadError] = useState(false);
    const successRef = useRef<HTMLDivElement | null>(null);

    const handleGenerateFiles = async () => {
        setIsLoading(true);
        setDownloadError(false);

        try {
            const clientEnabled = isEnabled("pdf.client.enabled", true);
            const { etiquetas, resumen } = clientEnabled
                ? await generarClientSide(procesoId)
                : await generarServerSide(procesoId);

            setExtractedFiles({ etiquetas, resumen });
            setIsExtracted(true);
            toast.success("Archivos generados", {
                description: "Los PDFs están listos para descargar.",
            });
            requestAnimationFrame(() => {
                successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        } catch (err) {
            // El interceptor global muestra el toast HTTP, pero los errores de
            // pdfme (template malo, runtime) no pasan por axios — hay que
            // surfacearlos acá. Logueamos siempre para diagnóstico y mostramos
            // toast con el mensaje real si no vino de HTTP.
            console.error("PdfDownloader: falló handleGenerateFiles", err);
            const message = err instanceof Error ? err.message : String(err);
            // Heurística: si el error parece venir del axios interceptor
            // (objeto AxiosError, ya tiene su toast), no duplicar.
            const isAxiosError = err && typeof err === "object" && "isAxiosError" in err;
            if (!isAxiosError) {
                toast.error("No se pudo generar el PDF", {
                    description: message,
                    duration: 8000,
                });
            }
            setDownloadError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadEtiquetas = () => {
        if (extractedFiles.etiquetas) {
            saveAs(extractedFiles.etiquetas, `etiquetas.pdf`);
            toast.success("Descargando etiquetas...");
        }
    };

    const handleDownloadResumen = () => {
        if (extractedFiles.resumen) {
            saveAs(extractedFiles.resumen, `resumen.pdf`);
            toast.success("Descargando resumen...");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Archivos PDF
                        {isExtracted && (
                            <span className="ml-auto flex items-center gap-1 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                Archivos listos
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isExtracted ? (
                        <div className="text-center py-6 space-y-6">
                            {downloadError ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p>Error al generar los archivos</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Intentá de nuevo. Si persiste, contactá al administrador.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">
                                    Genera los archivos PDF para descargar las etiquetas y el resumen
                                </p>
                            )}

                            <div className="flex flex-col items-center gap-4">
                                <Button
                                    onClick={handleGenerateFiles}
                                    disabled={isLoading}
                                    size="lg"
                                    className="min-w-[200px]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Generar Archivos
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={onBack}
                                    disabled={isLoading}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Volver a Configuración
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div
                                ref={successRef}
                                className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600 dark:text-emerald-400 scroll-mt-24"
                            >
                                <p className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Archivos listos. Puedes descargarlos las veces que necesites.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50 border transition-colors hover:bg-muted/80">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Tag className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Etiquetas</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {extractedFiles.etiquetas ? "Listo para descargar" : "No disponible"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleDownloadEtiquetas}
                                        disabled={!extractedFiles.etiquetas}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Descargar Etiquetas
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg bg-muted/50 border transition-colors hover:bg-muted/80">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">Resumen</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {extractedFiles.resumen ? "Listo para descargar" : "No disponible"}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleDownloadResumen}
                                        disabled={!extractedFiles.resumen}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Descargar Resumen
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isExtracted && (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm border-l-4 border-l-primary animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <h3 className="font-medium">¿Proceso finalizado?</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Para generar nuevos archivos con diferente configuración, inicia un nuevo proceso.
                                    </p>
                                </div>
                            </div>
                            <Button onClick={onReset} size="lg" className="shrink-0 w-full md:w-auto shadow-md">
                                <Plus className="h-4 w-4 mr-2" />
                                Iniciar Nuevo Proceso
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl bg-background/75 backdrop-blur-lg border border-border/40 shadow-xl rounded-full p-2 flex items-center justify-end gap-2">
                {!isExtracted ? (
                    <>
                        <Button
                            onClick={onBack}
                            disabled={isLoading}
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <Button
                            onClick={handleGenerateFiles}
                            disabled={isLoading}
                            size="sm"
                            className="rounded-full shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Generar Archivos
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={handleDownloadEtiquetas}
                            disabled={!extractedFiles.etiquetas}
                            variant="outline"
                            size="sm"
                            className="rounded-full shadow-sm"
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Descargar</span> Etiquetas
                        </Button>
                        <Button
                            onClick={handleDownloadResumen}
                            disabled={!extractedFiles.resumen}
                            size="sm"
                            className="rounded-full shadow-sm"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Descargar</span> Resumen
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

/** Flujo principal: pide datos + templates al backend y arma los PDFs con pdfme. */
async function generarClientSide(procesoId: string): Promise<ExtractedFiles> {
    const [datos, tEtiquetas, tResumen] = await Promise.all([
        obtenerDatosDistribucion(procesoId),
        obtenerPdfTemplateActivo("ETIQUETAS"),
        obtenerPdfTemplateActivo("RESUMEN"),
    ]);
    const { etiquetas, resumen } = await generarPdfsDeProceso(datos, tEtiquetas, tResumen);
    return { etiquetas, resumen };
}

/**
 * Fallback al endpoint server-side viejo (ZIP con los 2 PDFs). Se usa cuando
 * el flag pdf.client.enabled está en false — kill-switch sin redeploy.
 */
async function generarServerSide(procesoId: string): Promise<ExtractedFiles> {
    const zipBlob = await downloadPdfs(procesoId);
    const zip = await JSZip.loadAsync(zipBlob);

    let etiquetas: Blob | null = null;
    let resumen: Blob | null = null;
    for (const [filename, file] of Object.entries(zip.files)) {
        if (file.dir) continue;
        const content = await file.async("blob");
        const pdfBlob = new Blob([content], { type: "application/pdf" });
        const lowerName = filename.toLowerCase();
        if (lowerName.includes("etiqueta") || lowerName.includes("label")) {
            etiquetas = pdfBlob;
        } else if (lowerName.includes("resumen") || lowerName.includes("summary")) {
            resumen = pdfBlob;
        } else if (!etiquetas) {
            etiquetas = pdfBlob;
        } else if (!resumen) {
            resumen = pdfBlob;
        }
    }
    return { etiquetas, resumen };
}
