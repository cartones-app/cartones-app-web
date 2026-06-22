import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { FeatureFlagsProvider } from "@/components/FeatureFlagsProvider";
import { AppShell } from "@/components/nav/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { obtenerFlagsPublicosServer } from "@/lib/feature-flags-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Title template: cada page que exporte su propio title queda como
  // "Sub-página · Gestión de Cartones". Las pages sin metadata usan el default.
  title: {
    default: "Gestión de Cartones",
    template: "%s · Gestión de Cartones",
  },
  description: "Sistema de gestión y distribución de cartones.",
  // App interna: no debe indexarse en buscadores. El robots.ts es la fuente
  // de verdad para crawlers que respetan /robots.txt; este meta refuerza
  // para bots que lean el HTML directo (Bing, scrapers, archive.org).
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR fetch de los flags públicos para que el HTML llegue con los items
  // del sidebar correctos y no haya flash de "todos visibles" mientras el
  // cliente hace su propio fetch. Si falla (sin sesión, backend down) el
  // provider client-side cae a su cache de localStorage o al fetch tradicional.
  const initialFlags = await obtenerFlagsPublicosServer();

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AuthProvider>
          <FeatureFlagsProvider initialFlags={initialFlags}>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <AppShell>{children}</AppShell>
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </FeatureFlagsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
