"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ChevronRight, Clock, FileArchive, FileText, Loader2, RotateCcw, Tag } from "lucide-react";
import { saveAs } from "file-saver";
import { FileUploader } from "@/components/FileUploader";
import { WizardStepper } from "@/components/WizardStepper";
import { useProcesoStore } from "@/store/useProcesoStore";
import { downloadPdfs, listarMisDistribuciones, uploadExcel } from "@/lib/api";
import { extractPdfsFromZip } from "@/lib/pdf-from-zip";
import { formatFechaHoraCorta } from "@/lib/date-format";
import { shortId } from "@/lib/format-id";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProcesoDistribucionResumenDTO } from "@/types";

type DescargaTipo = "etiquetas" | "resumen" | "zip";

const RECIENTES_LIMIT = 4;

const ESTADO_COLOR: Record<string, string> = {
    PENDIENTE: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    SIMULADO: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    COMPLETADO: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
};

// Backend serializa los estados en lowercase (enum @JsonValue). Normalizamos
// a UPPERCASE solo para presentación y matching del mapa de colores.
function normalizarEstado(estado: string | undefined | null): string {
    return (estado ?? "").trim().toUpperCase();
}

export default function UploadPage() {
    const router = useRouter();
    const { procesoId, setProcesoId, setCurrentStep, reset } = useProcesoStore();

    // Defensa contra estado persistido corrupto: hubo un período donde uploadExcel
    // guardaba el DTO entero en lugar del string. Si detectamos eso en localStorage,
    // lo limpiamos en el primer render para evitar que la UI explote.
    useEffect(() => {
        if (procesoId != null && typeof procesoId !== "string") {
            reset();
        }
    }, [procesoId, reset]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const selectedFileRef = useRef<File | null>(null);

    const [recientes, setRecientes] = useState<ProcesoDistribucionResumenDTO[]>([]);
    const [cargandoRecientes, setCargandoRecientes] = useState(true);
    const [descargando, setDescargando] = useState<{ id: string; tipo: DescargaTipo } | null>(null);

    useEffect(() => {
        listarMisDistribuciones()
            .then((data) => setRecientes(data.slice(0, RECIENTES_LIMIT)))
            .catch(() => {})
            .finally(() => setCargandoRecientes(false));
    }, []);

    const handleUpload = async (file: File) => {
        selectedFileRef.current = file;
        setIsLoading(true);
        setHasError(false);

        try {
            const procesoId = await uploadExcel(file);
            setProcesoId(procesoId);
            setCurrentStep(2);
            toast.success("Archivo cargado", {
                description: "Listo para configurar la distribución.",
            });
            router.push("/configuracion");
        } catch {
            setHasError(true);
            setIsLoading(false);
        }
    };

    const handleFileSelect = (file: File) => handleUpload(file);

    const handleRetry = () => {
        if (selectedFileRef.current) {
            handleUpload(selectedFileRef.current);
        }
    };

    const handleReset = () => {
        reset();
        setHasError(false);
        selectedFileRef.current = null;
        toast.info("Sesión reiniciada");
    };

    const handleDescargar = async (procesoId: string, tipo: DescargaTipo) => {
        setDescargando({ id: procesoId, tipo });
        try {
            const blob = await downloadPdfs(procesoId);
            const idCorto = procesoId.slice(0, 8);
            if (tipo === "zip") {
                saveAs(blob, `distribucion-${idCorto}.zip`);
            } else {
                const { etiquetas, resumen } = await extractPdfsFromZip(blob);
                if (tipo === "etiquetas") {
                    if (!etiquetas) {
                        toast.warning("No hay PDF de etiquetas en este proceso.");
                        return;
                    }
                    saveAs(etiquetas, `etiquetas-${idCorto}.pdf`);
                } else {
                    if (!resumen) {
                        toast.warning("No hay PDF de resumen en este proceso.");
                        return;
                    }
                    saveAs(resumen, `resumen-${idCorto}.pdf`);
                }
            }
        } catch {
            // toast global
        } finally {
            setDescargando(null);
        }
    };

    const isBusy = (procesoId: string, tipo: DescargaTipo) =>
        descargando?.id === procesoId && descargando?.tipo === tipo;

    return (
        <div className="relative overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative">
                <div className="container mx-auto px-4 pt-8 flex justify-center">
                    <WizardStepper currentStep={1} />
                </div>

                <main className="container mx-auto px-4 py-10 max-w-5xl">
                    <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl md:text-3xl font-bold">
                                Carga de datos
                            </CardTitle>
                            <CardDescription className="text-base">
                                Subí tu archivo Excel con la información de los vendedores para comenzar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="mx-auto max-w-2xl">
                                {typeof procesoId === "string" && procesoId ? (
                                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-full bg-amber-500/15 p-2">
                                                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-amber-900 dark:text-amber-200">
                                                    Ya tenés una sesión activa
                                                </h3>
                                                <p className="text-sm text-amber-800/80 dark:text-amber-300/80 mt-1">
                                                    Proceso{" "}
                                                    <span className="font-mono">
                                                        {shortId(procesoId)}
                                                    </span>
                                                    . Continuá donde la dejaste o reiniciá para
                                                    subir otro Excel.
                                                </p>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <Button
                                                        onClick={() => router.push("/configuracion")}
                                                    >
                                                        Continuar sesión
                                                        <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                    <Button variant="outline" onClick={handleReset}>
                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                        Reiniciar y subir otro Excel
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <FileUploader
                                            onFileSelect={handleFileSelect}
                                            isLoading={isLoading}
                                            hasError={hasError}
                                            onRetry={handleRetry}
                                        />

                                        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                                            <h3 className="font-medium text-sm mb-2">
                                                Formato esperado del archivo:
                                            </h3>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                <li>• Archivo Excel (.xlsx)</li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <section className="mt-10" aria-labelledby="recientes-heading">
                        <div className="flex items-center justify-between mb-3">
                            <h2
                                id="recientes-heading"
                                className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                            >
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                Distribuciones recientes
                            </h2>
                            {recientes.length > 0 && (
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/mis-distribuciones">
                                        Ver todas
                                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {cargandoRecientes ? (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 rounded-lg" />
                                ))}
                            </div>
                        ) : recientes.length === 0 ? (
                            <div className="rounded-xl border border-dashed bg-card/40 p-8 text-center text-sm text-muted-foreground">
                                Cuando generes distribuciones, vas a verlas acá para descargarlas rápido.
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {recientes.map((p) => {
                                    const puedeDescargar = p.tieneEtiquetas || p.tieneResumen;
                                    return (
                                        <div
                                            key={p.procesoId}
                                            className="group rounded-lg border bg-card/80 backdrop-blur-sm p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-sm transition-all"
                                        >
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <FileText className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground truncate">
                                                        {shortId(p.procesoId)}
                                                    </span>
                                                    {(() => {
                                                        const estado = normalizarEstado(p.estado);
                                                        return (
                                                            <span
                                                                className={`inline-block px-2 py-0.5 rounded text-xs border ${
                                                                    ESTADO_COLOR[estado] ??
                                                                    "bg-muted text-muted-foreground border-border"
                                                                }`}
                                                            >
                                                                {estado}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {formatFechaHoraCorta(p.createdAt)}
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!p.tieneEtiquetas || isBusy(p.procesoId, "etiquetas")}
                                                    onClick={() => handleDescargar(p.procesoId, "etiquetas")}
                                                    title="Descargar solo etiquetas (PDF)"
                                                    aria-label="Descargar etiquetas"
                                                >
                                                    {isBusy(p.procesoId, "etiquetas") ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Tag className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={!p.tieneResumen || isBusy(p.procesoId, "resumen")}
                                                    onClick={() => handleDescargar(p.procesoId, "resumen")}
                                                    title="Descargar solo resumen (PDF)"
                                                    aria-label="Descargar resumen"
                                                >
                                                    {isBusy(p.procesoId, "resumen") ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <FileText className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!puedeDescargar || isBusy(p.procesoId, "zip")}
                                                    onClick={() => handleDescargar(p.procesoId, "zip")}
                                                    title="Descargar ZIP completo"
                                                    aria-label="Descargar ZIP"
                                                >
                                                    {isBusy(p.procesoId, "zip") ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <FileArchive className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {!cargandoRecientes && recientes.length === RECIENTES_LIMIT && (
                            <div className="mt-3 text-center">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/mis-distribuciones">
                                        Ver todas
                                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
