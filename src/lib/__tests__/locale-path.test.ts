import { describe, it, expect } from "vitest";
import { localePath } from "../locale-path";

describe("localePath", () => {
  it("prefixes zh routes with /zh", () => {
    expect(localePath("zh", "/")).toBe("/zh");
    expect(localePath("zh", "/m")).toBe("/zh/m");
    expect(localePath("zh", "m/archive")).toBe("/zh/m/archive");
  });

  it("keeps en routes prefix-free", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/m")).toBe("/m");
    expect(localePath("en", "m")).toBe("/m");
  });
});
