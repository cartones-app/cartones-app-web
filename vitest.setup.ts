import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// React 18+ test-environment flag — silencia el warning "not wrapped in act".
// El patch de React.act vive en vitest.patch-react.ts (corre antes que este
// setup, para llegar antes de que @testing-library/react cachee la referencia).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Setup global de Vitest.
 *
 * - `@testing-library/jest-dom/vitest` extiende `expect` con matchers
 *   (toBeInTheDocument, toHaveAttribute, etc.).
 * - `cleanup()` tras cada test desmonta los components montados con
 *   @testing-library/react (evita leaks entre tests).
 * - Reset de mocks entre tests para que un `vi.spyOn` o `vi.mock` de un
 *   test no contamine el siguiente.
 */

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});
