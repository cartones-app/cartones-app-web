"use client";

import Link from "next/link";
import {
    ArrowUpRight,
    FileSpreadsheet,
    Route,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react";
import { useUserPermissions } from "@/lib/auth-utils";
import { useFeatureFlags } from "@/components/FeatureFlagsProvider";
import { NAV_GROUPS, type NavItem } from "@/components/nav/nav-items";

export default function Home() {
    const { esAdmin, autenticado } = useUserPermissions();
    const { isEnabled } = useFeatureFlags();

    const filterByFlag = (items: NavItem[]) =>
        items.filter((i) => !i.flag || isEnabled(i.flag));

    const principalItems = filterByFlag(
        NAV_GROUPS.find((g) => g.title === "Distribución")?.items ?? [],
    );
    const rutaItems = filterByFlag(
        NAV_GROUPS.find((g) => g.title === "Recorrido de ruta")?.items ?? [],
    );
    const adminItems = NAV_GROUPS.find((g) => g.admin)?.items ?? [];

    // Numeración editorial de las secciones — "01.", "02.", "03." según
    // las que efectivamente se muestren (admin condicional, flags off).
    const secciones = [
        principalItems.length > 0 && {
            id: "seccion-distribucion",
            icon: FileSpreadsheet,
            title: "Distribución",
            description: "Carga del Excel, simulación de la entrega y resultados.",
            items: principalItems,
        },
        rutaItems.length > 0 && {
            id: "seccion-ruta",
            icon: Route,
            title: "Recorrido de ruta",
            description: "Captura de puntos de entrega y exportación del archivo.",
            items: rutaItems,
        },
        esAdmin && adminItems.length > 0 && {
            id: "seccion-admin",
            icon: ShieldCheck,
            title: "Administración",
            description: "Configuración global, vistas multi-usuario y feature flags.",
            items: adminItems,
            admin: true,
        },
    ].filter(Boolean) as ReadonlyArray<SectionConfig>;

    return (
        <div className="relative">
            <Backdrop />

            <div className="mx-auto w-full max-w-7xl px-4 lg:px-10 py-10 lg:py-14">

                {/* ============================================================
                    HERO — editorial, sin card envolvente. Tipografía display
                    grande pero contenida en laptops medianas. Stagger entrance.
                    ============================================================ */}
                <header className="relative">
                    <div
                        className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-5 animate-in fade-in slide-in-from-bottom-1 duration-500"
                        style={{ animationFillMode: "both" }}
                    >
                        <span className="inline-block w-8 h-px bg-foreground/30 align-middle mr-3"></span>
                        Panel principal
                    </div>

                    <h1
                        className="font-bold tracking-[-0.04em] leading-[0.95] text-[clamp(2.5rem,6vw,5rem)] animate-in fade-in slide-in-from-bottom-2 duration-700"
                        style={{ animationFillMode: "both", animationDelay: "60ms" }}
                    >
                        <span className="block text-foreground/40 text-[0.38em] font-medium tracking-[0.05em] uppercase mb-2">
                            Gestión de
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40">
                            Cartones
                        </span>
                    </h1>

                    <p
                        className="mt-6 max-w-2xl text-base lg:text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700"
                        style={{ animationFillMode: "both", animationDelay: "180ms" }}
                    >
                        {autenticado
                            ? "Elegí una tarea para empezar. Todo lo importante también vive en el menú lateral."
                            : "Plataforma de gestión y distribución. Iniciá sesión para acceder a las herramientas."}
                    </p>
                </header>

                {/* Divider sutil para marcar el corte hero → contenido. */}
                <div className="h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent mt-10 lg:mt-14" />

                {/* ============================================================
                    SECCIONES
                    ============================================================ */}
                <div className="mt-12 lg:mt-20 flex flex-col gap-16 lg:gap-24">
                    {secciones.map((sec, idx) => (
                        <SectionGroup
                            key={sec.id}
                            {...sec}
                            delay={250 + idx * 100}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
   SUBCOMPONENTES
   ============================================================================ */

function Backdrop() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
            <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/[0.06] blur-3xl animate-pulse [animation-duration:9s]" />
            <div className="absolute top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-chart-2/[0.05] blur-3xl animate-pulse [animation-duration:11s] [animation-delay:1s]" />
            <div className="absolute top-[60rem] left-1/4 h-80 w-80 rounded-full bg-chart-4/[0.04] blur-3xl animate-pulse [animation-duration:13s] [animation-delay:2s]" />
        </div>
    );
}

interface SectionConfig {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    items: NavItem[];
    admin?: boolean;
}

interface SectionGroupProps extends SectionConfig {
    delay: number;
}

function SectionGroup({ id, icon: Icon, title, description, items, admin, delay }: SectionGroupProps) {
    return (
        <section
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
            aria-labelledby={id}
        >
            <div className="mb-6 lg:mb-8">
                {/* Eyebrow coherente con el hero — barra horizontal + ícono
                    como marca de la sección. */}
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-3">
                    <span className="inline-block w-8 h-px bg-foreground/30"></span>
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {admin && (
                        <span className="px-2 py-0.5 rounded-md bg-foreground/[0.06] text-muted-foreground border border-foreground/10 tracking-wider">
                            admin
                        </span>
                    )}
                </div>
                <h2 id={id} className="text-2xl lg:text-3xl font-semibold tracking-tight">
                    {title}
                </h2>
                <p className="text-sm lg:text-base text-muted-foreground mt-1.5 max-w-2xl">
                    {description}
                </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s, i) => (
                    <SectionLink
                        key={s.href}
                        {...s}
                        admin={admin}
                        index={i}
                        baseDelay={delay + 80}
                    />
                ))}
            </div>
        </section>
    );
}

interface CardItem {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    admin?: boolean;
    index: number;
    baseDelay: number;
}

function SectionLink({ href, title, description, icon: Icon, index, baseDelay }: CardItem) {
    return (
        <Link
            href={href}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-6 overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 animate-in fade-in slide-in-from-bottom-2"
            style={{
                animationDelay: `${baseDelay + index * 60}ms`,
                animationDuration: "500ms",
                animationFillMode: "both",
            }}
        >
            {/* Bg invertido animado: el card "se voltea" al hover. */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground to-foreground/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
            />

            <div className="relative flex items-start justify-between mb-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-foreground/[0.06] text-foreground ring-1 ring-foreground/10 group-hover:bg-background/15 group-hover:text-background group-hover:ring-background/20 transition-colors duration-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowUpRight
                    className="h-5 w-5 text-muted-foreground/40 group-hover:text-background group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300"
                    aria-hidden="true"
                />
            </div>

            <div className="relative flex-1">
                <h3 className="text-lg font-semibold leading-tight mb-2 tracking-tight group-hover:text-background transition-colors duration-300">
                    {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground group-hover:text-background/70 transition-colors duration-300">
                    {description}
                </p>
            </div>
        </Link>
    );
}
