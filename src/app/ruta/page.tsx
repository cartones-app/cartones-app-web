"use client";

import { useState } from "react";
import Link from "next/link";
import { saveAs } from "file-saver";
import { ArrowLeft, Download, FileUp, RefreshCw, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Volver al inicio
                </Link>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Route className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-semibold">Recorrido de ruta</h1>
                    </div>
                    {step !== "carga" && (
                        <Button variant="outline" size="sm" onClick={reiniciar}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Empezar de nuevo
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    Subí el Excel → elegí las fechas → completá los registros y descargá el Excel actualizado.
                </p>
            </div>

            <StepIndicator current={step} />

            <div className="mt-6">
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
        <ol className="flex items-center gap-2" aria-label="Progreso del flujo">
            {steps.map((s, i) => {
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                    <li
                        key={s.key}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border ${
                            isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : isDone
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : "bg-muted text-muted-foreground border-transparent"
                        }`}
                        aria-current={isActive ? "step" : undefined}
                    >
                        <s.icon className="h-3 w-3" aria-hidden="true" />
                        <span className="hidden sm:inline">{s.label}</span>
                        <span className="sm:hidden">{i + 1}</span>
                    </li>
                );
            })}
        </ol>
    );
}
