import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

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
