import type { ReactNode } from "react";
import { ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** Si está, pinta un badge "ADMIN" al lado del título. */
    admin?: boolean;
    /** Acciones a la derecha (botones, filtros, etc). */
    actions?: ReactNode;
    /** Clase opcional para el contenedor. */
    className?: string;
}

/**
 * Encabezado de página estándar. Reemplaza el patrón duplicado de
 * "Volver al inicio + h1 + p". La navegación de regreso la cubre el
 * breadcrumb del AppShell.
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
                "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6",
                className,
            )}
        >
            <div className="flex items-start gap-3 min-w-0">
                {Icon && (
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-semibold tracking-tight truncate">
                            {title}
                        </h1>
                        {admin && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                                admin
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
    );
}
