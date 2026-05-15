import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    PoolRangeForm,
    VendedorInputDTO,
    VendedorResponseDTO,
    VendedorSimuladoDTO,
} from '@/types';

/**
 * Estado de la configuración del wizard. Vive en memoria (sin localStorage)
 * para sobrevivir navegación entre /configuracion y /resultados sin que el
 * usuario pierda sus rangos / fechas / terminaciones al ir y volver.
 *
 * Fecha como ISO `yyyy-MM-dd` (no Date) — Date no serializa limpio si
 * en algún momento queremos persistir, y los components ya parsean a Date
 * en su capa.
 */
export interface ConfigState {
    fechaSorteoSenete: string | null;
    fechaSorteoTelebingo: string | null;
    poolSenete: PoolRangeForm[];
    poolTelebingo: PoolRangeForm[];
    mezclar: boolean;
    vendedorInputs: VendedorInputDTO[];
    inicioSeneteGral: string;
    inicioTelebingoGral: string;
}

const emptyConfig: ConfigState = {
    fechaSorteoSenete: null,
    fechaSorteoTelebingo: null,
    poolSenete: [],
    poolTelebingo: [],
    mezclar: true,
    vendedorInputs: [],
    inicioSeneteGral: '',
    inicioTelebingoGral: '',
};

interface ProcesoState {
    // Session data
    procesoId: string | null;
    vendedores: VendedorResponseDTO[];
    resultados: VendedorSimuladoDTO[];
    config: ConfigState;

    // Current wizard step
    currentStep: number;

    // Actions
    setProcesoId: (id: string) => void;
    setVendedores: (vendedores: VendedorResponseDTO[]) => void;
    setResultados: (resultados: VendedorSimuladoDTO[]) => void;
    setCurrentStep: (step: number) => void;
    /** Actualiza parcialmente la config. No pisa fields que no se pasen. */
    patchConfig: (patch: Partial<ConfigState>) => void;
    resetConfig: () => void;
    reset: () => void;
}

const initialState = {
    procesoId: null,
    vendedores: [],
    resultados: [],
    config: emptyConfig,
    currentStep: 1,
};

export const useProcesoStore = create<ProcesoState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setProcesoId: (id) => {
                // Si arranca un proceso nuevo, descartar la config del anterior —
                // si no, el usuario subiría un Excel distinto y vería los rangos /
                // terminaciones del proceso previo, lo que es muy confuso.
                const prev = get().procesoId;
                if (prev && prev !== id) {
                    set({
                        procesoId: id,
                        vendedores: [],
                        resultados: [],
                        config: emptyConfig,
                    });
                } else {
                    set({ procesoId: id });
                }
            },

            setVendedores: (vendedores) => set({ vendedores }),

            setResultados: (resultados) => set({ resultados }),

            setCurrentStep: (step) => set({ currentStep: step }),

            patchConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),

            resetConfig: () => set({ config: emptyConfig }),

            reset: () => set(initialState),
        }),
        {
            name: 'proceso-storage',
            partialize: (state) => ({
                procesoId: state.procesoId,
                currentStep: state.currentStep,
            }),
        }
    )
);
