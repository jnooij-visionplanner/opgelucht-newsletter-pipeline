import { describe, it, expect } from "vitest";
import {
  createRssFeedSchema,
  updateRssFeedSchema,
} from "@/lib/validations/rss-feed";

describe("createRssFeedSchema", () => {
  it("should accept valid input", () => {
    const result = createRssFeedSchema.safeParse({
      url: "https://www.google.com/alerts/feeds/123",
      searchTermLabel: "roken",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing url", () => {
    const result = createRssFeedSchema.safeParse({
      searchTermLabel: "roken",
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing searchTermLabel", () => {
    const result = createRssFeedSchema.safeParse({
      url: "https://example.com/feed.xml",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL", () => {
    const result = createRssFeedSchema.safeParse({
      url: "not-a-url",
      searchTermLabel: "test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject ftp:// URLs", () => {
    const result = createRssFeedSchema.safeParse({
      url: "ftp://example.com/feed.xml",
      searchTermLabel: "test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty searchTermLabel", () => {
    const result = createRssFeedSchema.safeParse({
      url: "https://example.com/feed.xml",
      searchTermLabel: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject searchTermLabel over 100 chars", () => {
    const result = createRssFeedSchema.safeParse({
      url: "https://example.com/feed.xml",
      searchTermLabel: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("should accept http:// URL", () => {
    const result = createRssFeedSchema.safeParse({
      url: "http://example.com/feed.xml",
      searchTermLabel: "test",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateRssFeedSchema", () => {
  it("should accept partial updates", () => {
    const result = updateRssFeedSchema.safeParse({
      searchTermLabel: "new label",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty object", () => {
    const result = updateRssFeedSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept isActive boolean", () => {
    const result = updateRssFeedSchema.safeParse({
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL in update", () => {
    const result = updateRssFeedSchema.safeParse({
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
