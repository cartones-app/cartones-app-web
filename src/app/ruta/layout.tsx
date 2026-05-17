import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";
import { requireSesion } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Recorrido de ruta" };

export default async function RutaLayout({ children }: Readonly<{ children: ReactNode }>) {
    await requireSesion("/ruta");
    return <PageFlagGate flag="page.ruta.enabled">{children}</PageFlagGate>;
}
