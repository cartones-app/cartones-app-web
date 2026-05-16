import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export const metadata: Metadata = { title: "Nueva distribución" };

export default function UploadLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.upload.enabled">{children}</PageFlagGate>;
}
