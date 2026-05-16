"use client";

import { useDeferredValue, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Calendar as CalendarIcon, Loader2, Plus, Trash2, Play, ArrowRight, ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFechaLarga } from "@/lib/date-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// react-day-picker pesa ~30KB gz y aporta DOM grande. Las dos fechas son
// OPCIONALES — la mayoría de los flujos no abren los popovers. next/dynamic
// con ssr:false (el Calendar es interactivo, no aporta SSR) hace que el chunk
// se baje solo cuando el user efectivamente abre un popover.
const Calendar = dynamic(
    () => import("@/components/ui/calendar").then((m) => m.Calendar),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center p-6 min-h-[280px] min-w-[260px]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        ),
    },
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PoolRangeForm, VendedorInputDTO, VendedorResponseDTO, VendedorSimuladoDTO } from "@/types";
import { VendedorAccordion } from "./VendedorAccordion";
import { ResultsTable } from "./ResultsTable";

interface ConfigurationPanelProps {
    fechaSorteoSenete: Date | undefined;
    setFechaSorteoSenete: (date: Date | undefined) => void;
    fechaSorteoTelebingo: Date | undefined;
    setFechaSorteoTelebingo: (date: Date | undefined) => void;
    poolSenete: PoolRangeForm[];
    setPoolSenete: (pools: PoolRangeForm[]) => void;
    poolTelebingo: PoolRangeForm[];
    setPoolTelebingo: (pools: PoolRangeForm[]) => void;
    mezclar: boolean;
    setMezclar: (value: boolean) => void;
    inicioSeneteGral: string;
    setInicioSeneteGral: (value: string) => void;
    inicioTelebingoGral: string;
    setInicioTelebingoGral: (value: string) => void;
    onSimular: () => void;
    isSimulating: boolean;
    hasSimulated: boolean;
    onVerResultados: () => void;
    // List Data
    vendedores: VendedorResponseDTO[];
    vendedorInputs: VendedorInputDTO[];
    onUpdateVendedor: (id: number, field: keyof VendedorInputDTO, value: number | null | undefined) => void;
    // Results Data
    resultados: VendedorSimuladoDTO[];
    showResultsPreview: boolean;
    setShowResultsPreview: (show: boolean) => void;
}

