"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { WizardStepper } from "@/components/WizardStepper";
import { ResultsTable } from "@/components/ResultsTable";
import { PdfDownloader } from "@/components/PdfDownloader";
import { useProcesoStore } from "@/store/useProcesoStore";
import { shortId } from "@/lib/format-id";

export default function ResultadosPage() {
    const router = useRouter();
    const { procesoId, resultados, reset } = useProcesoStore();

    // Redirect if no procesoId or results
    useEffect(() => {
        if (!procesoId) {
            toast.warning("No hay un proceso activo");
            router.push("/upload");
            return;
        }

        if (resultados.length === 0) {
            toast.warning("No hay resultados disponibles");
            router.push("/configuracion");
            return;
        }
    }, [procesoId, resultados, router]);

    const handleBack = () => {
        router.push("/configuracion");
    };

    const handleNewProcess = () => {
        reset();
        toast.success("Iniciando nuevo proceso");
        router.push("/upload");
    };

    if (!procesoId || resultados.length === 0) {
        return null;
    }

    return (
        <div className="relative overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative">
                <div className="container mx-auto px-4 pt-8 flex items-center justify-between gap-2 flex-wrap">
                    <WizardStepper currentStep={3} />
                    <span className="text-xs text-muted-foreground hidden sm:block">
                        Proceso: {shortId(procesoId)}
                    </span>
                </div>

                {/* Success Banner */}
                <div className="container mx-auto px-4 pt-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        <div>
                            <h2 className="font-medium text-emerald-600 dark:text-emerald-400">
                                Simulación completada exitosamente
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Se han asignado los rangos a {resultados.length} vendedores
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8 space-y-6">
                    <ResultsTable resultados={resultados} />

                    <PdfDownloader
                        procesoId={procesoId}
                        onBack={handleBack}
                        onReset={handleNewProcess}
                    />
                </main>
            </div>
        </div>
    );
}
