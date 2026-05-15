"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { WizardStepper } from "@/components/WizardStepper";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { Button } from "@/components/ui/button";
import { useProcesoStore } from "@/store/useProcesoStore";
import { getVendedores, simularDistribucion } from "@/lib/api";
import { shortId } from "@/lib/format-id";
import {
    PoolRangeForm,
    RangoCortadoDTO,
    SimulacionRequestDTO,
    VendedorInputDTO,
} from "@/types";

export default function ConfiguracionPage() {
    const router = useRouter();
    const {
        procesoId,
        vendedores,
        setVendedores,
        resultados,
        setResultados,
        setCurrentStep,
        reset,
    } = useProcesoStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    const [hasSimulated, setHasSimulated] = useState(false);
    const [showResultsPreview, setShowResultsPreview] = useState(false);

    // Configuration state
    const [fechaSorteoSenete, setFechaSorteoSenete] = useState<Date | undefined>(undefined);
    const [fechaSorteoTelebingo, setFechaSorteoTelebingo] = useState<Date | undefined>(undefined);
    const [poolSenete, setPoolSenete] = useState<PoolRangeForm[]>([]);
    const [poolTelebingo, setPoolTelebingo] = useState<PoolRangeForm[]>([]);
    const [mezclar, setMezclar] = useState(true);
    const [vendedorInputs, setVendedorInputs] = useState<VendedorInputDTO[]>([]);
    const [inicioSeneteGral, setInicioSeneteGral] = useState<string>("");
    const [inicioTelebingoGral, setInicioTelebingoGral] = useState<string>("");

    // Redirect if no procesoId
    useEffect(() => {
        if (!procesoId) {
            toast.warning("No hay un proceso activo");
            router.push("/upload");
            return;
        }

        // Fetch vendedores
        const fetchVendedores = async () => {
            try {
                const data = await getVendedores(procesoId);
                setVendedores(data);
                // Initialize vendedorInputs from the response
                setVendedorInputs(
                    data.map((v) => ({
                        id: v.id,
                        nombre: v.nombre,
                        cantidadSenete: v.cantidadSenete,
                        cantidadTelebingo: v.cantidadTelebingo,
                        terminacionSenete: null,
                        terminacionTelebingo: null,
                    }))
                );
            } catch {
                // Error handled by axios interceptor
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendedores();
    }, [procesoId, router, setVendedores]);

    const handleUpdateVendedor = (
        id: number,
        field: keyof VendedorInputDTO,
        value: number | null | undefined
    ) => {
        setVendedorInputs((prev) =>
            prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
        );
    };

    const handleSimular = async () => {
        // Build request - no strict validation, let backend decide
        const parseRanges = (ranges: PoolRangeForm[]): RangoCortadoDTO[] => {
            return ranges
                .filter((r) => r.inicio && r.fin)
                .map((r) => ({
                    inicio: parseInt(r.inicio),
                    fin: parseInt(r.fin),
                }));
        };

        const request: SimulacionRequestDTO = {
            poolSenete: parseRanges(poolSenete),
            poolTelebingo: parseRanges(poolTelebingo),
            vendedores: vendedorInputs,
            mezclar,
            // Send null if no date selected, not empty string
            fechaSorteoSenete: fechaSorteoSenete ? format(fechaSorteoSenete, "yyyy-MM-dd") : null,
            fechaSorteoTelebingo: fechaSorteoTelebingo ? format(fechaSorteoTelebingo, "yyyy-MM-dd") : null,
            // CRITICAL: Use correct JSON keys for backend @JsonProperty mapping
            inicioSenete: inicioSeneteGral ? parseInt(inicioSeneteGral) : 0,
            inicioTelebingo: inicioTelebingoGral ? parseInt(inicioTelebingoGral) : 0,
        };

        setIsSimulating(true);
        try {
            const resultados = await simularDistribucion(procesoId!, request);
            setResultados(resultados);
            setCurrentStep(3);
            setHasSimulated(true);
            setShowResultsPreview(true);
            toast.success("Simulación completada", {
                description: "Revisa los resultados asignados en la tabla inferior.",
            });
        } catch {
            // Error handled by axios interceptor
            // Button remains enabled for retry
        } finally {
            setIsSimulating(false);
        }
    };

    const handleVerResultados = () => {
        router.push("/resultados");
    };

    const handleBack = () => {
        router.push("/upload");
    };

    const handleReset = () => {
        reset();
        toast.info("Sesión reiniciada");
        router.push("/upload");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="relative">
                <div className="container mx-auto px-4 pt-8 flex items-center justify-between gap-2 flex-wrap">
                    <WizardStepper currentStep={2} />
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                            Proceso: {shortId(procesoId)}
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reiniciar
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8 space-y-6">
                    <ConfigurationPanel
                        fechaSorteoSenete={fechaSorteoSenete}
                        setFechaSorteoSenete={setFechaSorteoSenete}
                        fechaSorteoTelebingo={fechaSorteoTelebingo}
                        setFechaSorteoTelebingo={setFechaSorteoTelebingo}
                        poolSenete={poolSenete}
                        setPoolSenete={setPoolSenete}
                        poolTelebingo={poolTelebingo}
                        setPoolTelebingo={setPoolTelebingo}
                        mezclar={mezclar}
                        setMezclar={setMezclar}
                        inicioSeneteGral={inicioSeneteGral}
                        setInicioSeneteGral={setInicioSeneteGral}
                        inicioTelebingoGral={inicioTelebingoGral}
                        setInicioTelebingoGral={setInicioTelebingoGral}
                        onSimular={handleSimular}
                        isSimulating={isSimulating}
                        hasSimulated={hasSimulated}
                        onVerResultados={handleVerResultados}
                        // Data Props
                        vendedores={vendedores}
                        vendedorInputs={vendedorInputs}
                        onUpdateVendedor={handleUpdateVendedor}
                        resultados={resultados}
                        showResultsPreview={showResultsPreview}
                        setShowResultsPreview={setShowResultsPreview}
                    />

                    {/* Action Buttons - Only Back button remains, others moved to sticky bar */}
                    <div className="pt-4">
                        <Button variant="outline" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}
