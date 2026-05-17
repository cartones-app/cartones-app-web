import { describe, expect, it } from "vitest";

import { shortId } from "@/lib/format-id";

describe("shortId", () => {
    it('devuelve "—" si el id es null/undefined/empty', () => {
        expect(shortId(null)).toBe("—");
        expect(shortId(undefined)).toBe("—");
        expect(shortId("")).toBe("—");
    });

    it("trunca a 8 chars + ellipsis por default", () => {
        expect(shortId("9b36cd48-1234-5678")).toBe("9b36cd48…");
    });

    it("respeta `len` custom", () => {
        expect(shortId("abcdefghij", 4)).toBe("abcd…");
    });

    it("devuelve el id sin truncar si es más corto que len", () => {
        expect(shortId("abc")).toBe("abc");
        expect(shortId("12345678")).toBe("12345678"); // exactamente len
    });
});
