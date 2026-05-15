import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export default function MisDistribucionesLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.mis-distribuciones.enabled">{children}</PageFlagGate>;
}
