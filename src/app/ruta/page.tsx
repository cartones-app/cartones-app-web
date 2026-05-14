"use client";

import { useState } from "react";
import Link from "next/link";
import { saveAs } from "file-saver";
import { ArrowLeft, Check, Download, FileUp, RefreshCw, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
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

    const handleUpload = async (file: File) => {
        setCargando(true);
        try {
            const data = await cargarRutaExcel(file);
            setSesionId(data.sesionId);
            setFechasDisponibles(data.fechasDisponibles);
            setStep("fechas");
        } finally {
            setCargando(false);
        }
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
    };

    return (
        <PageShell>
            <main className="container mx-auto px-4 py-10 max-w-6xl">
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Volver al inicio
                    </Link>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                    <Route className="h-5 w-5 text-primary" />
                                </div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recorrido de ruta</h1>
                            </div>
                            <p className="text-muted-foreground">
                                Subí el Excel → elegí las fechas → completá los registros y descargá el Excel actualizado.
                            </p>
                        </div>
                        {step !== "carga" && (
                            <Button variant="outline" size="sm" onClick={reiniciar}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Empezar de nuevo
                            </Button>
                        )}
                    </div>
                </div>

                <StepIndicator current={step} />

                <div className="mt-8">
                    {step === "carga" && (
                        <RutaUploadStep onUpload={handleUpload} cargando={cargando} />
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
