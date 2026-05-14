"use client";

import Link from "next/link";
import {
    ArrowRight,
    FileSpreadsheet,
    ListChecks,
    Route,
    Settings,
    ShieldCheck,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { useUserPermissions } from "@/lib/auth-utils";
import { NAV_GROUPS } from "@/components/nav/nav-items";

const HERO_HIGHLIGHTS: { title: string; description: string; icon: LucideIcon }[] = [
    {
        title: "Nueva distribución",
        description: "Subí el Excel y simulá la entrega de cartones en minutos.",
        icon: FileSpreadsheet,
    },
    {
        title: "Recorrido de ruta",
        description: "Captura puntos de entrega y exportá el archivo cerrado.",
        icon: Route,
    },
    {
        title: "Tus históricos",
        description: "Re-descargá PDFs y revisá lo que ya generaste.",
        icon: ListChecks,
    },
];

export default function Home() {
    const { esAdmin, displayName, loading, autenticado } = useUserPermissions();

    const principalItems = NAV_GROUPS.find((g) => g.title === "Distribución")?.items ?? [];
    const rutaItems = NAV_GROUPS.find((g) => g.title === "Recorrido de ruta")?.items ?? [];
    const adminItems = NAV_GROUPS.find((g) => g.admin)?.items ?? [];

    return (
        <div className="relative">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            >
                <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl" />
                <div className="absolute top-72 left-1/3 h-64 w-64 rounded-full bg-chart-4/15 blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-6xl px-4 lg:px-6 py-8 lg:py-12">
                <section className="rounded-2xl border bg-card/60 backdrop-blur-sm p-6 lg:p-8 shadow-sm">
                    <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            Panel principal
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
                            {loading
                                ? "Cargando…"
                                : autenticado
                                    ? `Hola${displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋`
                                    : "Gestión de cartones"}
                        </h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl">
                            {autenticado
                                ? "Elegí una tarea para empezar. Todo lo importante también vive en el menú de la izquierda."
                                : "Iniciá sesión para distribuir cartones, gestionar recorridos de ruta y descargar PDFs."}
                        </p>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {HERO_HIGHLIGHTS.map((h) => {
                            const Icon = h.icon;
                            return (
                                <div
                                    key={h.title}
                                    className="rounded-lg border bg-background/50 p-3.5"
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                                        <span className="text-sm font-medium">{h.title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{h.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-10" aria-labelledby="seccion-distribucion">
                    <h2
                        id="seccion-distribucion"
                        className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                        Distribución
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {principalItems.map((s) => (
                            <SectionLink key={s.href} {...s} />
                        ))}
                    </div>
                </section>

                <section className="mt-10" aria-labelledby="seccion-ruta">
                    <h2
                        id="seccion-ruta"
                        className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"
                    >
                        <Route className="h-3.5 w-3.5" aria-hidden="true" />
                        Recorrido de ruta
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rutaItems.map((s) => (
                            <SectionLink key={s.href} {...s} />
                        ))}
                    </div>
                </section>

                {esAdmin && (
                    <section className="mt-10" aria-labelledby="seccion-admin">
                        <h2
                            id="seccion-admin"
                            className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Administración
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {adminItems.map((s) => (
                                <SectionLink key={s.href} {...s} admin />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

interface CardItem {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    admin?: boolean;
}

function SectionLink({ href, title, description, icon: Icon, admin }: CardItem) {
    return (
        <Link
            href={href}
            className="group relative rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            <div className="flex items-start justify-between mb-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {admin && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        admin
                    </span>
                )}
            </div>
            <h3 className="font-medium leading-tight mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-snug">{description}</p>
            <ArrowRight
                className="h-4 w-4 absolute right-4 bottom-4 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                aria-hidden="true"
            />
        </Link>
    );
}
