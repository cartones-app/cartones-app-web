import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProcesoStore } from "@/store/useProcesoStore";
import * as api from "@/lib/api";
import type { VendedorResponseDTO, VendedorSimuladoDTO } from "@/types";

// El store llama abandonarProceso() fire-and-forget desde reset() cuando hay
// un procesoId activo no completado. Lo mockeamos para no pegarle a axios.
vi.mock("@/lib/api", () => ({
    abandonarProceso: vi.fn().mockResolvedValue(undefined),
}));

/**
 * Tests del store de wizard. Aislamiento entre tests:
 * - Reset del state al estado inicial via la action `reset`.
 * - Clear de localStorage para que el middleware `persist` no rehidrate state
 *   entre tests (el wrapper de zustand persist serializa al storage en cada
 *   set y restaura en mount; en jsdom el localStorage es por-suite).
 */
beforeEach(() => {
    localStorage.clear();
    useProcesoStore.getState().reset();
    vi.mocked(api.abandonarProceso).mockClear();
});

describe("useProcesoStore — estado inicial", () => {
    it("arranca con valores por defecto", () => {
        const s = useProcesoStore.getState();
        expect(s.procesoId).toBeNull();
        expect(s.vendedores).toEqual([]);
        expect(s.resultados).toEqual([]);
        expect(s.currentStep).toBe(1);
        expect(s.procesoCompletado).toBe(false);
        expect(s.config.mezclar).toBe(true);
        expect(s.config.poolSenete).toEqual([]);
        expect(s.config.fechaSorteoSenete).toBeNull();
    });
});

describe("useProcesoStore — setProcesoId", () => {
    it("setea procesoId desde null sin tocar el resto", () => {
        useProcesoStore.getState().patchConfig({ mezclar: false });
        useProcesoStore.getState().setProcesoId("p1");
        const s = useProcesoStore.getState();
        expect(s.procesoId).toBe("p1");
        // primer seteo (prev null) NO debe descartar config previa
        expect(s.config.mezclar).toBe(false);
    });

    it("no resetea si se vuelve a setear el MISMO id", () => {
        useProcesoStore.getState().setProcesoId("p1");
        useProcesoStore.getState().patchConfig({ mezclar: false });
        useProcesoStore.getState().setProcesoId("p1");
        expect(useProcesoStore.getState().config.mezclar).toBe(false);
    });

    it("descarta config/vendedores/resultados al cambiar a otro id", () => {
        const vendedores = [{ id: 1 } as unknown as VendedorResponseDTO];
        const resultados = [{ id: 1 } as unknown as VendedorSimuladoDTO];
        useProcesoStore.getState().setProcesoId("p1");
        useProcesoStore.getState().patchConfig({ mezclar: false });
        useProcesoStore.getState().setVendedores(vendedores);
        useProcesoStore.getState().setResultados(resultados);
        useProcesoStore.getState().marcarProcesoCompletado();

        useProcesoStore.getState().setProcesoId("p2");

        const s = useProcesoStore.getState();
        expect(s.procesoId).toBe("p2");
        expect(s.vendedores).toEqual([]);
        expect(s.resultados).toEqual([]);
        expect(s.config.mezclar).toBe(true);
        expect(s.procesoCompletado).toBe(false);
    });
});

describe("useProcesoStore — patchConfig", () => {
    it("merge parcial sin pisar campos no incluidos", () => {
        useProcesoStore.getState().patchConfig({ fechaSorteoSenete: "2026-05-16" });
        useProcesoStore.getState().patchConfig({ mezclar: false });
        const c = useProcesoStore.getState().config;
        expect(c.fechaSorteoSenete).toBe("2026-05-16");
        expect(c.mezclar).toBe(false);
        // defaults intactos
        expect(c.poolSenete).toEqual([]);
        expect(c.inicioSeneteGral).toBe("");
    });
});

describe("useProcesoStore — resetConfig vs reset", () => {
    it("resetConfig limpia solo la config", () => {
        useProcesoStore.getState().setProcesoId("p1");
        useProcesoStore.getState().setCurrentStep(3);
        useProcesoStore.getState().patchConfig({ mezclar: false });
        useProcesoStore.getState().resetConfig();
        const s = useProcesoStore.getState();
        expect(s.config.mezclar).toBe(true);
        expect(s.procesoId).toBe("p1");
        expect(s.currentStep).toBe(3);
    });

    it("reset vuelve al initialState completo", () => {
        useProcesoStore.getState().setProcesoId("p1");
        useProcesoStore.getState().setCurrentStep(4);
        useProcesoStore.getState().marcarProcesoCompletado();
        useProcesoStore.getState().reset();
        const s = useProcesoStore.getState();
        expect(s.procesoId).toBeNull();
        expect(s.currentStep).toBe(1);
        expect(s.procesoCompletado).toBe(false);
    });
});

describe("useProcesoStore — reset dispara abandonarProceso", () => {
    it("avisa al backend si hay procesoId y NO está completado", () => {
        useProcesoStore.getState().setProcesoId("p-ab");
        vi.mocked(api.abandonarProceso).mockClear();
        useProcesoStore.getState().reset();
        expect(api.abandonarProceso).toHaveBeenCalledWith("p-ab");
    });

    it("no llama al backend si el proceso ya está completado", () => {
        useProcesoStore.getState().setProcesoId("p-done");
        useProcesoStore.getState().marcarProcesoCompletado();
        vi.mocked(api.abandonarProceso).mockClear();
        useProcesoStore.getState().reset();
        expect(api.abandonarProceso).not.toHaveBeenCalled();
    });

    it("no llama al backend si no hay procesoId", () => {
        vi.mocked(api.abandonarProceso).mockClear();
        useProcesoStore.getState().reset();
        expect(api.abandonarProceso).not.toHaveBeenCalled();
    });

    it("ignora errores del backend sin romper el reset local", () => {
        useProcesoStore.getState().setProcesoId("p-fail");
        vi.mocked(api.abandonarProceso).mockRejectedValueOnce(new Error("422"));
        expect(() => useProcesoStore.getState().reset()).not.toThrow();
        expect(useProcesoStore.getState().procesoId).toBeNull();
    });
});

describe("useProcesoStore — flags de paso/completado", () => {
    it("setCurrentStep / marcarProcesoCompletado", () => {
        useProcesoStore.getState().setCurrentStep(2);
        expect(useProcesoStore.getState().currentStep).toBe(2);
        useProcesoStore.getState().marcarProcesoCompletado();
        expect(useProcesoStore.getState().procesoCompletado).toBe(true);
    });
});
