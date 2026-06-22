import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireSesion } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Preferencias de etiquetas" };

export default async function PreferenciasEtiquetasLayout({
    children,
}: {
    children: ReactNode;
}) {
    await requireSesion("/preferencias-etiquetas");
    return children;
}
