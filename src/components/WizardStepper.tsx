"use client";

import { cn } from "@/lib/utils";
import { Check, Upload, Settings, FileText } from "lucide-react";

interface WizardStepperProps {
    currentStep: number;
}

const steps = [
    { number: 1, label: "Carga de Datos", icon: Upload },
    { number: 2, label: "Configuración", icon: Settings },
    { number: 3, label: "Resultados", icon: FileText },
];

export function WizardStepper({ currentStep }: WizardStepperProps) {
    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-center gap-2 md:gap-4">
                {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = currentStep > step.number;
                    const isCurrent = currentStep === step.number;

                    return (
                        <div key={step.number} className="flex items-center">
                            {/* Step indicator */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                                        isCompleted && "bg-primary border-primary text-primary-foreground",
                                        isCurrent && "border-primary bg-primary/10 text-primary",
                                        !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground/50"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="h-5 w-5 md:h-6 md:w-6" />
                                    ) : (
                                        <StepIcon className="h-5 w-5 md:h-6 md:w-6" />
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "mt-2 text-xs md:text-sm font-medium transition-colors",
                                        isCurrent && "text-primary",
                                        isCompleted && "text-primary",
                                        !isCompleted && !isCurrent && "text-muted-foreground/50"
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "mx-2 md:mx-4 h-0.5 w-8 md:w-16 lg:w-24 transition-colors duration-300",
                                        currentStep > step.number ? "bg-primary" : "bg-muted-foreground/30"
                                    )}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
