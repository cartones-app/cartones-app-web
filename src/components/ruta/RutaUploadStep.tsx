"use client";

import { FileUploader } from "@/components/FileUploader";

interface RutaUploadStepProps {
    onUpload: (file: File) => void;
    cargando: boolean;
    /**
     * Indica al uploader que la última carga falló. Sin esto, tras un 422 del
     * backend, el dropzone vuelve a estado "listo" sin distinción visual y el
     * usuario no sabe si tiene que reintentar o tocar otra cosa.
     */
    hasError: boolean;
    /** Reintenta el upload con el último archivo seleccionado. */
    onRetry: () => void;
}

export function RutaUploadStep({ onUpload, cargando, hasError, onRetry }: RutaUploadStepProps) {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium mb-1">Subí el Excel de ruta</h2>
            <p className="text-sm text-muted-foreground mb-4">
                El archivo debe tener las columnas <strong>FECHA</strong> y <strong>VENDEDOR</strong>. Las filas
                con vendedor marcado en rojo o en la lista de exclusiones del admin se ignoran automáticamente.
            </p>
            <FileUploader
                onFileSelect={onUpload}
                isLoading={cargando}
                hasError={hasError}
                onRetry={onRetry}
            />
        </div>
    );
}
