"use client";

import { useEffect, useState } from "react";
import { Flag, Loader2, RefreshCw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { useFeatureFlags } from "@/components/FeatureFlagsProvider";
import {
    clearFeatureFlagOverride,
    listarFeatureFlags,
    setFeatureFlagOverride,
} from "@/lib/api";
import { formatFechaHoraCorta } from "@/lib/date-format";
import type { FlagViewDTO } from "@/types";

interface DraftState {
    value: string;
    reason: string;
}

export default function AdminFeatureFlagsPage() {
    const { refresh: refreshPublicFlags } = useFeatureFlags();
    const [flags, setFlags] = useState<FlagViewDTO[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);
    // Borrador local por flag — para que el admin edite el valor (y opcionalmente
    // el motivo) sin disparar la request en cada keystroke. Para boolean el switch
    // sí dispara inmediatamente, porque la UX esperada es instantánea.
    const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

    /** Aplica los datos al estado local. Reutilizable desde el effect (.then) y desde el handler de Recargar. */
    const hidratar = (data: FlagViewDTO[]) => {
        setFlags(data);
        setDrafts(
            Object.fromEntries(
                data.map((f) => [
                    f.key,
                    { value: f.effectiveValue, reason: f.overrideReason ?? "" },
                ])
            )
        );
    };

    const cargar = async () => {
        setCargando(true);
        try {
            const data = await listarFeatureFlags();
            hidratar(data);
        } catch {
            // toast global
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        // setState en el body del effect dispararía react-hooks/set-state-in-effect.
        // Lo hacemos en callbacks de la promise — corren async, regla feliz.
        let cancelled = false;
        listarFeatureFlags()
            .then((data) => {
                if (!cancelled) hidratar(data);
            })
            .catch(() => {
                // toast global
            })
            .finally(() => {
                if (!cancelled) setCargando(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const applyResult = (updated: FlagViewDTO) => {
        setFlags((prev) => prev.map((f) => (f.key === updated.key ? updated : f)));
        setDrafts((prev) => ({
            ...prev,
            [updated.key]: {
                value: updated.effectiveValue,
                reason: updated.overrideReason ?? "",
            },
        }));
    };

    const handleToggleBoolean = async (flag: FlagViewDTO, next: boolean) => {
        setBusy(flag.key);
        try {
            const draft = drafts[flag.key];
            const updated = await setFeatureFlagOverride(flag.key, {
                value: String(next),
                reason: draft?.reason?.trim() || undefined,
            });
            applyResult(updated);
            toast.success(`Flag '${flag.key}' actualizado`);
            refreshPublicFlags();
        } catch {
            // toast global
        } finally {
            setBusy(null);
        }
    };

    const handleSave = async (flag: FlagViewDTO) => {
        const draft = drafts[flag.key];
        if (!draft?.value?.trim()) {
            toast.error("El valor no puede estar vacío.");
            return;
        }
        setBusy(flag.key);
        try {
            const updated = await setFeatureFlagOverride(flag.key, {
                value: draft.value,
                reason: draft.reason.trim() || undefined,
            });
            applyResult(updated);
            toast.success(`Flag '${flag.key}' actualizado`);
            refreshPublicFlags();
        } catch {
            // toast global
        } finally {
            setBusy(null);
        }
    };

    const handleClear = async (flag: FlagViewDTO) => {
        if (!confirm(`¿Restablecer '${flag.key}' al valor por default ('${flag.defaultValue}')?`)) {
            return;
        }
        setBusy(flag.key);
        try {
            await clearFeatureFlagOverride(flag.key);
            // Update local optimista para no quedar inconsistente si el refetch falla.
            // El defaultValue del registry debería coincidir con el effective tras DELETE.
            setFlags((prev) =>
                prev.map((it) =>
                    it.key === flag.key
                        ? {
                            ...it,
                            effectiveValue: it.defaultValue,
                            hasOverride: false,
                            overrideValue: null,
                            overrideReason: null,
                            modifiedBy: null,
                            updatedAt: null,
                        }
                        : it
                )
            );
            setDrafts((prev) => ({
                ...prev,
                [flag.key]: { value: flag.defaultValue, reason: "" },
            }));
            toast.success(`Override de '${flag.key}' eliminado`);
            refreshPublicFlags();
            // Best-effort: resincronizar contra el server por si el YAML tiene un valor
            // distinto al defaultValue del registry. Si falla, el toast global lo reporta
            // y el estado local ya quedó consistente.
            try {
                const data = await listarFeatureFlags();
                setFlags(data);
            } catch {
                // ignore — ya actualizamos local
            }
        } catch {
            // toast global; setBusy se limpia en el finally
        } finally {
            setBusy(null);
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <PageHeader
                title="Feature flags"
                description="Activá o desactivá módulos del sistema en runtime. Los cambios pisan el default del archivo de configuración y persisten en la base."
                icon={Flag}
                admin
                actions={
                    <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                        <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
                        <span className="ml-2 hidden sm:inline">Recargar</span>
                    </Button>
                }
            />

            {cargando && flags.length === 0 ? (
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                </div>
            ) : flags.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card/40 p-12 text-center text-muted-foreground">
                    No hay flags registrados.
                </div>
            ) : (
                <div className="space-y-4">
                    {flags.map((f) => {
                        const draft = drafts[f.key] ?? { value: f.effectiveValue, reason: "" };
                        const isBusy = busy === f.key;
                        const dirty =
                            draft.value !== f.effectiveValue ||
                            draft.reason !== (f.overrideReason ?? "");

                        return (
                            <div
                                key={f.key}
                                className="rounded-lg border bg-card p-4 sm:p-5 space-y-4"
                            >
                                {/*
                                  No usamos flex-wrap acá — queremos que el Switch
                                  quede SIEMPRE en la esquina superior derecha, al
                                  lado del nombre del flag, incluso si la descripción
                                  o el bloque de badges crece. La columna izquierda
                                  toma min-w-0 + flex-1 para truncar / envolver
                                  internamente sin empujar al switch debajo.
                                */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <code className="text-sm font-mono font-semibold">
                                                {f.key}
                                            </code>
                                            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">
                                                {f.type}
                                            </span>
                                            {f.hasOverride ? (
                                                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                    Override
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {f.description}
                                        </p>
                                    </div>
                                    {f.type === "BOOLEAN" && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isBusy && (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                            <Switch
                                                checked={String(f.effectiveValue).toLowerCase() === "true"}
                                                disabled={isBusy}
                                                onCheckedChange={(v) => handleToggleBoolean(f, v)}
                                                aria-label={`Toggle ${f.key}`}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-muted-foreground">Default: </span>
                                        <code className="font-mono">{f.defaultValue}</code>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Valor efectivo: </span>
                                        <code className="font-mono font-semibold">
                                            {f.effectiveValue}
                                        </code>
                                    </div>
                                </div>

                                {f.type !== "BOOLEAN" && (
                                    <div className="grid gap-1.5">
                                        <Label htmlFor={`val-${f.key}`}>Valor</Label>
                                        <Input
                                            id={`val-${f.key}`}
                                            value={draft.value}
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    [f.key]: { ...draft, value: e.target.value },
                                                }))
                                            }
                                            placeholder={f.defaultValue}
                                            inputMode={f.type === "LONG" ? "numeric" : undefined}
                                            disabled={isBusy}
                                        />
                                    </div>
                                )}

                                <div className="grid gap-1.5">
                                    <Label htmlFor={`reason-${f.key}`}>
                                        Motivo del cambio{" "}
                                        <span className="text-muted-foreground font-normal">
                                            (opcional, queda en auditoría)
                                        </span>
                                    </Label>
                                    <Input
                                        id={`reason-${f.key}`}
                                        value={draft.reason}
                                        onChange={(e) =>
                                            setDrafts((prev) => ({
                                                ...prev,
                                                [f.key]: { ...draft, reason: e.target.value },
                                            }))
                                        }
                                        placeholder="Ej: bug en módulo X, deshabilito mientras lo investigo"
                                        disabled={isBusy}
                                    />
                                </div>

                                {f.hasOverride && (
                                    <div className="text-xs text-muted-foreground">
                                        Última modificación:{" "}
                                        <span className="font-medium">{f.modifiedBy ?? "—"}</span>{" "}
                                        {f.updatedAt && (
                                            <>· {formatFechaHoraCorta(f.updatedAt)}</>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    {f.hasOverride && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleClear(f)}
                                            disabled={isBusy}
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Restablecer al default
                                        </Button>
                                    )}
                                    {f.type !== "BOOLEAN" && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleSave(f)}
                                            disabled={isBusy || !dirty}
                                        >
                                            {isBusy ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4 mr-2" />
                                            )}
                                            Guardar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
