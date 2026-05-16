import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export const metadata: Metadata = { title: "Recorrido de ruta" };

export default function RutaLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.ruta.enabled">{children}</PageFlagGate>;
}
