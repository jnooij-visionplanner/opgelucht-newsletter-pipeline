import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock jsdom and Readability before importing
vi.mock("jsdom", () => ({
  JSDOM: class MockJSDOM {
    window: { document: Record<string, unknown> };
    constructor() {
      this.window = { document: {} };
    }
  },
}));

vi.mock("@mozilla/readability", () => ({
  Readability: class MockReadability {
    private doc: Record<string, unknown>;
    constructor(doc: Record<string, unknown>) {
      this.doc = doc;
    }
    parse() {
      return {
        title: "Test Article",
        textContent: "This is the full article content extracted by readability.",
        excerpt: "A short excerpt",
        siteName: "Test Site",
      };
    }
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("extractContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract content from a URL successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "<html><body><article>Test content</article></body></html>",
    });

    const { extractContent } = await import("../content-extractor");
    const result = await extractContent("https://example.com/article");

    expect(result.success).toBe(true);
    expect(result.content).toBeTruthy();
    expect(result.title).toBe("Test Article");
    expect(result.siteName).toBe("Test Site");
  });

  it("should prefer archiveUrl over originalUrl", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "<html><body>Archive content</body></html>",
    });

    const { extractContent } = await import("../content-extractor");
    const result = await extractContent(
      "https://fd.nl/article",
      "https://archive.ph/abc123"
    );

    expect(result.success).toBe(true);
    expect(result.urlUsed).toBe("https://archive.ph/abc123");
  });

  it("should fall back to originalUrl if archiveUrl fails", async () => {
    // Archive URL fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    // Original URL succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "<html><body>Original content</body></html>",
    });

    const { extractContent } = await import("../content-extractor");
    const result = await extractContent(
      "https://nos.nl/article",
      "https://archive.ph/broken"
    );

    expect(result.success).toBe(true);
    expect(result.urlUsed).toBe("https://nos.nl/article");
  });

  it("should handle network errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network timeout"));

    const { extractContent } = await import("../content-extractor");
    const result = await extractContent("https://example.com/broken");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("should handle HTTP errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    const { extractContent } = await import("../content-extractor");
    const result = await extractContent("https://example.com/forbidden");

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.content).toBeNull();
  });
});
