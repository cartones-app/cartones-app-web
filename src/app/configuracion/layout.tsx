import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracionLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.configuracion.enabled">{children}</PageFlagGate>;
}
