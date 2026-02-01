"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VendedorSimuladoDTO } from "@/types";
import { BarChart3 } from "lucide-react";

interface ResultsTableProps {
    resultados: VendedorSimuladoDTO[];
}

export function ResultsTable({ resultados }: ResultsTableProps) {
    return (
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resultados de la Simulación ({resultados.length} vendedores)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {resultados.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No hay resultados para mostrar
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Rangos Seneté</TableHead>
                                    <TableHead>Rangos Telebingo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resultados.map((vendedor) => (
                                    <TableRow key={vendedor.id}>
                                        <TableCell className="font-mono text-muted-foreground">
                                            #{vendedor.id}
                                        </TableCell>
                                        <TableCell className="font-medium">{vendedor.nombre}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {vendedor.rangosSenete.length > 0 ? (
                                                    vendedor.rangosSenete.map((rango, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                        >
                                                            {rango}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {vendedor.rangosTelebingo.length > 0 ? (
                                                    vendedor.rangosTelebingo.map((rango, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                        >
                                                            {rango}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
