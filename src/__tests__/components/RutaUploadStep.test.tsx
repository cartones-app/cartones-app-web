import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RutaUploadStep } from "@/components/ruta/RutaUploadStep";

// Mockeamos el FileUploader: no nos importa el dropzone real (eso lo cubren
// sus propios tests), solo que RutaUploadStep le pase correctamente los props
// hasError + onRetry — el bug original era que NO se propagaban y el dropzone
// volvía a estado neutro tras un 422 sin avisarle al usuario.
vi.mock("@/components/FileUploader", () => ({
    FileUploader: (props: { hasError: boolean; onRetry: () => void }) => (
        <div>
            <span data-testid="has-error">{String(props.hasError)}</span>
            <button onClick={props.onRetry}>retry-stub</button>
        </div>
    ),
}));

describe("RutaUploadStep", () => {
    it("propaga hasError=true al FileUploader", () => {
        render(
            <RutaUploadStep
                onUpload={() => {}}
                cargando={false}
                hasError
                onRetry={() => {}}
            />,
        );
        expect(screen.getByTestId("has-error").textContent).toBe("true");
    });

    it("propaga hasError=false al FileUploader", () => {
        render(
            <RutaUploadStep
                onUpload={() => {}}
                cargando={false}
                hasError={false}
                onRetry={() => {}}
            />,
        );
        expect(screen.getByTestId("has-error").textContent).toBe("false");
    });

    it("propaga onRetry al FileUploader", () => {
        const onRetry = vi.fn();
        render(
            <RutaUploadStep
                onUpload={() => {}}
                cargando={false}
                hasError
                onRetry={onRetry}
            />,
        );
        fireEvent.click(screen.getByText("retry-stub"));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
