"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Download, FileText, Tag, CheckCircle2, AlertTriangle, ArrowLeft, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    descargarEtiquetas,
    descargarResumen,
    generarArchivosProceso,
} from "@/lib/api";
import { descargarPdfProceso } from "@/lib/proceso-descarga";
import { useProcesoStore } from "@/store/useProcesoStore";

interface PdfDownloaderProps {
    procesoId: string;
    onBack: () => void;
    onReset: () => void;
}

export function PdfDownloader({ procesoId, onBack, onReset }: Readonly<PdfDownloaderProps>) {
    const procesoCompletado = useProcesoStore((s) => s.procesoCompletado);
    const marcarProcesoCompletado = useProcesoStore((s) => s.marcarProcesoCompletado);
    const [isLoading, setIsLoading] = useState(false);
    // Inicializamos desde el store para que, si el usuario navega de vuelta a
    // /resultados después de haber generado archivos, vea directamente los
    // botones de descarga en lugar del CTA de "Generar" (el back rechazaría
    // con 422 porque el proceso ya está COMPLETADO).
    const [archivosGenerados, setArchivosGenerados] = useState(procesoCompletado);
    const [descargando, setDescargando] = useState<"etiquetas" | "resumen" | null>(null);
    const [errorGenerando, setErrorGenerando] = useState(false);
    // Apuntamos al banner de éxito para hacer scroll cuando se generan los
    // archivos — si no, la sección de descarga queda fuera del viewport y el
    // usuario no se entera de que ya puede bajar los PDFs.
    const successRef = useRef<HTMLDivElement | null>(null);

    const handleGenerateFiles = async () => {
        // El backend bloquea si el proceso no está en estado SIMULADO (UnprocessableEntity).
        // El flag local previene UX confusa de doble-click.
        if (archivosGenerados) {
            toast.warning("Los archivos ya fueron generados", {
                description: "Podés descargarlos las veces que necesites.",
            });
            return;
        }

        setIsLoading(true);
        setErrorGenerando(false);

        try {
            await generarArchivosProceso(procesoId);
            setArchivosGenerados(true);
            // En el backend este endpoint transiciona el proceso a COMPLETADO.
            // Marcamos el flag para que /upload no muestre el banner de
            // "sesión activa" si el user vuelve a navegar a esa página.
            marcarProcesoCompletado();

            toast.success("Archivos generados", {
                description: "Los PDFs están listos para descargar.",
            });

            requestAnimationFrame(() => {
                // scrollIntoView no existe en jsdom (tests); el optional chaining
                // sobre el método evita crashear en ese entorno sin afectar
                // browsers reales donde siempre está definido.
                successRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
            });
        } catch {
            // Error mostrado por el interceptor axios global.
            setErrorGenerando(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (tipo: "etiquetas" | "resumen") => {
        setDescargando(tipo);
        try {
            const fetcher = tipo === "etiquetas" ? descargarEtiquetas : descargarResumen;
            await descargarPdfProceso(procesoId, tipo, fetcher);
            toast.success("Descarga iniciada");
        } catch {
            // Error mostrado por el interceptor axios global.
        } finally {
            setDescargando(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Archivos PDF
                        {archivosGenerados && (
                            <span className="ml-auto flex items-center gap-1 text-sm font-normal text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" />
                                Listos
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!archivosGenerados ? (
                        <div className="text-center py-6 space-y-6">
                            {errorGenerando ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-2 text-destructive">
                                        <AlertTriangle className="h-5 w-5" />
                                        <p>Error al generar los archivos</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Si ya generaste los archivos antes, podés bajarlos desde la pantalla de inicio.
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
                                    Archivos listos. Podés descargarlos las veces que necesites.
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
                                            <p className="text-sm text-muted-foreground">Listo para descargar</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleDownload("etiquetas")}
                                        disabled={descargando === "etiquetas"}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {descargando === "etiquetas" ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
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
                                            <p className="text-sm text-muted-foreground">Listo para descargar</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleDownload("resumen")}
                                        disabled={descargando === "resumen"}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        {descargando === "resumen" ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Download className="h-4 w-4 mr-2" />
                                        )}
                                        Descargar Resumen
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {archivosGenerados && (
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
                {!archivosGenerados ? (
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
                            onClick={() => handleDownload("etiquetas")}
                            disabled={descargando === "etiquetas"}
                            variant="outline"
                            size="sm"
                            className="rounded-full shadow-sm"
                        >
                            {descargando === "etiquetas" ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Tag className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">Descargar</span> Etiquetas
                        </Button>
                        <Button
                            onClick={() => handleDownload("resumen")}
                            disabled={descargando === "resumen"}
                            size="sm"
                            className="rounded-full shadow-sm"
                        >
                            {descargando === "resumen" ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">Descargar</span> Resumen
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
