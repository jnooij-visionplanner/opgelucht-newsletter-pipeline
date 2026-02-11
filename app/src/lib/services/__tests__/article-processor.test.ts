import { describe, it, expect } from "vitest";

describe("Article Processing Pipeline", () => {
  it("should export processAllItems", async () => {
    // Dynamic import to avoid DB initialization in test
    const mod = await import("../article-processor");
    expect(mod.processAllItems).toBeDefined();
    expect(typeof mod.processAllItems).toBe("function");
  });

  it("should export processSingleItem", async () => {
    const mod = await import("../article-processor");
    expect(mod.processSingleItem).toBeDefined();
    expect(typeof mod.processSingleItem).toBe("function");
  });
});