export function ConfigurationPanel({
    fechaSorteoSenete,
    setFechaSorteoSenete,
    fechaSorteoTelebingo,
    setFechaSorteoTelebingo,
    poolSenete,
    setPoolSenete,
    poolTelebingo,
    setPoolTelebingo,
    mezclar,
    setMezclar,
    inicioSeneteGral,
    setInicioSeneteGral,
    inicioTelebingoGral,
    setInicioTelebingoGral,
    onSimular,
    isSimulating,
    hasSimulated,
    onVerResultados,
    vendedores,
    vendedorInputs,
    onUpdateVendedor,
    resultados,
    showResultsPreview,
    setShowResultsPreview,
}: Readonly<ConfigurationPanelProps>) {
    const [searchTerm, setSearchTerm] = useState("");
    // useDeferredValue: el input se actualiza en cada keystroke (responsive),
    // pero el filtering pesado contra `vendedorInputs` y `resultados` se
    // calcula contra un valor diferido. Con N=200+ vendedores, evita
    // freezear el input mientras React re-renderiza el accordion/tabla.
    const deferredSearch = useDeferredValue(searchTerm);
    const normalizedSearch = deferredSearch.toLowerCase();

    const filteredVendedores = useMemo(
        () =>
            vendedorInputs.filter(
                (v) =>
                    v.nombre.toLowerCase().includes(normalizedSearch) ||
                    v.id.toString().includes(deferredSearch),
            ),
        [vendedorInputs, normalizedSearch, deferredSearch],
    );

    const filteredResultados = useMemo(
        () =>
            resultados.filter(
                (r) =>
                    r.nombre.toLowerCase().includes(normalizedSearch) ||
                    r.id.toString().includes(deferredSearch),
            ),
        [resultados, normalizedSearch, deferredSearch],
    );
    const addPoolRange = (type: "senete" | "telebingo") => {
        const newRange = { inicio: "", fin: "" };
        if (type === "senete") {
            setPoolSenete([...poolSenete, newRange]);
        } else {
            setPoolTelebingo([...poolTelebingo, newRange]);
        }
    };

    const removePoolRange = (type: "senete" | "telebingo", index: number) => {
        if (type === "senete") {
            setPoolSenete(poolSenete.filter((_, i) => i !== index));
        } else {
            setPoolTelebingo(poolTelebingo.filter((_, i) => i !== index));
        }
    };

    const updatePoolRange = (
        type: "senete" | "telebingo",
        index: number,
        field: "inicio" | "fin",
        value: string
    ) => {
        if (type === "senete") {
            const updated = [...poolSenete];
            updated[index] = { ...updated[index], [field]: value };
            setPoolSenete(updated);
        } else {
            const updated = [...poolTelebingo];
            updated[index] = { ...updated[index], [field]: value };
            setPoolTelebingo(updated);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Configuración Global</CardTitle>
                    {/* Actions moved to sticky toolbar */}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Dates Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Fecha Seneté */}
                        <div className="space-y-2">
                            <Label>Fecha Sorteo Seneté (opcional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !fechaSorteoSenete && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {fechaSorteoSenete ? (
                                            formatFechaLarga(fechaSorteoSenete)
                                        ) : (
                                            <span>Seleccionar fecha</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={fechaSorteoSenete}
                                        onSelect={setFechaSorteoSenete}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Fecha Telebingo */}
                        <div className="space-y-2">
                            <Label>Fecha Sorteo Telebingo (opcional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !fechaSorteoTelebingo && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {fechaSorteoTelebingo ? (
                                            formatFechaLarga(fechaSorteoTelebingo)
                                        ) : (
                                            <span>Seleccionar fecha</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={fechaSorteoTelebingo}
                                        onSelect={setFechaSorteoTelebingo}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Inicio General Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="inicioSeneteGral">Inicio Seneté</Label>
                            <Input
                                id="inicioSeneteGral"
                                type="number"
                                placeholder="Por defecto empieza en 0"
                                value={inicioSeneteGral}
                                onChange={(e) => setInicioSeneteGral(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Número de inicio para asignación secuencial
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inicioTelebingoGral">Inicio Telebingo</Label>
                            <Input
                                id="inicioTelebingoGral"
                                type="number"
                                placeholder="Por defecto empieza en 0"
                                value={inicioTelebingoGral}
                                onChange={(e) => setInicioTelebingoGral(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Número de inicio para asignación secuencial
                            </p>
                        </div>
                    </div>

                    {/* Pool Ranges */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pool Seneté */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-medium">Pool Seneté (opcional)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPoolRange("senete")}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar Rango
                                </Button>
                            </div>
                            {poolSenete.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">
                                    No hay rangos definidos - usa Inicio Seneté o agrega rangos
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {poolSenete.map((range, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Inicio"
                                                value={range.inicio}
                                                onChange={(e) =>
                                                    updatePoolRange("senete", index, "inicio", e.target.value)
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-muted-foreground">-</span>
                                            <Input
                                                type="number"
                                                placeholder="Fin"
                                                value={range.fin}
                                                onChange={(e) =>
                                                    updatePoolRange("senete", index, "fin", e.target.value)
                                                }
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePoolRange("senete", index)}
                                                className="shrink-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pool Telebingo */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-medium">Pool Telebingo (opcional)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPoolRange("telebingo")}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Agregar Rango
                                </Button>
                            </div>
                            {poolTelebingo.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-2">
                                    No hay rangos definidos - usa Inicio Telebingo o agrega rangos
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {poolTelebingo.map((range, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Inicio"
                                                value={range.inicio}
                                                onChange={(e) =>
                                                    updatePoolRange("telebingo", index, "inicio", e.target.value)
                                                }
                                                className="flex-1"
                                            />
                                            <span className="text-muted-foreground">-</span>
                                            <Input
                                                type="number"
                                                placeholder="Fin"
                                                value={range.fin}
                                                onChange={(e) =>
                                                    updatePoolRange("telebingo", index, "fin", e.target.value)
                                                }
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePoolRange("telebingo", index)}
                                                className="shrink-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mezclar Switch */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                        <div>
                            <Label htmlFor="mezclar" className="text-base font-medium">
                                Mezclar distribución
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Aleatoriza el orden de asignación de rangos
                            </p>
                        </div>
                        <Switch
                            id="mezclar"
                            checked={mezclar}
                            onCheckedChange={setMezclar}
                        />
                    </div>

                </CardContent>
            </Card>

            {/* Floating Action Bar (Dock) */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl bg-background/75 backdrop-blur-lg border border-border/40 shadow-xl rounded-full p-2 flex items-center justify-between gap-3 transition-all duration-300">

                {/* Search */}
                <div className="relative flex-1 max-w-[300px] md:max-w-md pl-2">
                    <Search className="absolute left-5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar vendedor..."
                        className="pl-9 h-9 bg-background/50 border-muted-foreground/20 rounded-full text-sm focus-visible:ring-offset-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pr-1">
                    <Button onClick={onSimular} disabled={isSimulating} size="sm" className="rounded-full shadow-sm">
                        <Play className="h-4 w-4 mr-2" />
                        Simular
                    </Button>
                    {hasSimulated && (
                        <Button
                            onClick={() => showResultsPreview ? onVerResultados() : setShowResultsPreview(true)}
                            variant="secondary"
                            size="sm"
                            className="rounded-full shadow-sm"
                        >
                            {showResultsPreview ? "Continuar" : "Resultados"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content List */}
            <div className="min-h-[400px] pb-32">
                {showResultsPreview ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-end">
                            <Button
                                onClick={() => setShowResultsPreview(false)}
                                variant="outline"
                                size="sm"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Editar Terminaciones
                            </Button>
                        </div>
                        {filteredResultados.length > 0 ? (
                            <ResultsTable resultados={filteredResultados} />
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                No se encontraron resultados para &quot;{searchTerm}&quot;
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {filteredVendedores.length > 0 ? (
                            <VendedorAccordion
                                vendedores={vendedores.filter(v =>
                                    v.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    v.id.toString().includes(searchTerm)
                                )}
                                vendedorInputs={vendedorInputs}
                                onUpdateVendedor={onUpdateVendedor}
                            />
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                No se encontraron vendedores para &quot;{searchTerm}&quot;
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >

    );
}
