import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireSesion } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Resultados" };

export default async function ResultadosLayout({ children }: { children: ReactNode }) {
    await requireSesion("/resultados");
    return children;
}
