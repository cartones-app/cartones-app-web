"use client";

import { Ban } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useFeatureFlags } from "@/components/FeatureFlagsProvider";

interface PageFlagGateProps {
    flag: string;
    children: ReactNode;
}

/**
 * Envoltorio que oculta una página detrás de un feature flag boolean. Si el
 * flag es false, renderiza un cartel "Página deshabilitada" en lugar del
 * contenido. Mientras el provider está cargando los flags, deja pasar a los
 * children (fail-open) para evitar parpadeo.
 *
 * <p>El admin puede revertir el toggle desde /admin/feature-flags. La
 * autorización real vive en el backend (los endpoints siguen protegidos por
 * Spring Security) — este gate es UX, no seguridad.
 */
export function PageFlagGate({ flag, children }: PageFlagGateProps) {
    const { isEnabled, loading } = useFeatureFlags();

    if (loading) {
        return <>{children}</>;
    }

    if (!isEnabled(flag)) {
        // Usamos <section> y no <main> porque las páginas internas ya envuelven
        // su contenido en <main> — anidar <main> es HTML inválido.
        return (
            <section className="container mx-auto px-4 py-16 max-w-xl text-center" aria-labelledby="pfg-title">
                <div className="rounded-xl border border-dashed bg-card/40 p-10">
                    <Ban className="h-10 w-10 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                    <h1 id="pfg-title" className="text-lg font-semibold mb-2">Página deshabilitada</h1>
                    <p className="text-sm text-muted-foreground mb-6">
                        Esta sección está temporalmente desactivada. Contactá al administrador si
                        necesitás acceder.
                    </p>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/">Volver al inicio</Link>
                    </Button>
                </div>
            </section>
        );
    }

    return <>{children}</>;
}
