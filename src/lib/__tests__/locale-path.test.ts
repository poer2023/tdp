import { describe, it, expect } from "vitest";
import { localePath } from "../locale-path";

describe("localePath", () => {
  it("prefixes zh routes with /zh", () => {
    expect(localePath("zh", "/")).toBe("/zh");
    expect(localePath("zh", "/m")).toBe("/zh/m");
    expect(localePath("zh", "m/archive")).toBe("/zh/m/archive");
  });

  it("prefixes en routes with /en", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/m")).toBe("/en/m");
    expect(localePath("en", "m")).toBe("/en/m");
  });
});
