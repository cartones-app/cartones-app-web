import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";
import { requireSesion } from "@/lib/auth-guard";

export const metadata: Metadata = { title: "Nueva distribución" };

export default async function UploadLayout({ children }: Readonly<{ children: ReactNode }>) {
    await requireSesion("/upload");
    return <PageFlagGate flag="page.upload.enabled">{children}</PageFlagGate>;
}
