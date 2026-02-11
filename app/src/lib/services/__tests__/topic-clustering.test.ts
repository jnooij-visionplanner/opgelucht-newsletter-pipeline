import { describe, it, expect } from "vitest";
import {
  tokenize,
  buildTfIdf,
  cosineSimilarity,
  clusterDocuments,
} from "../topic-clustering";

describe("Topic Clustering", () => {
  describe("tokenize", () => {
    it("should tokenize Dutch text and remove stop words", () => {
      const tokens = tokenize("De grote rookvrij wetgeving in Nederland");
      expect(tokens).not.toContain("de");
      expect(tokens).not.toContain("in");
      expect(tokens).toContain("grote");
      expect(tokens).toContain("rookvrij");
      expect(tokens).toContain("wetgeving");
      expect(tokens).toContain("nederland");
    });

    it("should handle empty text", () => {
      expect(tokenize("")).toEqual([]);
    });

    it("should lowercase and strip punctuation", () => {
      const tokens = tokenize("COVID-19: Strenge Regels!");
      expect(tokens).toContain("covid");
      expect(tokens).toContain("strenge");
      expect(tokens).toContain("regels");
    });

    it("should filter short words (<=2 chars)", () => {
      const tokens = tokenize("a is de to at");
      expect(tokens).toHaveLength(0);
    });
  });

  describe("buildTfIdf", () => {
    it("should build TF-IDF vectors for documents", () => {
      const docs = [
        ["rookvrij", "wetgeving", "nederland"],
        ["vapen", "verbod", "amsterdam"],
        ["rookvrij", "verbod", "beleid"],
      ];

      const matrix = buildTfIdf(docs);
      expect(matrix.size).toBe(3);

      // "rookvrij" appears in 2 docs, so IDF < ln(3/1)
      const doc0 = matrix.get(0)!;
      expect(doc0.has("rookvrij")).toBe(true);
      expect(doc0.has("wetgeving")).toBe(true);
    });

    it("should return empty map for empty input", () => {
      const matrix = buildTfIdf([]);
      expect(matrix.size).toBe(0);
    });
  });

  describe("cosineSimilarity", () => {
    it("should return 1.0 for identical vectors", () => {
      const a = new Map([
        ["rookvrij", 0.5],
        ["verbod", 0.3],
      ]);
      const sim = cosineSimilarity(a, a);
      expect(sim).toBeCloseTo(1.0, 5);
    });

    it("should return 0.0 for orthogonal vectors", () => {
      const a = new Map([["rookvrij", 0.5]]);
      const b = new Map([["vapen", 0.5]]);
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it("should return value between 0 and 1 for partially similar vectors", () => {
      const a = new Map([
        ["rookvrij", 0.5],
        ["verbod", 0.3],
      ]);
      const b = new Map([
        ["rookvrij", 0.4],
        ["amsterdam", 0.6],
      ]);
      const sim = cosineSimilarity(a, b);
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1);
    });

    it("should handle empty vectors", () => {
      const empty = new Map<string, number>();
      const a = new Map([["rookvrij", 0.5]]);
      expect(cosineSimilarity(empty, a)).toBe(0);
      expect(cosineSimilarity(a, empty)).toBe(0);
    });
  });

  describe("clusterDocuments", () => {
    it("should cluster similar documents together", () => {
      // Create docs where first two are about the same topic
      const docs = [
        ["rookvrij", "wetgeving", "nederland", "verbod"],
        ["rookvrij", "beleid", "nederland", "regelgeving"],
        ["vapen", "amsterdam", "jongeren", "school"],
      ];

      const matrix = buildTfIdf(docs);
      const clusters = clusterDocuments(matrix, 0.1);

      // Should have at least 1 cluster (may be 2 or 3 depending on threshold)
      expect(clusters.length).toBeGreaterThanOrEqual(1);
      expect(clusters.length).toBeLessThanOrEqual(3);

      // All items should be assigned
      const allItems = clusters.flat();
      expect(allItems.sort()).toEqual([0, 1, 2]);
    });

    it("should create individual clusters for very different docs", () => {
      const docs = [
        ["alpha", "beta", "gamma"],
        ["delta", "epsilon", "zeta"],
      ];

      const matrix = buildTfIdf(docs);
      const clusters = clusterDocuments(matrix, 0.9);

      // With high threshold, each doc should be its own cluster
      expect(clusters.length).toBe(2);
    });

    it("should handle single document", () => {
      const docs = [["rookvrij", "wetgeving"]];
      const matrix = buildTfIdf(docs);
      const clusters = clusterDocuments(matrix);

      expect(clusters.length).toBe(1);
      expect(clusters[0]).toEqual([0]);
    });

    it("should handle empty input", () => {
      const matrix = new Map<number, Map<string, number>>();
      const clusters = clusterDocuments(matrix);
      expect(clusters).toEqual([]);
    });
  });
});
