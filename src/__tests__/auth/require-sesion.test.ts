import { describe, expect, it, vi, beforeEach } from "vitest";

// `redirect` de next/navigation tira un error especial ("NEXT_REDIRECT") al
// invocarse. En tests lo mockeamos a un throw distinguible que podamos
// assertar sobre el path al que iba el redirect.
vi.mock("next/navigation", () => ({
    redirect: vi.fn((url: string) => {
        throw new Error(`__REDIRECT__:${url}`);
    }),
}));

vi.mock("@/auth", () => ({
    auth: vi.fn(),
}));

describe("requireSesion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("con sesión válida no redirige (resuelve sin throw)", async () => {
        const { auth } = await import("@/auth");
        vi.mocked(auth).mockResolvedValue({
            expires: new Date(Date.now() + 60_000).toISOString(),
            accessToken: "valid.token",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { requireSesion } = await import("@/lib/auth-guard");
        await expect(requireSesion("/configuracion")).resolves.toBeUndefined();
    });

    it("sin sesión: redirige a Keycloak con callbackUrl=path pasado", async () => {
        const { auth } = await import("@/auth");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue(null as any);

        const { requireSesion } = await import("@/lib/auth-guard");
        await expect(requireSesion("/upload")).rejects.toThrow(
            "__REDIRECT__:/login?callbackUrl=%2Fupload",
        );
    });

    it("con sesión pero error=RefreshAccessTokenError: redirige", async () => {
        const { auth } = await import("@/auth");
        vi.mocked(auth).mockResolvedValue({
            expires: new Date(Date.now() + 60_000).toISOString(),
            accessToken: "stale.token",
            error: "RefreshAccessTokenError",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { requireSesion } = await import("@/lib/auth-guard");
        await expect(requireSesion("/admin/distribuciones")).rejects.toThrow(
            /__REDIRECT__:\/login\?callbackUrl=/,
        );
    });

    it("preserva query strings en el callbackUrl pasado", async () => {
        const { auth } = await import("@/auth");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(auth).mockResolvedValue(null as any);

        const { requireSesion } = await import("@/lib/auth-guard");
        await expect(requireSesion("/admin/distribuciones?page=2")).rejects.toThrow(
            // URLSearchParams encodea el `?` y el `=` del query interno.
            "__REDIRECT__:/login?callbackUrl=%2Fadmin%2Fdistribuciones%3Fpage%3D2",
        );
    });
});
