import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

/**
 * Skeleton para listados tabulares mientras se hace fetch. Mejor que un
 * spinner porque mantiene el layout estable y da una percepción de
 * carga más rápida.
 */
export function TableSkeleton({ rows = 6, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <div className="border-b bg-muted/30 px-4 py-3 flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1" />
                ))}
            </div>
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="px-4 py-3 flex gap-4 items-center">
                        {Array.from({ length: columns }).map((_, c) => (
                            <Skeleton
                                key={c}
                                className="h-4 flex-1"
                                style={{ opacity: 1 - r * 0.08 }}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
