import { describe, it, expect } from "vitest";
import {
  mergeClusterSchema,
  splitClusterSchema,
  generateArticleSchema,
  classifyItemSchema,
  categorizeItemSchema,
  regenerateArticleSchema,
  paginationSchema,
  idParamSchema,
  formatZodError,
} from "../api-schemas";
import { z } from "zod";

describe("API Schema Validation", () => {
  // ── mergeClusterSchema ──────────────────────────────────────────────

  describe("mergeClusterSchema", () => {
    it("should accept valid cluster IDs", () => {
      const result = mergeClusterSchema.safeParse({ clusterIds: [1, 2] });
      expect(result.success).toBe(true);
    });

    it("should accept three or more cluster IDs", () => {
      const result = mergeClusterSchema.safeParse({
        clusterIds: [1, 2, 3, 4],
      });
      expect(result.success).toBe(true);
    });

    it("should reject less than 2 cluster IDs", () => {
      const result = mergeClusterSchema.safeParse({ clusterIds: [1] });
      expect(result.success).toBe(false);
    });

    it("should reject empty array", () => {
      const result = mergeClusterSchema.safeParse({ clusterIds: [] });
      expect(result.success).toBe(false);
    });

    it("should reject non-positive IDs", () => {
      const result = mergeClusterSchema.safeParse({ clusterIds: [0, 1] });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer IDs", () => {
      const result = mergeClusterSchema.safeParse({ clusterIds: [1.5, 2] });
      expect(result.success).toBe(false);
    });

    it("should reject missing clusterIds", () => {
      const result = mergeClusterSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── splitClusterSchema ──────────────────────────────────────────────

  describe("splitClusterSchema", () => {
    const validSplit = {
      clusterId: 1,
      newClusters: [
        { title: "Cluster A", itemIds: [1, 2] },
        { title: "Cluster B", itemIds: [3, 4] },
      ],
    };

    it("should accept valid split input", () => {
      const result = splitClusterSchema.safeParse(validSplit);
      expect(result.success).toBe(true);
    });

    it("should reject fewer than 2 new clusters", () => {
      const result = splitClusterSchema.safeParse({
        clusterId: 1,
        newClusters: [{ title: "Only one", itemIds: [1] }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const result = splitClusterSchema.safeParse({
        clusterId: 1,
        newClusters: [
          { title: "", itemIds: [1] },
          { title: "Valid", itemIds: [2] },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty itemIds", () => {
      const result = splitClusterSchema.safeParse({
        clusterId: 1,
        newClusters: [
          { title: "A", itemIds: [] },
          { title: "B", itemIds: [1] },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-positive clusterId", () => {
      const result = splitClusterSchema.safeParse({
        clusterId: 0,
        newClusters: validSplit.newClusters,
      });
      expect(result.success).toBe(false);
    });

    it("should reject title over 500 chars", () => {
      const result = splitClusterSchema.safeParse({
        clusterId: 1,
        newClusters: [
          { title: "A".repeat(501), itemIds: [1] },
          { title: "B", itemIds: [2] },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  // ── generateArticleSchema ───────────────────────────────────────────

  describe("generateArticleSchema", () => {
    it("should accept valid clusterId", () => {
      const result = generateArticleSchema.safeParse({ clusterId: 1 });
      expect(result.success).toBe(true);
    });

    it("should reject zero", () => {
      const result = generateArticleSchema.safeParse({ clusterId: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject negative", () => {
      const result = generateArticleSchema.safeParse({ clusterId: -5 });
      expect(result.success).toBe(false);
    });

    it("should reject missing clusterId", () => {
      const result = generateArticleSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── classifyItemSchema ──────────────────────────────────────────────

  describe("classifyItemSchema", () => {
    it("should accept valid itemId", () => {
      const result = classifyItemSchema.safeParse({ itemId: 42 });
      expect(result.success).toBe(true);
    });

    it("should reject zero", () => {
      const result = classifyItemSchema.safeParse({ itemId: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject missing itemId", () => {
      const result = classifyItemSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── categorizeItemSchema ────────────────────────────────────────────

  describe("categorizeItemSchema", () => {
    it("should accept valid itemId", () => {
      const result = categorizeItemSchema.safeParse({ itemId: 10 });
      expect(result.success).toBe(true);
    });

    it("should reject non-integer", () => {
      const result = categorizeItemSchema.safeParse({ itemId: 3.14 });
      expect(result.success).toBe(false);
    });
  });

  // ── regenerateArticleSchema ─────────────────────────────────────────

  describe("regenerateArticleSchema", () => {
    it("should accept empty input (instructions optional)", () => {
      const result = regenerateArticleSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.instructions).toBe("");
      }
    });

    it("should accept custom instructions", () => {
      const result = regenerateArticleSchema.safeParse({
        instructions: "Maak het korter",
      });
      expect(result.success).toBe(true);
    });

    it("should reject instructions over 2000 chars", () => {
      const result = regenerateArticleSchema.safeParse({
        instructions: "A".repeat(2001),
      });
      expect(result.success).toBe(false);
    });
  });

  // ── paginationSchema ───────────────────────────────────────────────

  describe("paginationSchema", () => {
    it("should apply defaults", () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it("should accept valid values", () => {
      const result = paginationSchema.safeParse({ limit: 20, offset: 40 });
      expect(result.success).toBe(true);
    });

    it("should coerce string values", () => {
      const result = paginationSchema.safeParse({
        limit: "25",
        offset: "10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(10);
      }
    });

    it("should reject limit over 200", () => {
      const result = paginationSchema.safeParse({ limit: 201 });
      expect(result.success).toBe(false);
    });

    it("should reject limit of 0", () => {
      const result = paginationSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const result = paginationSchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });
  });

  // ── idParamSchema ──────────────────────────────────────────────────

  describe("idParamSchema", () => {
    it("should accept positive integers", () => {
      const result = idParamSchema.safeParse(5);
      expect(result.success).toBe(true);
    });

    it("should coerce strings to numbers", () => {
      const result = idParamSchema.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("should reject zero", () => {
      const result = idParamSchema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("should reject negative", () => {
      const result = idParamSchema.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric strings", () => {
      const result = idParamSchema.safeParse("abc");
      expect(result.success).toBe(false);
    });
  });

  // ── formatZodError ─────────────────────────────────────────────────

  describe("formatZodError", () => {
    it("should format a single error", () => {
      const result = mergeClusterSchema.safeParse({ clusterIds: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = formatZodError(result.error);
        expect(msg).toContain("Minimaal 2 clusters");
      }
    });

    it("should join multiple errors with semicolons", () => {
      const result = splitClusterSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = formatZodError(result.error);
        expect(msg).toContain(";");
      }
    });
  });
});
