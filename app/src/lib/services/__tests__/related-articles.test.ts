/**
 * Tests for Related Article Enrichment Service
 *
 * Issue #23 — Related Article Enrichment (Past Month Search)
 */

import { describe, it, expect } from "vitest";
import { extractKeywords, formatRelatedContext } from "../related-articles";

describe("Related Articles Service", () => {
  describe("extractKeywords", () => {
    it("should extract meaningful keywords from items", () => {
      const items = [
        { title: "Rookverbod Amsterdam uitgebreid", snippet: "Het rookverbod in Amsterdam wordt uitgebreid naar parken en speeltuinen." },
        { title: "Amsterdam scherpt rookbeleid aan", snippet: "De gemeente Amsterdam wil strenger optreden tegen roken in openbare ruimtes." },
      ];

      const keywords = extractKeywords(items);

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(8);
      // "amsterdam" should be a top keyword (appears in both)
      expect(keywords).toContain("amsterdam");
    });

    it("should return empty array for empty items", () => {
      const keywords = extractKeywords([]);
      expect(keywords).toEqual([]);
    });

    it("should filter out short words", () => {
      const items = [
        { title: "De EU en NL beleid op tabak wetgeving", snippet: null },
      ];

      const keywords = extractKeywords(items);
      // Short words like "eu", "nl" should be filtered (< 3 chars)
      for (const keyword of keywords) {
        expect(keyword.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("should limit keywords to MAX_KEYWORDS", () => {
      const items = [
        {
          title: "Tabakswetgeving gezondheid preventie regulering handhaving vergunning inspectie",
          snippet: "Milieu kwaliteit onderzoek rapport conclusie aanbeveling implementatie uitvoering controle toezicht evaluatie",
        },
      ];

      const keywords = extractKeywords(items);
      expect(keywords.length).toBeLessThanOrEqual(8);
    });
  });

  describe("formatRelatedContext", () => {
    it("should format related articles as context string", () => {
      const articles = [
        {
          id: 1,
          rssFeedId: 1,
          guid: null,
          title: "Eerder bericht over rookverbod",
          sourceName: "NOS",
          originalUrl: "https://nos.nl/test",
          archiveUrl: null,
          publishedDate: "2026-01-15T10:00:00.000Z",
          snippet: "Vorig maand werd het verbod aangekondigd",
          fullContent: null,
          isPaywalled: false,
          paywallResolved: false,
          isSelected: false,
          topicClusterId: null,
          crawledAt: "2026-01-15T10:00:00.000Z",
        },
      ];

      const context = formatRelatedContext(articles);

      expect(context).toContain("GERELATEERDE EERDERE BERICHTGEVING");
      expect(context).toContain("Eerder bericht over rookverbod");
      expect(context).toContain("NOS");
      expect(context).toContain("2026-01-15");
    });

    it("should return empty string for no related articles", () => {
      const context = formatRelatedContext([]);
      expect(context).toBe("");
    });
  });
});
