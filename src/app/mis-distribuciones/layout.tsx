import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";
import { requireSesion } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Mis distribuciones" };

export default async function MisDistribucionesLayout({ children }: Readonly<{ children: ReactNode }>) {
    await requireSesion("/mis-distribuciones");
    return <PageFlagGate flag="page.mis-distribuciones.enabled">{children}</PageFlagGate>;
}
