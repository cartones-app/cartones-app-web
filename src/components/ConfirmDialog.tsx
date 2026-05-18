"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
    /** Botón / elemento que dispara el diálogo. Recibe `as child` (Radix Slot). */
    trigger: ReactNode;
    title: string;
    description: ReactNode;
    /** Texto del botón confirmatorio. Default: "Confirmar". */
    confirmLabel?: string;
    /** Texto del botón cancelar. Default: "Cancelar". */
    cancelLabel?: string;
    /** Si true, el botón confirmatorio queda en variante destructiva (rojo). */
    destructive?: boolean;
    /**
     * Handler de confirmación. Si retorna Promise, mantenemos el diálogo
     * abierto y deshabilitamos los botones hasta que resuelva — así una
     * acción async puede mostrar "Eliminando..." sin parpadeos.
     */
    onConfirm: () => void | Promise<void>;
}

/**
 * Reemplazo accesible y consistente del `window.confirm()` nativo para acciones
 * destructivas. Razones contra el nativo:
 *
 *  - Bloquea el event loop del browser.
 *  - En PWA / iframes muchas veces está deshabilitado por el host.
 *  - UI inconsistente con el resto de la app (especialmente en mobile).
 *  - No es interrumpible: si el handler async falla, queda el modal nativo
 *    cerrado pero el estado del callsite intacto.
 *
 * Patrón de uso:
 * ```tsx
 * <ConfirmDialog
 *     trigger={<Button variant="ghost"><Trash2 /></Button>}
 *     title="¿Eliminar esta sesión?"
 *     description="No se puede deshacer."
 *     destructive
 *     onConfirm={() => handleEliminar(id)}
 * />
 * ```
 */
export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    destructive = false,
    onConfirm,
}: Readonly<ConfirmDialogProps>) {
    const [open, setOpen] = useState(false);
    const [pendiente, setPendiente] = useState(false);

    const handleConfirm = async (e: MouseEvent<HTMLButtonElement>) => {
        // Radix cierra por default tras Action.onClick — interceptamos para
        // controlar nosotros el cierre y soportar handlers async.
        e.preventDefault();
        if (pendiente) return;
        setPendiente(true);
        try {
            await onConfirm();
            setOpen(false);
        } catch {
            // El caller (típicamente vía axios interceptor) ya mostró el toast.
            // Cerramos igualmente para no atrapar al usuario en el modal —
            // si quiere reintentar, vuelve a abrirlo.
            setOpen(false);
        } finally {
            setPendiente(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={(o) => !pendiente && setOpen(o)}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pendiente}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={pendiente}
                        className={
                            destructive
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : undefined
                        }
                    >
                        {pendiente ? "Procesando…" : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
