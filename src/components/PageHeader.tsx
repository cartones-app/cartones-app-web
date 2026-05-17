import type { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** Si está, pinta un badge "ADMIN" en el eyebrow. */
    admin?: boolean;
    /** Acciones a la derecha (botones, filtros, etc). */
    actions?: ReactNode;
    /** Clase opcional para el contenedor. */
    className?: string;
}

/**
 * Encabezado de página estándar — espejo del lenguaje visual del home:
 * eyebrow con barra horizontal + ícono + badge opcional, título display
 * con gradient, descripción, y divider sutil al final.
 *
 * Las acciones (`actions`) viven a la derecha en sm+ y debajo del título
 * en mobile.
 */
export function PageHeader({
    title,
    description,
    icon: Icon,
    admin,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <header
            className={cn(
                "mb-8 lg:mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500",
                className,
            )}
        >
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-4">
                <span className="inline-block w-8 h-px bg-foreground/30"></span>
                {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                {admin && (
                    <span className="px-2 py-0.5 rounded-md bg-foreground/[0.06] text-muted-foreground border border-foreground/10 tracking-wider">
                        admin
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="font-bold tracking-tight leading-[1.05] text-[clamp(1.75rem,3.5vw,3rem)]">
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/55">
                            {title}
                        </span>
                    </h1>
                    {description && (
                        <p className="text-sm lg:text-base text-muted-foreground mt-2 max-w-2xl">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">{actions}</div>
                )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent mt-8 lg:mt-10" />
        </header>
    );
}
