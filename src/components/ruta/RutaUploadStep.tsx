"use client";

import { FileUploader } from "@/components/FileUploader";

interface RutaUploadStepProps {
    onUpload: (file: File) => void;
    cargando: boolean;
}

export function RutaUploadStep({ onUpload, cargando }: RutaUploadStepProps) {
    return (
        <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-medium mb-1">Subí el Excel de ruta</h2>
            <p className="text-sm text-muted-foreground mb-4">
                El archivo debe tener las columnas <strong>FECHA</strong> y <strong>VENDEDOR</strong>. Las filas
                con vendedor marcado en rojo o en la lista de exclusiones del admin se ignoran automáticamente.
            </p>
            <FileUploader onFileSelect={onUpload} isLoading={cargando} />
        </div>
    );
}
