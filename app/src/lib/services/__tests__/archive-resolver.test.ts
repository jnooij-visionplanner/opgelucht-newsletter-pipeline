import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolvePaywall, detectPaywall } from "../archive-resolver";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("resolvePaywall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return archiveUrl on first successful service", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      url: "https://archive.ph/abc123",
      status: 200,
    });

    const result = await resolvePaywall("https://fd.nl/article-123");

    expect(result.archiveUrl).toBe("https://archive.ph/abc123");
    expect(result.service).toBe("archive.ph");
    expect(result.attempted).toEqual(["archive.ph"]);
  });

  it("should fall through to next service on failure", async () => {
    // archive.ph fails (submit redirect)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      url: "https://archive.ph/submit/",
      status: 200,
    });

    // 1ft.io succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      url: "https://1ft.io/https%3A%2F%2Ffd.nl%2Farticle-123",
      status: 200,
    });

    const result = await resolvePaywall("https://fd.nl/article-123");

    expect(result.service).toBe("1ft.io");
    expect(result.attempted).toContain("archive.ph");
    expect(result.attempted).toContain("1ft.io");
    expect(result.archiveUrl).toBeTruthy();
  });

  it("should return null when all services fail", async () => {
    // All services return not-ok
    mockFetch.mockResolvedValue({ ok: false, url: "", status: 404 });

    const result = await resolvePaywall("https://fd.nl/article-123");

    expect(result.archiveUrl).toBeNull();
    expect(result.service).toBeNull();
    expect(result.attempted.length).toBe(4);
  });

  it("should handle network errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await resolvePaywall("https://fd.nl/article-123");

    expect(result.archiveUrl).toBeNull();
    expect(result.errors.length).toBe(4);
    expect(result.errors[0]).toContain("archive.ph: Network error");
  });
});

describe("detectPaywall", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should detect known paywalled domains", async () => {
    const result = await detectPaywall("https://www.fd.nl/article-123");
    expect(result).toBe(true);
  });

  it("should detect known paywalled domains without www", async () => {
    const result = await detectPaywall("https://nrc.nl/article-123");
    expect(result).toBe(true);
  });

  it("should return false for unknown domains when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Timeout"));

    const result = await detectPaywall("https://nos.nl/article-123");
    expect(result).toBe(false);
  });

  it("should detect paywall from HTML content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '<html><body><div class="paywall">Subscribe</div></body></html>',
    });

    const result = await detectPaywall("https://some-news.nl/article");
    expect(result).toBe(true);
  });

  it("should return false for non-paywalled content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => "<html><body><article>Free content here</article></body></html>",
    });

    const result = await detectPaywall("https://nos.nl/article");
    expect(result).toBe(false);
  });

  it("should detect HTTP 402", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      text: async () => "",
    });

    const result = await detectPaywall("https://some-site.com/premium");
    expect(result).toBe(true);
  });
});
