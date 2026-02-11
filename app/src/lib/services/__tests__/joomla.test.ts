import { describe, it, expect, vi, beforeEach } from "vitest";
import { pushToJoomla } from "../joomla";

describe("Joomla Push Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("pushToJoomla", () => {
    const baseParams = {
      title: "Test Artikel",
      introduction: "Dit is een test introductie",
      narrativeSummary: "<p>Test narratief</p>",
      sourceListHtml: "<ul><li>Bron 1</li></ul>",
      categoryExternalId: 5,
    };

    it("should throw if JOOMLA_API_URL is missing", async () => {
      vi.stubEnv("JOOMLA_API_URL", "");
      vi.stubEnv("JOOMLA_API_TOKEN", "test-token");

      await expect(pushToJoomla(baseParams)).rejects.toThrow(
        /Joomla configuratie ontbreekt/
      );
    });

    it("should throw if JOOMLA_API_TOKEN is missing", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://example.com");
      vi.stubEnv("JOOMLA_API_TOKEN", "");

      await expect(pushToJoomla(baseParams)).rejects.toThrow(
        /Joomla configuratie ontbreekt/
      );
    });

    it("should push article successfully", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://joomla.example.com");
      vi.stubEnv("JOOMLA_API_TOKEN", "test-token-123");

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 42 } }),
      } as Response);

      const result = await pushToJoomla(baseParams);

      expect(result.success).toBe(true);
      expect(result.joomlaArticleId).toBe(42);
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://joomla.example.com/api/index.php/v1/content/articles"
      );
      expect(options?.method).toBe("POST");
      expect(options?.headers).toEqual(
        expect.objectContaining({
          Authorization: "Bearer test-token-123",
          "Content-Type": "application/json",
        })
      );

      const body = JSON.parse(options?.body as string);
      expect(body.title).toBe("Test Artikel");
      expect(body.introtext).toBe("Dit is een test introductie");
      expect(body.catid).toBe(5);
      expect(body.state).toBe(0); // unpublished
      expect(body.language).toBe("nl-NL");
    });

    it("should use default catid when no external ID provided", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://joomla.example.com");
      vi.stubEnv("JOOMLA_API_TOKEN", "token");

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      } as Response);

      await pushToJoomla({ ...baseParams, categoryExternalId: null });

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.catid).toBe(2); // default Joomla catid
    });

    it("should return failure on HTTP error", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://joomla.example.com");
      vi.stubEnv("JOOMLA_API_TOKEN", "token");

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      } as Response);

      const result = await pushToJoomla(baseParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain("403");
    });

    it("should return failure on network error", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://joomla.example.com");
      vi.stubEnv("JOOMLA_API_TOKEN", "token");

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await pushToJoomla(baseParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("should build fulltext with sources included", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://joomla.example.com");
      vi.stubEnv("JOOMLA_API_TOKEN", "token");

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 99 } }),
      } as Response);

      await pushToJoomla(baseParams);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.fulltext).toContain("<p>Test narratief</p>");
      expect(body.fulltext).toContain("<h3>Bronnen</h3>");
      expect(body.fulltext).toContain("<ul><li>Bron 1</li></ul>");
    });

    it("should strip trailing slash from API URL", async () => {
      vi.stubEnv("JOOMLA_API_URL", "https://joomla.example.com/");
      vi.stubEnv("JOOMLA_API_TOKEN", "token");

      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 1 } }),
      } as Response);

      await pushToJoomla(baseParams);

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe(
        "https://joomla.example.com/api/index.php/v1/content/articles"
      );
    });
  });
});
