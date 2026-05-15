import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export default function ConfiguracionLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.configuracion.enabled">{children}</PageFlagGate>;
}
