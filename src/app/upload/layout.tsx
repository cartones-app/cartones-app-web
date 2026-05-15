import type { ReactNode } from "react";
import { PageFlagGate } from "@/components/PageFlagGate";

export default function UploadLayout({ children }: { children: ReactNode }) {
    return <PageFlagGate flag="page.upload.enabled">{children}</PageFlagGate>;
}
