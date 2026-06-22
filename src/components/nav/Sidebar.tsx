"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserPermissions } from "@/lib/auth-utils";
import { useFeatureFlags } from "@/components/FeatureFlagsProvider";
import { useProcesoStore } from "@/store/useProcesoStore";
import { NAV_GROUPS } from "./nav-items";

interface SidebarProps {
    onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const { esAdmin, displayName, autenticado } = useUserPermissions();
    const { isEnabled } = useFeatureFlags();
    const procesoId = useProcesoStore((s) => s.procesoId);
    const hayProceso = typeof procesoId === "string" && procesoId.length > 0;

    const inicial =
        displayName?.trim().charAt(0).toUpperCase() ?? "?";

    return (
        <nav
            className="flex h-full flex-col bg-sidebar text-sidebar-foreground"
            aria-label="Navegación principal"
        >
            {/* Header: el logo queda fijo en el top (no scrollea). */}
            <div className="shrink-0 px-4 pt-5 pb-4">
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="flex items-center gap-2 group"
                >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold tracking-tight">Cartones</span>
                        <span className="text-[11px] text-muted-foreground">Gestión & ruta</span>
                    </span>
                </Link>
            </div>

            {/* Contenido scrolleable: solo este div se desplaza cuando los
                items superan el alto disponible. El logo (top) y el bloque
                del usuario (bottom) quedan anclados por el flex layout. */}
            <div className="flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto px-3 pb-4">
                {NAV_GROUPS.filter((g) => !g.admin || esAdmin)
                    .map((group) => ({
                        ...group,
                        items: group.items.filter(
                            (i) =>
                                (!i.requiresProceso || hayProceso) &&
                                (!i.flag || isEnabled(i.flag))
                        ),
                    }))
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                    <div key={group.title} className="flex flex-col gap-1">
                        <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            {group.admin && <ShieldCheck className="h-3 w-3" aria-hidden="true" />}
                            {group.title}
                        </div>
                        {group.items.map((item) => {
                            const active =
                                item.href === "/"
                                    ? pathname === "/"
                                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "group/item flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        active
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                            : "text-sidebar-foreground/80"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "h-4 w-4 shrink-0 transition-colors",
                                            active ? "text-primary" : "text-sidebar-foreground/60 group-hover/item:text-sidebar-foreground"
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            {autenticado && (
                <div className="shrink-0 border-t border-sidebar-border px-3 py-3 bg-sidebar">
                    <div className="flex items-center gap-2.5 px-1.5">
                        <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
                            aria-hidden="true"
                        >
                            {inicial}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {displayName ?? "Usuario"}
                        </span>
                    </div>
                </div>
            )}
        </nav>
    );
}
