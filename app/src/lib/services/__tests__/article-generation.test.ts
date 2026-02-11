/**
 * Tests for Article Generation Service
 *
 * Issue #24 — Article Draft Generation (Standard Pattern)
 * Issue #41 — Title & Intro Validation and Regeneration
 */

import { describe, it, expect } from "vitest";
import {
  buildSourceListHtml,
  parseGeneratedArticle,
  validateLimits,
  truncateAtWordBoundary,
} from "../article-generation";

describe("Article Generation Service", () => {
  describe("buildSourceListHtml", () => {
    it("should build HTML source list sorted newest first", () => {
      const items = [
        {
          title: "Oud artikel",
          originalUrl: "https://nos.nl/oud",
          sourceName: "NOS",
          publishedDate: "2026-02-08T10:00:00.000Z",
        },
        {
          title: "Nieuwste artikel",
          originalUrl: "https://rtv.nl/nieuw",
          sourceName: "RTV",
          publishedDate: "2026-02-10T10:00:00.000Z",
        },
        {
          title: "Middel artikel",
          originalUrl: "https://ad.nl/middel",
          sourceName: "AD",
          publishedDate: "2026-02-09T10:00:00.000Z",
        },
      ];

      const html = buildSourceListHtml(items);

      expect(html).toContain("<ul>");
      expect(html).toContain("</ul>");
      expect(html).toContain('target="_blank"');

      // Verify order: newest first
      const nieuwIndex = html.indexOf("Nieuwste artikel");
      const midIndex = html.indexOf("Middel artikel");
      const oudIndex = html.indexOf("Oud artikel");
      expect(nieuwIndex).toBeLessThan(midIndex);
      expect(midIndex).toBeLessThan(oudIndex);
    });

    it("should escape HTML in titles and URLs", () => {
      const items = [
        {
          title: 'Test <script>alert("xss")</script>',
          originalUrl: "https://example.com/test?a=1&b=2",
          sourceName: 'Source "quoted"',
          publishedDate: "2026-02-10T10:00:00.000Z",
        },
      ];

      const html = buildSourceListHtml(items);

      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("a=1&amp;b=2");
      expect(html).toContain("&quot;quoted&quot;");
    });

    it("should handle items with null sourceName", () => {
      const items = [
        {
          title: "Test",
          originalUrl: "https://example.com",
          sourceName: null,
          publishedDate: "2026-02-10T10:00:00.000Z",
        },
      ];

      const html = buildSourceListHtml(items);
      expect(html).toContain("Onbekend");
    });
  });

  describe("parseGeneratedArticle", () => {
    it("should parse a well-formed LLM response", () => {
      const response = `TITEL: Rookverbod in parken uitgebreid
INTRODUCTIE: Amsterdam breidt het rookverbod uit naar alle openbare parken.
NARRATIEF:
<p>De gemeente Amsterdam heeft besloten het rookverbod uit te breiden.</p>
<p>Dit geldt vanaf volgende maand.</p>`;

      const parsed = parseGeneratedArticle(response);

      expect(parsed.title).toBe("Rookverbod in parken uitgebreid");
      expect(parsed.introduction).toBe(
        "Amsterdam breidt het rookverbod uit naar alle openbare parken."
      );
      expect(parsed.narrativeSummary).toContain("<p>De gemeente Amsterdam");
      expect(parsed.narrativeSummary).toContain("volgende maand.</p>");
    });

    it("should handle response with extra whitespace", () => {
      const response = `TITEL:   Kort Titel  
INTRODUCTIE:   Beknopte introductie  
NARRATIEF:
<p>Tekst hier.</p>`;

      const parsed = parseGeneratedArticle(response);

      expect(parsed.title).toBe("Kort Titel");
      expect(parsed.introduction).toBe("Beknopte introductie");
    });

    it("should return empty strings for unparseable response", () => {
      const response = "Dit is geen geldig formaat";

      const parsed = parseGeneratedArticle(response);

      expect(parsed.title).toBe("");
      expect(parsed.introduction).toBe("");
      expect(parsed.narrativeSummary).toBe("");
    });
  });

  describe("validateLimits", () => {
    it("should pass valid title and intro", () => {
      const result = validateLimits("Kort titel", "Korte intro tekst");

      expect(result.titleValid).toBe(true);
      expect(result.introValid).toBe(true);
    });

    it("should detect title over limit (36 chars)", () => {
      const longTitle = "Dit is een veel te lange titel voor het artikel hier";
      expect(longTitle.length).toBeGreaterThan(36);

      const result = validateLimits(longTitle, "OK intro");

      expect(result.titleValid).toBe(false);
      expect(result.introValid).toBe(true);
      expect(result.titleLength).toBe(longTitle.length);
    });

    it("should detect intro over limit (175 chars)", () => {
      const longIntro = "A".repeat(176);

      const result = validateLimits("Kort", longIntro);

      expect(result.titleValid).toBe(true);
      expect(result.introValid).toBe(false);
      expect(result.introLength).toBe(176);
    });

    it("should handle exact limit values", () => {
      const title36 = "A".repeat(36);
      const intro175 = "B".repeat(175);

      const result = validateLimits(title36, intro175);

      expect(result.titleValid).toBe(true);
      expect(result.introValid).toBe(true);
    });

    it("should handle Unicode characters correctly", () => {
      // Dutch characters should count as 1 each
      const title = "Régels für éénheid";
      const result = validateLimits(title, "Introductie");

      expect(result.titleLength).toBe(title.length);
      expect(result.titleValid).toBe(true);
    });
  });

  describe("truncateAtWordBoundary", () => {
    it("should not truncate text within limit", () => {
      const text = "Korte tekst";
      expect(truncateAtWordBoundary(text, 36)).toBe(text);
    });

    it("should truncate at word boundary with ellipsis", () => {
      const text = "Dit is een veel te lange titel voor het artikel dat we schrijven";
      const truncated = truncateAtWordBoundary(text, 36);

      expect(truncated.length).toBeLessThanOrEqual(36);
      expect(truncated).toMatch(/\.\.\.$/);
    });

    it("should hard truncate when no good word boundary", () => {
      const text = "Eenheellangetitelzonderenkelespatie";
      const truncated = truncateAtWordBoundary(text, 20);

      expect(truncated.length).toBeLessThanOrEqual(20);
      expect(truncated).toMatch(/\.\.\.$/);
    });

    it("should handle empty string", () => {
      expect(truncateAtWordBoundary("", 36)).toBe("");
    });
  });
});
