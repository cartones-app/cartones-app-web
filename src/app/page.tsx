"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProcesoStore } from "@/store/useProcesoStore";

export default function Home() {
  const router = useRouter();
  const { procesoId, currentStep } = useProcesoStore();

  useEffect(() => {
    // If there's an active proceso, redirect to the appropriate step
    if (procesoId) {
      if (currentStep === 2) {
        router.push("/configuracion");
      } else if (currentStep === 3) {
        router.push("/resultados");
      } else {
        router.push("/upload");
      }
    } else {
      router.push("/upload");
    }
  }, [procesoId, currentStep, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Cargando...</div>
    </div>
  );
}
