import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";

describe("ConfirmDialog", () => {
    it("no llama onConfirm si el user cancela", async () => {
        const onConfirm = vi.fn();
        render(
            <ConfirmDialog
                title="¿Eliminar?"
                description="Sin retorno"
                onConfirm={onConfirm}
                trigger={<Button>Borrar</Button>}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
        // El diálogo se monta en un portal; esperamos a que aparezca el contenido.
        const cancelar = await screen.findByRole("button", { name: /cancelar/i });
        fireEvent.click(cancelar);
        // Tras cancelar, onConfirm jamás debe haberse llamado.
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("invoca onConfirm cuando el user confirma", async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(
            <ConfirmDialog
                title="¿Eliminar?"
                description="Sin retorno"
                confirmLabel="Eliminar"
                destructive
                onConfirm={onConfirm}
                trigger={<Button>Borrar</Button>}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
        const confirmar = await screen.findByRole("button", { name: /eliminar/i });
        fireEvent.click(confirmar);

        await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    });

    it("deshabilita los botones mientras el handler async está pendiente", async () => {
        // Promise controlada manualmente — la resolvemos al final para que el
        // handler "se quede colgado" mientras inspeccionamos los disabled.
        const deferred: { resolve: () => void; promise: Promise<void> } = {
            resolve: () => {},
            promise: Promise.resolve(),
        };
        deferred.promise = new Promise<void>((res) => {
            deferred.resolve = res;
        });
        const onConfirm = vi.fn().mockReturnValue(deferred.promise);

        render(
            <ConfirmDialog
                title="¿Eliminar?"
                description="Sin retorno"
                onConfirm={onConfirm}
                trigger={<Button>Borrar</Button>}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
        const confirmar = await screen.findByRole("button", { name: /confirmar/i });
        const cancelar = screen.getByRole("button", { name: /cancelar/i });
        fireEvent.click(confirmar);

        // Pending state: ambos botones deben quedar disabled para evitar doble click.
        await waitFor(() => expect(confirmar).toBeDisabled());
        expect(cancelar).toBeDisabled();

        deferred.resolve();
        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    });

    it("cierra el diálogo aunque el handler async falle (no atrapa al usuario)", async () => {
        const onConfirm = vi.fn().mockRejectedValue(new Error("backend tira 500"));
        render(
            <ConfirmDialog
                title="¿Eliminar?"
                description="Sin retorno"
                onConfirm={onConfirm}
                trigger={<Button>Borrar</Button>}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Borrar" }));
        const confirmar = await screen.findByRole("button", { name: /confirmar/i });
        fireEvent.click(confirmar);

        await waitFor(() => expect(onConfirm).toHaveBeenCalled());
        // El contenido del dialog desaparece tras el fallo (el caller normalmente
        // muestra el toast vía interceptor axios; acá basta con que cerremos).
        await waitFor(() =>
            expect(screen.queryByRole("button", { name: /confirmar/i })).not.toBeInTheDocument(),
        );
    });
});
