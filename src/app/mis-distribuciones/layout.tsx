import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export const metadata: Metadata = { title: "Mis distribuciones" };

export default function MisDistribucionesLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.mis-distribuciones.enabled">{children}</PageFlagGate>;
}
