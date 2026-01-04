import { describe, it, expect } from "vitest";
import { localePath } from "../locale-path";

describe("localePath", () => {
  it("prefixes zh routes with /zh", () => {
    expect(localePath("zh", "/")).toBe("/zh");
    expect(localePath("zh", "/moments")).toBe("/zh/moments");
    expect(localePath("zh", "moments/archive")).toBe("/zh/moments/archive");
  });

  it("keeps en routes prefix-free", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/moments")).toBe("/moments");
    expect(localePath("en", "moments")).toBe("/moments");
  });
});
