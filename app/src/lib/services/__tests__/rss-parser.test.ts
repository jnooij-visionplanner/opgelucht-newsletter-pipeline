import { describe, it, expect, vi, beforeEach } from "vitest";
import { toNewsItem, type ParsedFeedItem } from "../rss-parser";

// Mock the rss-parser library with a proper class constructor
vi.mock("rss-parser", () => {
  return {
    default: class MockRssParser {
      parseURL = vi.fn();
    },
  };
});

describe("toNewsItem", () => {
  it("should convert a parsed feed item to a NewNewsItem", () => {
    const item: ParsedFeedItem = {
      guid: "abc-123",
      title: "Test Article",
      sourceName: "example.com",
      originalUrl: "https://example.com/article",
      publishedDate: "2025-01-01T12:00:00.000Z",
      snippet: "A short snippet",
    };

    const result = toNewsItem(item, 42);

    expect(result).toEqual({
      rssFeedId: 42,
      guid: "abc-123",
      title: "Test Article",
      sourceName: "example.com",
      originalUrl: "https://example.com/article",
      publishedDate: "2025-01-01T12:00:00.000Z",
      snippet: "A short snippet",
    });
  });

  it("should handle null guid and snippet", () => {
    const item: ParsedFeedItem = {
      guid: null,
      title: "No GUID Article",
      sourceName: null,
      originalUrl: "https://example.com/article2",
      publishedDate: "2025-01-01T00:00:00.000Z",
      snippet: null,
    };

    const result = toNewsItem(item, 1);

    expect(result.guid).toBeNull();
    expect(result.snippet).toBeNull();
    expect(result.sourceName).toBeNull();
    expect(result.rssFeedId).toBe(1);
  });
});

describe("parseFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { parseFeed } = await import("../rss-parser");
    expect(parseFeed).toBeDefined();
    expect(typeof parseFeed).toBe("function");
  });
});
