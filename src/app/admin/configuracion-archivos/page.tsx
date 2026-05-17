"use client";

import { useEffect, useState } from "react";
import { HardDrive, Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import {
    actualizarConfiguracionArchivos,
    obtenerConfiguracionArchivos,
} from "@/lib/api";
import { formatFechaHoraCorta } from "@/lib/date-format";
import type { ConfiguracionArchivosDTO } from "@/types";

/**
 * Panel admin para la política de retención de archivos generados.
 *
 * <p>El job trimestral (LimpiezaProcesoJob en el backend) lee esta config en
 * cada corrida. Si {@code eliminacionActiva} es false, no borra nada. Si está
 * activa, borra los archivos cuya {@code archivosGeneradosEn} sea más vieja
 * que {@code retencionMeses}.
 *
 * <p>La fila es singleton (id=1) — solo se edita, no se crea ni borra.
 */
export default function AdminConfiguracionArchivosPage() {
    const [config, setConfig] = useState<ConfiguracionArchivosDTO | null>(null);
    const [draftMeses, setDraftMeses] = useState<string>("3");
    const [draftActivo, setDraftActivo] = useState<boolean>(true);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    // Trigger manual del refetch sin duplicar la lógica del useEffect.
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const cargar = async () => {
            setCargando(true);
            try {
                const data = await obtenerConfiguracionArchivos();
                if (cancelled) return;
                setConfig(data);
                setDraftMeses(String(data.retencionMeses));
                setDraftActivo(data.eliminacionActiva);
            } catch {
                // Error mostrado por el interceptor axios global.
            } finally {
                if (!cancelled) setCargando(false);
            }
        };
        void cargar();
        return () => {
            cancelled = true;
        };
    }, [revision]);

    const recargar = () => setRevision((r) => r + 1);

    const mesesNum = Number(draftMeses);
    const mesesValido = Number.isInteger(mesesNum) && mesesNum >= 1 && mesesNum <= 120;

    const dirty =
        config !== null &&
        (mesesNum !== config.retencionMeses || draftActivo !== config.eliminacionActiva);

    const guardar = async () => {
        if (!mesesValido) {
            toast.warning("Valor inválido", {
                description: "La retención debe ser un entero entre 1 y 120 meses.",
            });
            return;
        }
        setGuardando(true);
        try {
            const saved = await actualizarConfiguracionArchivos({
                retencionMeses: mesesNum,
                eliminacionActiva: draftActivo,
            });
            setConfig(saved);
            setDraftMeses(String(saved.retencionMeses));
            setDraftActivo(saved.eliminacionActiva);
            toast.success("Configuración guardada", {
                description: saved.eliminacionActiva
                    ? `El job borrará archivos de más de ${saved.retencionMeses} meses.`
                    : "Eliminación automática desactivada — el job no borrará archivos.",
            });
        } catch {
            // Error mostrado por el interceptor axios global.
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
            <PageHeader
                title="Retención de archivos"
                description="Política del job trimestral que limpia PDFs viejos del filesystem."
                icon={HardDrive}
                admin
                actions={
                    <Button variant="outline" size="sm" onClick={recargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${cargando ? "animate-spin" : ""}`} />
                        Recargar
                    </Button>
                }
            />

            {cargando && !config ? (
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-1/2" />
                </div>
            ) : !config ? (
                <div className="text-sm text-muted-foreground py-12 text-center">
                    No se pudo cargar la configuración.
                </div>
            ) : (
                <div className="space-y-6 rounded-lg border bg-card p-6">
                    <div className="space-y-2">
                        <Label htmlFor="retencionMeses">Meses de retención</Label>
                        <Input
                            id="retencionMeses"
                            type="number"
                            min={1}
                            max={120}
                            step={1}
                            inputMode="numeric"
                            value={draftMeses}
                            onChange={(e) => setDraftMeses(e.target.value)}
                            disabled={guardando}
                            className="max-w-[140px]"
                            aria-invalid={!mesesValido}
                        />
                        <p className="text-xs text-muted-foreground">
                            Entero entre 1 y 120. Los archivos con más antigüedad serán borrados
                            por el job trimestral si la eliminación está activa.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 rounded-md border p-4">
                        <Switch
                            id="eliminacionActiva"
                            checked={draftActivo}
                            onCheckedChange={setDraftActivo}
                            disabled={guardando}
                            aria-describedby="eliminacionActiva-desc"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="eliminacionActiva" className="cursor-pointer">
                                Eliminación automática activa
                            </Label>
                            <p id="eliminacionActiva-desc" className="text-xs text-muted-foreground">
                                Si está desactivada, el job loguea y no borra nada — los archivos se
                                acumulan indefinidamente en el filesystem.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                            Última edición: {formatFechaHoraCorta(config.updatedAt)}
                            {config.modifiedBy && (
                                <>
                                    {" "}
                                    por <span className="font-medium">{config.modifiedBy}</span>
                                </>
                            )}
                        </p>
                        <Button
                            onClick={guardar}
                            disabled={!dirty || !mesesValido || guardando}
                        >
                            {guardando ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Guardar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
