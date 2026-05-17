import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vitest config para tests unitarios/component del frontend.
 *
 * Convención del proyecto: el código vive en `src/` y los tests en `src/__tests__/`
 * con la misma estructura (ej. `src/__tests__/lib/foo.test.ts` cubre `src/lib/foo.ts`).
 * Esto mantiene el árbol de `src/` libre de archivos `*.test.ts` que no van
 * al bundle de prod y simplifica el `exclude` del tsconfig si hace falta.
 *
 * - `environment: "jsdom"`: necesario para tests con `@testing-library/react`.
 *   Los tests puros de helpers no lo necesitan pero el overhead es bajo.
 * - `setupFiles`: extiende `expect` con matchers de jest-dom + cleanup post.
 * - Alias `@/` espejo del tsconfig para que imports `@/lib/...` resuelvan
 *   igual en tests que en build.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
        // `act` solo se exporta en el build dev de react@19 (react.development.js).
        // Vitest por default puede resolver al build de producción si la condition
        // `development` no está activa — forzamos la condition para que `act` esté
        // disponible para @testing-library/react.
        conditions: ["development", "browser"],
    },
    test: {
        environment: "jsdom",
        // `act` solo se exporta en react.development.js. Sin esta env, vitest
        // hereda NODE_ENV=production y los tests de componentes tiran
        // "React.act is not a function".
        env: {
            NODE_ENV: "development",
        },
        globals: true,
        setupFiles: ["./vitest.patch-react.ts", "./vitest.setup.ts"],
        include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["node_modules", ".next", "dist"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/**/*.d.ts",
                "src/__tests__/**", // tests no cuentan como código a cubrir
                "src/app/**/page.tsx",
                "src/app/**/layout.tsx",
                "src/components/ui/**", // shadcn re-exports, sin lógica propia
            ],
            reporter: ["text", "html"],
        },
    },
});
