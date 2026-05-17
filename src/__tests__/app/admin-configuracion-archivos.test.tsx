import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Page from "@/app/admin/configuracion-archivos/page";

vi.mock("@/lib/api", () => ({
    obtenerConfiguracionArchivos: vi.fn(),
    actualizarConfiguracionArchivos: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

describe("AdminConfiguracionArchivosPage", () => {
    it("carga la config y poblé los controles con valores actuales", async () => {
        const api = await import("@/lib/api");
        vi.mocked(api.obtenerConfiguracionArchivos).mockResolvedValue({
            retencionMeses: 6,
            eliminacionActiva: true,
            updatedAt: "2026-05-17T10:00:00",
            modifiedBy: "admin",
        });

        render(<Page />);

        await waitFor(() => {
            const input = screen.getByLabelText(/meses de retenci/i) as HTMLInputElement;
            expect(input.value).toBe("6");
        });
        expect(screen.getByLabelText(/eliminaci.n autom.tica/i)).toBeChecked();
    });

    it("guardar es disabled si el valor no es válido (fuera de [1, 120])", async () => {
        const api = await import("@/lib/api");
        vi.mocked(api.obtenerConfiguracionArchivos).mockResolvedValue({
            retencionMeses: 3,
            eliminacionActiva: true,
            updatedAt: "2026-05-17T10:00:00",
            modifiedBy: null,
        });

        render(<Page />);
        const input = await screen.findByLabelText(/meses de retenci/i);
        fireEvent.change(input, { target: { value: "0" } });
        expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();

        fireEvent.change(input, { target: { value: "121" } });
        expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();

        fireEvent.change(input, { target: { value: "12" } });
        expect(screen.getByRole("button", { name: /guardar/i })).not.toBeDisabled();
    });

    it("guarda con PUT cuando se confirma un cambio válido", async () => {
        const api = await import("@/lib/api");
        vi.mocked(api.obtenerConfiguracionArchivos).mockResolvedValue({
            retencionMeses: 3,
            eliminacionActiva: true,
            updatedAt: "2026-05-17T10:00:00",
            modifiedBy: null,
        });
        const putSpy = vi.mocked(api.actualizarConfiguracionArchivos);
        putSpy.mockResolvedValue({
            retencionMeses: 12,
            eliminacionActiva: false,
            updatedAt: "2026-05-17T10:30:00",
            modifiedBy: "admin",
        });

        render(<Page />);
        const input = await screen.findByLabelText(/meses de retenci/i);
        fireEvent.change(input, { target: { value: "12" } });
        const switchEl = screen.getByLabelText(/eliminaci.n autom.tica/i);
        fireEvent.click(switchEl);

        fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

        await waitFor(() =>
            expect(putSpy).toHaveBeenCalledWith({
                retencionMeses: 12,
                eliminacionActiva: false,
            }),
        );
    });
});
