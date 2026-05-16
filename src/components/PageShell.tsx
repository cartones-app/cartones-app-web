import { ReactNode } from "react";

/**
 * Shell visual reutilizable para páginas. Da el fondo con gradient + blur
 * circles consistente con upload/configuracion/resultados. El contenido se
 * envuelve en un container relative z-10 para que pueda usar Cards
 * glassmórficas (bg-card/80 backdrop-blur-sm).
 */
export function PageShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
