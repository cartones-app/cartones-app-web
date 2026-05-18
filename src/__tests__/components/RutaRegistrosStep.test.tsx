import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RutaRegistrosStep } from "@/components/ruta/RutaRegistrosStep";
import type { RegistroRutaDTO } from "@/types";

function reg(over: Partial<RegistroRutaDTO> = {}): RegistroRutaDTO {
    return {
        vendedorId: 1,
        nombre: "Test",
        fecha: "2026-05-18",
        deudaAnterior: 0,
        numeroFila: 1,
        seneteTotalEnviado: null,
        telebingoTotalEnviado: null,
        refSenete: null,
        refTelb: null,
        devSen: null,
        devTelb: null,
        pago1: null,
        pago2: null,
        nota: "",
        ...over,
    };
}

describe("RutaRegistrosStep — feedback de exportación", () => {
    it("sin errorExportar, el botón dice 'Exportar Excel'", () => {
        render(
            <RutaRegistrosStep
                registros={[reg()]}
                onExportar={() => {}}
                cargando={false}
                errorExportar={false}
            />,
        );
        expect(screen.getByRole("button", { name: /exportar excel/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /reintentar exportación/i })).not.toBeInTheDocument();
    });

    it("con errorExportar=true, el botón pasa a 'Reintentar exportación' y aparece cartel inline", () => {
        // El bug original: tras un 422 el botón quedaba como si nada y el user
        // hacía spam click sin entender qué pasó.
        render(
            <RutaRegistrosStep
                registros={[reg()]}
                onExportar={() => {}}
                cargando={false}
                errorExportar
            />,
        );
        expect(screen.getByRole("button", { name: /reintentar exportación/i })).toBeInTheDocument();
        expect(screen.getByText(/no se pudo exportar el excel/i)).toBeInTheDocument();
    });

    it("durante cargando el cartel de error no se muestra (evita pisar el spinner)", () => {
        render(
            <RutaRegistrosStep
                registros={[reg()]}
                onExportar={() => {}}
                cargando
                errorExportar
            />,
        );
        expect(screen.queryByText(/no se pudo exportar el excel/i)).not.toBeInTheDocument();
    });

    it("click en el botón llama onExportar con los registros actuales", () => {
        const onExportar = vi.fn();
        render(
            <RutaRegistrosStep
                registros={[reg({ vendedorId: 7 }), reg({ vendedorId: 8 })]}
                onExportar={onExportar}
                cargando={false}
                errorExportar={false}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: /exportar excel/i }));
        expect(onExportar).toHaveBeenCalledTimes(1);
        const enviado = onExportar.mock.calls[0][0] as RegistroRutaDTO[];
        expect(enviado).toHaveLength(2);
        expect(enviado[0].vendedorId).toBe(7);
        expect(enviado[1].vendedorId).toBe(8);
    });
});
