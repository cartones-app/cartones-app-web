"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { WizardStepper } from "@/components/WizardStepper";
import { ConfigurationPanel } from "@/components/ConfigurationPanel";
import { Button } from "@/components/ui/button";
import { useProcesoStore } from "@/store/useProcesoStore";
import { getVendedores, simularDistribucion } from "@/lib/api";
import { dateToIsoLocal } from "@/lib/date-format";
import { shortId } from "@/lib/format-id";
import {
    PoolRangeForm,
    RangoCortadoDTO,
    SimulacionRequestDTO,
    VendedorInputDTO,
} from "@/types";

/**
 * ISO 'yyyy-MM-dd' → Date en hora local. Round-trip con
 * {@link dateToIsoLocal} es estable porque ambos lados usan el TZ del browser.
 */
function isoToDate(iso: string | null): Date | undefined {
    if (!iso) return undefined;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
}

/** Date → ISO 'yyyy-MM-dd' local-aware. */
function dateToIso(d: Date | undefined): string | null {
    return d ? dateToIsoLocal(d) : null;
}

export default function ConfiguracionPage() {
    const router = useRouter();
    const {
        procesoId,
        vendedores,
        setVendedores,
        resultados,
        setResultados,
        setCurrentStep,
        config,
        patchConfig,
        reset,
    } = useProcesoStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);
    // Derivado del store: si hay resultados, ya simulamos. Evita race con la
    // hidratación async de zustand/persist en el primer render.
    const hasSimulated = resultados.length > 0;
    const [showResultsPreview, setShowResultsPreview] = useState(resultados.length > 0);

    // La config vive en el store — al volver desde /resultados los rangos /
    // terminaciones / fechas siguen ahí. Las fechas se transportan como Date
    // hacia el panel pero se guardan ISO en el store.
    const fechaSorteoSenete = isoToDate(config.fechaSorteoSenete);
    const fechaSorteoTelebingo = isoToDate(config.fechaSorteoTelebingo);
    const setFechaSorteoSenete = (d: Date | undefined) =>
        patchConfig({ fechaSorteoSenete: dateToIso(d) });
    const setFechaSorteoTelebingo = (d: Date | undefined) =>
        patchConfig({ fechaSorteoTelebingo: dateToIso(d) });
    const setPoolSenete = (poolSenete: PoolRangeForm[]) => patchConfig({ poolSenete });
    const setPoolTelebingo = (poolTelebingo: PoolRangeForm[]) =>
        patchConfig({ poolTelebingo });
    const setMezclar = (mezclar: boolean) => patchConfig({ mezclar });
    const setInicioSeneteGral = (inicioSeneteGral: string) =>
        patchConfig({ inicioSeneteGral });
    const setInicioTelebingoGral = (inicioTelebingoGral: string) =>
        patchConfig({ inicioTelebingoGral });

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
                // Solo inicializar vendedorInputs si no hay nada en el store —
                // si el usuario ya editó terminaciones y vuelve desde /resultados,
                // no las pisamos. Si cambió el procesoId, setProcesoId() ya hizo
                // resetConfig() en el store, así que esto queda vacío y se hidrata.
                const current = useProcesoStore.getState().config.vendedorInputs;
                if (current.length === 0) {
                    patchConfig({
                        vendedorInputs: data.map((v) => ({
                            id: v.id,
                            nombre: v.nombre,
                            cantidadSenete: v.cantidadSenete,
                            cantidadTelebingo: v.cantidadTelebingo,
                            terminacionSenete: null,
                            terminacionTelebingo: null,
                        })),
                    });
                }
            } catch {
                // Error handled by axios interceptor
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendedores();
    }, [procesoId, router, setVendedores, patchConfig]);

    const handleUpdateVendedor = (
        id: number,
        field: keyof VendedorInputDTO,
        value: number | null | undefined
    ) => {
        // getState() en vez del `config` del closure: este handler se pasa al
        // panel hijo y podría ejecutarse con un `config` viejo si React no
        // re-renderiza entre keystrokes consecutivos. Leemos siempre fresco.
        const current = useProcesoStore.getState().config.vendedorInputs;
        patchConfig({
            vendedorInputs: current.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
        });
    };

    const handleSimular = async () => {
        // Build request - no strict validation, let backend decide
        const parseRanges = (ranges: PoolRangeForm[]): RangoCortadoDTO[] => {
            return ranges
                .filter((r) => r.inicio && r.fin)
                .map((r) => ({
                    inicio: Number.parseInt(r.inicio),
                    fin: Number.parseInt(r.fin),
                }));
        };

        const request: SimulacionRequestDTO = {
            poolSenete: parseRanges(config.poolSenete),
            poolTelebingo: parseRanges(config.poolTelebingo),
            vendedores: config.vendedorInputs,
            mezclar: config.mezclar,
            fechaSorteoSenete: config.fechaSorteoSenete,
            fechaSorteoTelebingo: config.fechaSorteoTelebingo,
            // CRITICAL: Use correct JSON keys for backend @JsonProperty mapping
            inicioSenete: config.inicioSeneteGral ? Number.parseInt(config.inicioSeneteGral) : 0,
            inicioTelebingo: config.inicioTelebingoGral ? Number.parseInt(config.inicioTelebingoGral) : 0,
        };

        setIsSimulating(true);
        try {
            const resultados = await simularDistribucion(procesoId!, request);
            setResultados(resultados);
            setCurrentStep(3);
            // hasSimulated se deriva de resultados.length, ya quedó implícito.
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
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            // Durante isSimulating la request está en flight: si el user
                            // resetea ahora, el `setResultados` del handler (que corre
                            // cuando vuelve la respuesta) escribe sobre el store ya
                            // limpio, dejando el wizard en un estado inconsistente
                            // (procesoId=null + resultados con datos del proceso anterior).
                            disabled={isSimulating}
                        >
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
                        poolSenete={config.poolSenete}
                        setPoolSenete={setPoolSenete}
                        poolTelebingo={config.poolTelebingo}
                        setPoolTelebingo={setPoolTelebingo}
                        mezclar={config.mezclar}
                        setMezclar={setMezclar}
                        inicioSeneteGral={config.inicioSeneteGral}
                        setInicioSeneteGral={setInicioSeneteGral}
                        inicioTelebingoGral={config.inicioTelebingoGral}
                        setInicioTelebingoGral={setInicioTelebingoGral}
                        onSimular={handleSimular}
                        isSimulating={isSimulating}
                        hasSimulated={hasSimulated}
                        onVerResultados={handleVerResultados}
                        // Data Props
                        vendedores={vendedores}
                        vendedorInputs={config.vendedorInputs}
                        onUpdateVendedor={handleUpdateVendedor}
                        resultados={resultados}
                        showResultsPreview={showResultsPreview}
                        setShowResultsPreview={setShowResultsPreview}
                    />

                    {/* Action Buttons - Only Back button remains, others moved to sticky bar */}
                    <div className="pt-4">
                        <Button variant="outline" onClick={handleBack} disabled={isSimulating}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}
