"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, Loader2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
    hasError?: boolean;
    onRetry?: () => void;
    accept?: Record<string, string[]>;
}

export function FileUploader({
    onFileSelect,
    isLoading = false,
    hasError = false,
    onRetry,
    accept = {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-excel": [".xls"],
    },
}: FileUploaderProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: { file: File }[]) => {
            setValidationError(null);

            if (rejectedFiles.length > 0) {
                setValidationError("Por favor, selecciona un archivo Excel válido (.xlsx)");
                return;
            }

            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        multiple: false,
        disabled: isLoading,
    });

    const clearFile = () => {
        setSelectedFile(null);
        setValidationError(null);
    };

    const handleRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedFile && onRetry) {
            onRetry();
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer group",
                    isDragActive && !isDragReject && "border-primary bg-primary/5 scale-[1.02]",
                    isDragReject && "border-destructive bg-destructive/5",
                    !isDragActive && !selectedFile && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                    selectedFile && !hasError && "border-primary/50 bg-primary/5",
                    selectedFile && hasError && "border-destructive/50 bg-destructive/5",
                    isLoading && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />

                {/* Background gradient effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex flex-col items-center gap-4 text-center">
                    {isLoading ? (
                        <>
                            <div className="p-4 rounded-full bg-primary/10">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">Procesando archivo...</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Por favor espera mientras subimos tu archivo
                                </p>
                            </div>
                        </>
                    ) : selectedFile ? (
                        <>
                            <div className={cn(
                                "p-4 rounded-full",
                                hasError ? "bg-destructive/10" : "bg-primary/10"
                            )}>
                                <FileSpreadsheet className={cn(
                                    "h-10 w-10",
                                    hasError ? "text-destructive" : "text-primary"
                                )} />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 mt-2">
                                {hasError && onRetry && (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleRetry}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Reintentar con el mismo archivo
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFile();
                                    }}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Cambiar archivo
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">
                                    {isDragActive ? "Suelta el archivo aquí" : "Arrastra y suelta tu archivo Excel"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    o haz clic para seleccionar un archivo .xlsx
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {validationError && (
                <p className="mt-3 text-sm text-destructive text-center">{validationError}</p>
            )}

            {hasError && selectedFile && (
                <p className="mt-3 text-sm text-destructive text-center">
                    Error al procesar el archivo. Puedes reintentar o seleccionar otro archivo.
                </p>
            )}
        </div>
    );
}
