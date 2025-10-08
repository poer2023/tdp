import { describe, it, expect } from "vitest";
import { resolveAboutLocale } from "../about-content";

describe("resolveAboutLocale", () => {
  it("returns zh for zh, otherwise en", () => {
    expect(resolveAboutLocale("zh")).toBe("zh");
    expect(resolveAboutLocale("en")).toBe("en");
    expect(resolveAboutLocale(undefined)).toBe("en");
    expect(resolveAboutLocale("fr")).toBe("en");
  });
});
