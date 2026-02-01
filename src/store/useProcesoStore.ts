import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { VendedorResponseDTO, VendedorSimuladoDTO } from '@/types';

interface ProcesoState {
    // Session data
    procesoId: string | null;
    vendedores: VendedorResponseDTO[];
    resultados: VendedorSimuladoDTO[];

    // Current wizard step
    currentStep: number;

    // Actions
    setProcesoId: (id: string) => void;
    setVendedores: (vendedores: VendedorResponseDTO[]) => void;
    setResultados: (resultados: VendedorSimuladoDTO[]) => void;
    setCurrentStep: (step: number) => void;
    reset: () => void;
}

const initialState = {
    procesoId: null,
    vendedores: [],
    resultados: [],
    currentStep: 1,
};

export const useProcesoStore = create<ProcesoState>()(
    persist(
        (set) => ({
            ...initialState,

            setProcesoId: (id) => set({ procesoId: id }),

            setVendedores: (vendedores) => set({ vendedores }),

            setResultados: (resultados) => set({ resultados }),

            setCurrentStep: (step) => set({ currentStep: step }),

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
