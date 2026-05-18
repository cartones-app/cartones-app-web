"use client";

import { useRef, useState } from "react";
import { saveAs } from "file-saver";
import { Check, Download, FileUp, RefreshCw, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { PageShell } from "@/components/PageShell";
import { RutaUploadStep } from "@/components/ruta/RutaUploadStep";
import { RutaFechasStep } from "@/components/ruta/RutaFechasStep";
import { RutaRegistrosStep } from "@/components/ruta/RutaRegistrosStep";
import {
    cargarRutaExcel,
    exportarRutaExcel,
    filtrarRutaPorFechas,
} from "@/lib/api";
import type { RegistroRutaDTO } from "@/types";

type Step = "carga" | "fechas" | "registros";

export default function RutaPage() {
    const [step, setStep] = useState<Step>("carga");
    const [sesionId, setSesionId] = useState<string | null>(null);
    const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([]);
    const [registros, setRegistros] = useState<RegistroRutaDTO[]>([]);
    const [cargando, setCargando] = useState(false);
    const [errorCarga, setErrorCarga] = useState(false);
    // Guardamos el último archivo para que el botón "Reintentar" del
    // FileUploader pueda re-disparar el upload sin que el user tenga que
    // tirar y volver a soltar el Excel.
    const ultimoArchivoRef = useRef<File | null>(null);

    const handleUpload = async (file: File) => {
        ultimoArchivoRef.current = file;
        setCargando(true);
        setErrorCarga(false);
        try {
            const data = await cargarRutaExcel(file);
            setSesionId(data.sesionId);
            setFechasDisponibles(data.fechasDisponibles);
            setStep("fechas");
        } catch {
            // El interceptor de axios ya mostró el toast con el detalle del
            // backend (422 = Excel inválido). Acá marcamos el flag para que
            // el FileUploader pinte el dropzone en rojo y exponga "Reintentar".
            setErrorCarga(true);
        } finally {
            setCargando(false);
        }
    };

    const handleRetryUpload = () => {
        if (ultimoArchivoRef.current) handleUpload(ultimoArchivoRef.current);
    };

    const handleFechasConfirmadas = async (fechas: string[]) => {
        if (!sesionId) return;
        setCargando(true);
        try {
            const data = await filtrarRutaPorFechas(sesionId, { fechas });
            setRegistros(data);
            setStep("registros");
        } finally {
            setCargando(false);
        }
    };

    const handleExportar = async (registrosCompletados: RegistroRutaDTO[]) => {
        if (!sesionId) return;
        setCargando(true);
        try {
            const blob = await exportarRutaExcel(sesionId, {
                registros: registrosCompletados,
            });
            saveAs(blob, `ruta_${sesionId}.xlsx`);
        } finally {
            setCargando(false);
        }
    };

    const reiniciar = () => {
        setStep("carga");
        setSesionId(null);
        setFechasDisponibles([]);
        setRegistros([]);
        setErrorCarga(false);
        ultimoArchivoRef.current = null;
    };

    return (
        <PageShell>
            <main className="container mx-auto px-4 py-10 max-w-6xl">
                <PageHeader
                    title="Recorrido de ruta"
                    description="Subí el Excel → elegí las fechas → completá los registros y descargá el Excel actualizado."
                    icon={Route}
                    actions={
                        step !== "carga" && (
                            <Button variant="outline" size="sm" onClick={reiniciar}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Empezar de nuevo
                            </Button>
                        )
                    }
                />

                <StepIndicator current={step} />

                <div className="mt-8">
                    {step === "carga" && (
                        <RutaUploadStep
                            onUpload={handleUpload}
                            cargando={cargando}
                            hasError={errorCarga}
                            onRetry={handleRetryUpload}
                        />
                    )}
                    {step === "fechas" && (
                        <RutaFechasStep
                            fechasDisponibles={fechasDisponibles}
                            onContinuar={handleFechasConfirmadas}
                            cargando={cargando}
                        />
                    )}
                    {step === "registros" && (
                        <RutaRegistrosStep
                            registros={registros}
                            onExportar={handleExportar}
                            cargando={cargando}
                        />
                    )}
                </div>
            </main>
        </PageShell>
    );
}

function StepIndicator({ current }: { current: Step }) {
    const steps: { key: Step; label: string; icon: typeof FileUp }[] = [
        { key: "carga", label: "Subir Excel", icon: FileUp },
        { key: "fechas", label: "Elegir fechas", icon: Route },
        { key: "registros", label: "Completar y exportar", icon: Download },
    ];
    const currentIdx = steps.findIndex((s) => s.key === current);

    return (
        <ol className="flex items-center gap-2 sm:gap-4" aria-label="Progreso del flujo">
            {steps.map((s, i) => {
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                const isPending = i > currentIdx;
                return (
                    <li key={s.key} className="flex items-center gap-2 sm:gap-4 flex-1">
                        <div
                            className={`flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm border transition-all ${
                                isActive
                                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                    : isDone
                                      ? "bg-primary/10 text-primary border-primary/30"
                                      : "bg-muted/50 text-muted-foreground border-transparent"
                            }`}
                            aria-current={isActive ? "step" : undefined}
                        >
                            <span
                                className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                                    isActive
                                        ? "bg-primary-foreground text-primary"
                                        : isDone
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted-foreground/20"
                                }`}
                            >
                                {isDone ? <Check className="h-3 w-3" /> : i + 1}
                            </span>
                            <span className="hidden sm:inline font-medium">{s.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`flex-1 h-px ${
                                    isPending ? "bg-border" : "bg-primary/30"
                                }`}
                                aria-hidden="true"
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
