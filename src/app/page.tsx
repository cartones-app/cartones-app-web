"use client";

import Link from "next/link";
import {
    FileSpreadsheet,
    LayoutGrid,
    ListChecks,
    Route,
    Settings,
    ShieldCheck,
    Users2,
} from "lucide-react";
import { useUserPermissions } from "@/lib/auth-utils";

interface SectionCard {
    href: string;
    title: string;
    description: string;
    icon: typeof FileSpreadsheet;
    admin?: boolean;
}

const SECTIONS: SectionCard[] = [
    {
        href: "/upload",
        title: "Nueva distribución",
        description: "Subí el Excel de vendedores y simulá la distribución de cartones.",
        icon: FileSpreadsheet,
    },
    {
        href: "/mis-distribuciones",
        title: "Mis distribuciones",
        description: "Procesos que generaste — descargá los PDFs de cada uno.",
        icon: ListChecks,
    },
    {
        href: "/ruta",
        title: "Recorrido de ruta",
        description: "Subí el Excel de ruta, completá los registros y exportá el archivo actualizado.",
        icon: Route,
    },
    {
        href: "/configuracion",
        title: "Configuración",
        description: "Ajustes del proceso de distribución (parámetros del simulador).",
        icon: Settings,
    },
    {
        href: "/admin/distribuciones",
        title: "Distribuciones (admin)",
        description: "Vista global de todos los procesos del sistema.",
        icon: Users2,
        admin: true,
    },
    {
        href: "/admin/ruta/sesiones",
        title: "Sesiones de ruta (admin)",
        description: "Historial y administración de sesiones del módulo ruta.",
        icon: LayoutGrid,
        admin: true,
    },
    {
        href: "/admin/ruta/exclusiones",
        title: "Exclusiones de ruta (admin)",
        description: "Lista de vendedores y entradas excluidas del filtrado automático.",
        icon: ShieldCheck,
        admin: true,
    },
];

export default function Home() {
    const { esAdmin, displayName, loading } = useUserPermissions();
    const usuario = SECTIONS.filter((s) => !s.admin);
    const admin = SECTIONS.filter((s) => s.admin);

    return (
        <main className="container mx-auto px-4 py-10 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">Inicio</h1>
                {loading ? (
                    <p className="text-muted-foreground mt-1">Cargando perfil…</p>
                ) : displayName ? (
                    <p className="text-muted-foreground mt-1">
                        Hola, <span className="font-medium text-foreground">{displayName}</span>. Elegí qué tarea querés realizar.
                    </p>
                ) : (
                    <p className="text-muted-foreground mt-1">Elegí qué tarea querés realizar.</p>
                )}
            </div>

            <section aria-labelledby="seccion-usuario">
                <h2 id="seccion-usuario" className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
                    Tareas comunes
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {usuario.map((s) => (
                        <SectionLink key={s.href} {...s} />
                    ))}
                </div>
            </section>

            {esAdmin && (
                <section aria-labelledby="seccion-admin" className="mt-10">
                    <h2 id="seccion-admin" className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Administración
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {admin.map((s) => (
                            <SectionLink key={s.href} {...s} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}

function SectionLink({ href, title, description, icon: Icon, admin }: SectionCard) {
    return (
        <Link
            href={href}
            className="group rounded-lg border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
            <div className="flex items-start justify-between mb-3">
                <Icon
                    className={`h-5 w-5 ${admin ? "text-primary" : "text-foreground/70"} group-hover:text-primary transition-colors`}
                    aria-hidden="true"
                />
                {admin && (
                    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        admin
                    </span>
                )}
            </div>
            <h3 className="font-medium mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-snug">{description}</p>
        </Link>
    );
}
