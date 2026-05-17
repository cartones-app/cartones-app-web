import { describe, expect, it } from "vitest";

import { rolesIncluyeAdmin } from "@/lib/auth-roles";

describe("rolesIncluyeAdmin", () => {
    it("devuelve false para undefined / vacío", () => {
        expect(rolesIncluyeAdmin(undefined)).toBe(false);
        expect(rolesIncluyeAdmin([])).toBe(false);
    });

    it("detecta 'admin' case-insensitive", () => {
        expect(rolesIncluyeAdmin(["admin"])).toBe(true);
        expect(rolesIncluyeAdmin(["ADMIN"])).toBe(true);
        expect(rolesIncluyeAdmin(["Admin"])).toBe(true);
    });

    it("admin como uno de varios roles", () => {
        expect(rolesIncluyeAdmin(["distribuidor", "admin"])).toBe(true);
    });

    it("false si no hay admin", () => {
        expect(rolesIncluyeAdmin(["distribuidor"])).toBe(false);
        expect(rolesIncluyeAdmin(["user", "viewer"])).toBe(false);
    });

    it("no matchea substrings (administrator no es admin)", () => {
        // El Set usa equality estricta — esto es deseado para no confundir
        // `administrator` (otro role nombre) con `admin`.
        expect(rolesIncluyeAdmin(["administrator"])).toBe(false);
    });
});
