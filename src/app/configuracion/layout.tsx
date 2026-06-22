import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";
import { requireSesion } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionLayout({ children }: Readonly<{ children: ReactNode }>) {
    await requireSesion("/configuracion");
    return <PageFlagGate flag="page.configuracion.enabled">{children}</PageFlagGate>;
}
