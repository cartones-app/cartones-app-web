import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export default function RutaLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.ruta.enabled">{children}</PageFlagGate>;
}
