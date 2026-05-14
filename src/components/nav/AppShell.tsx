"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { findNavItem } from "./nav-items";
import { AuthButton } from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const current = findNavItem(pathname);
    const isHome = pathname === "/";

    return (
        <div className="flex min-h-screen bg-background">
            <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 border-r border-sidebar-border bg-sidebar sticky top-0 h-screen">
                <div className="flex-1">
                    <Sidebar />
                </div>
            </aside>

            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 border-r border-sidebar-border bg-sidebar md:hidden transition-transform duration-200",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
                aria-hidden={!mobileOpen}
            >
                <div className="absolute right-2 top-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Cerrar navegación"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <Sidebar onNavigate={() => setMobileOpen(false)} />
            </aside>

            <div className="flex flex-1 min-w-0 flex-col">
                <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 backdrop-blur px-4 lg:px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Abrir navegación"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>

                    <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
                        <ol className="flex items-center gap-1.5 text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className={cn(
                                        "rounded px-1.5 py-0.5 transition-colors",
                                        isHome
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Inicio
                                </Link>
                            </li>
                            {!isHome && current && current.href !== "/" && (
                                <>
                                    <ChevronRight
                                        className="h-3.5 w-3.5 text-muted-foreground/60"
                                        aria-hidden="true"
                                    />
                                    <li
                                        className="font-medium text-foreground truncate"
                                        aria-current="page"
                                    >
                                        {current.title}
                                    </li>
                                </>
                            )}
                            {!isHome && !current && (
                                <>
                                    <ChevronRight
                                        className="h-3.5 w-3.5 text-muted-foreground/60"
                                        aria-hidden="true"
                                    />
                                    <li className="font-medium text-foreground truncate" aria-current="page">
                                        {pathname}
                                    </li>
                                </>
                            )}
                        </ol>
                    </nav>

                    <div className="flex items-center gap-1.5">
                        <ThemeToggle />
                        <AuthButton />
                    </div>
                </header>

                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}
