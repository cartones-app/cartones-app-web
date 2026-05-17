import {
    FileSpreadsheet,
    Flag,
    HardDrive,
    LayoutDashboard,
    LayoutGrid,
    ListChecks,
    Printer,
    Route,
    Settings,
    ShieldCheck,
    Users2,
    type LucideIcon,
} from "lucide-react";
import {
    FLAG_PAGE_CONFIGURACION,
    FLAG_PAGE_MIS_DISTRIBUCIONES,
    FLAG_PAGE_RUTA,
    FLAG_PAGE_UPLOAD,
} from "@/components/FeatureFlagsProvider";

export interface NavItem {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    /** Si true, el item solo aparece cuando hay un procesoId activo en el store. */
    requiresProceso?: boolean;
    /**
     * Clave de feature flag (boolean) que controla la visibilidad del item.
     * Si el flag es false, el item se oculta del sidebar. Independiente del
     * gating de la página en sí (ver {@code PageFlagGate}).
     */
    flag?: string;
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
                flag: FLAG_PAGE_UPLOAD,
            },
            {
                href: "/mis-distribuciones",
                title: "Mis distribuciones",
                description: "Procesos que generaste — descargá los PDFs.",
                icon: ListChecks,
                flag: FLAG_PAGE_MIS_DISTRIBUCIONES,
            },
            {
                href: "/configuracion",
                title: "Configuración",
                description: "Ajustes del simulador de distribución.",
                icon: Settings,
                requiresProceso: true,
                flag: FLAG_PAGE_CONFIGURACION,
            },
            {
                href: "/preferencias-etiquetas",
                title: "Preferencias de etiquetas",
                description: "Diseño y orden de impresión del PDF de etiquetas.",
                icon: Printer,
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
                flag: FLAG_PAGE_RUTA,
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
            {
                href: "/admin/preferencias-etiquetas",
                title: "Preferencias de etiquetas",
                description: "Ajustar diseño y orden de etiquetas por distribuidor.",
                icon: Printer,
            },
            {
                href: "/admin/configuracion-archivos",
                title: "Retención de archivos",
                description: "Tiempo de conservación y borrado automático de PDFs.",
                icon: HardDrive,
            },
            {
                href: "/admin/feature-flags",
                title: "Feature flags",
                description: "Activar/desactivar módulos del sistema en runtime.",
                icon: Flag,
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
