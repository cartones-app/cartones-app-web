import {
    FileSpreadsheet,
    LayoutDashboard,
    LayoutGrid,
    ListChecks,
    Route,
    Settings,
    ShieldCheck,
    Users2,
    type LucideIcon,
} from "lucide-react";

export interface NavItem {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    /** Si true, el item solo aparece cuando hay un procesoId activo en el store. */
    requiresProceso?: boolean;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
    admin?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
    {
        title: "Principal",
        items: [
            {
                href: "/",
                title: "Inicio",
                description: "Resumen y accesos rápidos.",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        title: "Distribución",
        items: [
            {
                href: "/upload",
                title: "Nueva distribución",
                description: "Subí el Excel de vendedores y simulá la distribución.",
                icon: FileSpreadsheet,
            },
            {
                href: "/mis-distribuciones",
                title: "Mis distribuciones",
                description: "Procesos que generaste — descargá los PDFs.",
                icon: ListChecks,
            },
            {
                href: "/configuracion",
                title: "Configuración",
                description: "Ajustes del simulador de distribución.",
                icon: Settings,
                requiresProceso: true,
            },
        ],
    },
    {
        title: "Recorrido de ruta",
        items: [
            {
                href: "/ruta",
                title: "Recorrido de ruta",
                description: "Excel de ruta → registros → archivo actualizado.",
                icon: Route,
            },
        ],
    },
    {
        title: "Administración",
        admin: true,
        items: [
            {
                href: "/admin/distribuciones",
                title: "Distribuciones",
                description: "Vista global de todos los procesos.",
                icon: Users2,
            },
            {
                href: "/admin/ruta/sesiones",
                title: "Sesiones de ruta",
                description: "Historial de sesiones del módulo ruta.",
                icon: LayoutGrid,
            },
            {
                href: "/admin/ruta/exclusiones",
                title: "Exclusiones de ruta",
                description: "Vendedores y entradas excluidas del filtrado.",
                icon: ShieldCheck,
            },
        ],
    },
];

export function findNavItem(pathname: string): NavItem | null {
    const all = NAV_GROUPS.flatMap((g) => g.items);
    const exact = all.find((i) => i.href === pathname);
    if (exact) return exact;
    const longest = all
        .filter((i) => i.href !== "/" && pathname.startsWith(i.href))
        .sort((a, b) => b.href.length - a.href.length)[0];
    return longest ?? null;
}
