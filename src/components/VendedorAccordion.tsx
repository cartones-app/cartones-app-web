"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendedorInputDTO, VendedorResponseDTO } from "@/types";
import { Users } from "lucide-react";

interface VendedorAccordionProps {
    vendedores: VendedorResponseDTO[];
    vendedorInputs: VendedorInputDTO[];
    onUpdateVendedor: (id: number, field: keyof VendedorInputDTO, value: number | null | undefined) => void;
}

const formatGuaranies = (valor: number | string | undefined | null) => {
    if (valor === undefined || valor === null) return "Gs. 0";
    const numero = Number(valor);
    return `Gs. ${numero.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function VendedorAccordion({
    vendedores,
    vendedorInputs,
    onUpdateVendedor,
}: VendedorAccordionProps) {
    const getVendedorInput = (id: number): VendedorInputDTO | undefined => {
        return vendedorInputs.find((v) => v.id === id);
    };

    return (
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Lista de Vendedores ({vendedores.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {vendedores.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No hay vendedores cargados
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                        {vendedores.map((vendedor, index) => {
                            const input = getVendedorInput(vendedor.id);
                            return (
                                <AccordionItem
                                    key={vendedor.id}
                                    value={`vendedor-${vendedor.id}`}
                                    className="border rounded-lg px-4 bg-background/50"
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-sm text-muted-foreground">
                                                    #{index + 1}
                                                </span>
                                                <span className="font-medium">{vendedor.nombre}</span>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                                <span>Seneté: {vendedor.cantidadSenete}</span>
                                                <span>Telebingo: {vendedor.cantidadTelebingo}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4 pb-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Vendedor Info */}
                                            <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                                                <h4 className="font-medium text-sm">Información</h4>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Deuda:</span>
                                                        <span className="ml-2 font-medium">
                                                            {formatGuaranies(vendedor.deuda)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Resultado Seneté:</span>
                                                        <span className="ml-2 font-medium">{vendedor.resultadoSenete}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Cantidad Seneté:</span>
                                                        <span className="ml-2 font-medium">{vendedor.cantidadSenete}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Resultado Telebingo:</span>
                                                        <span className="ml-2 font-medium">{vendedor.resultadoTelebingo}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Cantidad Telebingo:</span>
                                                        <span className="ml-2 font-medium">{vendedor.cantidadTelebingo}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terminaciones */}
                                            <div className="space-y-4">
                                                <h4 className="font-medium text-sm">Terminaciones (opcional)</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`terminacion-senete-${vendedor.id}`}>
                                                            Terminación Seneté
                                                        </Label>
                                                        <Input
                                                            id={`terminacion-senete-${vendedor.id}`}
                                                            type="number"
                                                            min={0}
                                                            max={99}
                                                            placeholder="0-99 (opcional)"
                                                            value={input?.terminacionSenete ?? ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value
                                                                    ? parseInt(e.target.value)
                                                                    : null;
                                                                onUpdateVendedor(vendedor.id, "terminacionSenete", value);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`terminacion-telebingo-${vendedor.id}`}>
                                                            Terminación Telebingo
                                                        </Label>
                                                        <Input
                                                            id={`terminacion-telebingo-${vendedor.id}`}
                                                            type="number"
                                                            min={0}
                                                            max={99}
                                                            placeholder="0-99 (opcional)"
                                                            value={input?.terminacionTelebingo ?? ""}
                                                            onChange={(e) => {
                                                                const value = e.target.value
                                                                    ? parseInt(e.target.value)
                                                                    : null;
                                                                onUpdateVendedor(vendedor.id, "terminacionTelebingo", value);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}
