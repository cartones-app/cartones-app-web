"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUploader } from "@/components/FileUploader";
import { WizardStepper } from "@/components/WizardStepper";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useProcesoStore } from "@/store/useProcesoStore";
import { uploadExcel } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
    const router = useRouter();
    const { setProcesoId, setCurrentStep, reset } = useProcesoStore();
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const selectedFileRef = useRef<File | null>(null);

    const handleUpload = async (file: File) => {
        selectedFileRef.current = file;
        setIsLoading(true);
        setHasError(false);

        try {
            const procesoId = await uploadExcel(file);
            setProcesoId(procesoId);
            setCurrentStep(2);
            toast.success("Archivo cargado exitosamente", {
                description: `Proceso ID: ${procesoId}`,
            });
            router.push("/configuracion");
        } catch {
            // Error is handled by axios interceptor
            setHasError(true);
            setIsLoading(false);
        }
    };

    const handleFileSelect = (file: File) => {
        handleUpload(file);
    };

    const handleRetry = () => {
        if (selectedFileRef.current) {
            handleUpload(selectedFileRef.current);
        }
    };

    const handleReset = () => {
        reset();
        setHasError(false);
        selectedFileRef.current = null;
        toast.info("Sesión reiniciada");
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <header className="border-b bg-background/80 backdrop-blur-sm">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary" />
                            <h1 className="font-semibold text-lg">Gestión de Bingos</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/mis-distribuciones">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Mis distribuciones
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reiniciar
                            </Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {/* Wizard Stepper */}
                <div className="container mx-auto px-4 pt-8">
                    <WizardStepper currentStep={1} />
                </div>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-12 flex items-center justify-center">
                    <Card className="w-full max-w-2xl border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl md:text-3xl font-bold">
                                Carga de Datos
                            </CardTitle>
                            <CardDescription className="text-base">
                                Sube tu archivo Excel con la información de los vendedores para comenzar
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FileUploader
                                onFileSelect={handleFileSelect}
                                isLoading={isLoading}
                                hasError={hasError}
                                onRetry={handleRetry}
                            />

                            <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
                                <h3 className="font-medium text-sm mb-2">Formato esperado del archivo:</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Archivo Excel (.xlsx)</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
