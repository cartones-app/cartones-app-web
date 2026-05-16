"use client";

import { useRef, useState } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Loader2, Download, FileText, Tag, CheckCircle2, AlertTriangle, ArrowLeft, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadPdfs } from "@/lib/api";
import { useProcesoStore } from "@/store/useProcesoStore";

interface PdfDownloaderProps {
    procesoId: string;
    onBack: () => void;
    onReset: () => void;
}

interface ExtractedFiles {
    etiquetas: Blob | null;
    resumen: Blob | null;
}

export function PdfDownloader({ procesoId, onBack, onReset }: PdfDownloaderProps) {
    const marcarProcesoCompletado = useProcesoStore((s) => s.marcarProcesoCompletado);
    const [isLoading, setIsLoading] = useState(false);
    const [extractedFiles, setExtractedFiles] = useState<ExtractedFiles>({
        etiquetas: null,
        resumen: null,
    });
    const [isExtracted, setIsExtracted] = useState(false);
    const [hasBeenGenerated, setHasBeenGenerated] = useState(false);
    const [downloadError, setDownloadError] = useState(false);
    // Apuntamos al banner de éxito para hacer scroll cuando se generan
    // los archivos — si no, la sección de descarga queda fuera del viewport
    // y el usuario no se entera de que ya puede bajar los PDFs.
    const successRef = useRef<HTMLDivElement | null>(null);

    const handleGenerateFiles = async () => {
        // Prevent multiple calls - one-shot endpoint
        if (hasBeenGenerated) {
            toast.warning("Los archivos ya fueron generados", {
                description: "Solo se permite la descarga una vez.",
            });
            return;
        }

        setIsLoading(true);
        setDownloadError(false);

        try {
            // Download the ZIP file - ONE-SHOT, can only be called once
            const zipBlob = await downloadPdfs(procesoId);

            // JSZip dynamic import: dep pesado (~80KB) que solo necesitamos
            // al momento de extraer. No quemarlo en el bundle inicial de
            // /resultados, que ya carga 3 cards pesadas.
            const { default: JSZip } = await import("jszip");
            const zip = await JSZip.loadAsync(zipBlob);

            let etiquetasFile: Blob | null = null;
            let resumenFile: Blob | null = null;

            // Iterate through files in the ZIP
            for (const [filename, file] of Object.entries(zip.files)) {
                if (file.dir) continue;

                const content = await file.async("blob");
                const pdfBlob = new Blob([content], { type: "application/pdf" });

                // Match files by name pattern
                const lowerName = filename.toLowerCase();
                if (lowerName.includes("etiqueta") || lowerName.includes("label")) {
                    etiquetasFile = pdfBlob;
                } else if (lowerName.includes("resumen") || lowerName.includes("summary")) {
                    resumenFile = pdfBlob;
                } else if (!etiquetasFile) {
                    // If no pattern match, assign first PDF as etiquetas
                    etiquetasFile = pdfBlob;
                } else if (!resumenFile) {
                    // Assign second PDF as resumen
                    resumenFile = pdfBlob;
                }
            }

            setExtractedFiles({
                etiquetas: etiquetasFile,
                resumen: resumenFile,
            });
            setIsExtracted(true);
            setHasBeenGenerated(true);
            // En el backend este endpoint transiciona el proceso a COMPLETADO.
            // Marcamos el flag para que /upload no muestre el banner de
            // "sesión activa" si el user vuelve a navegar a esa página.
            marcarProcesoCompletado();

            toast.success("Archivos generados", {
                description: "Los PDFs están listos para descargar.",
            });

            // Scroll suave al banner de éxito en el siguiente tick para que
            // el usuario vea inmediatamente que la generación terminó y dónde
            // están los botones de descarga.
            requestAnimationFrame(() => {
                successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        } catch {
            // Error handled by axios interceptor
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
                        {hasBeenGenerated && (
                            <span className="ml-auto flex items-center gap-1 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                Archivos en memoria
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
                                        Si ya generaste los archivos anteriormente, deberás iniciar un nuevo proceso.
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
                            {/* Success indicator */}
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
                                {/* Etiquetas Download */}
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

                                {/* Resumen Download */}
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

            {/* Iniciar Nuevo Proceso - Only shown when files are ready (replaces Back button flow) */}
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

            {/*
              Floating Action Dock — replica el patrón de /configuracion. Las
              acciones críticas quedan siempre visibles sin tener que scrollear
              hasta el final de la tabla de resultados.
            */}
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
                        {/*
                          Post-generación: los botones de descarga viven acá para que el usuario
                          no tenga que scrollear hasta el card. "Iniciar Nuevo Proceso" queda
                          solo en la card destacada — es una acción terminal, no urgente.
                        */}
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
