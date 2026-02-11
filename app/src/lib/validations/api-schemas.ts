import { z } from "zod";

/**
 * API input validation schemas
 *
 * Centralized Zod schemas for all API endpoints that accept input.
 * Issue #30 — Security Requirements (NFR-013 Input Validation)
 */

// ── Cluster operations ─────────────────────────────────────────────────

export const mergeClusterSchema = z.object({
  clusterIds: z
    .array(z.number().int().positive())
    .min(2, "Minimaal 2 clusters vereist voor samenvoegen"),
});

export const splitClusterSchema = z.object({
  clusterId: z.number().int().positive("clusterId is verplicht"),
  newClusters: z
    .array(
      z.object({
        title: z.string().min(1, "Titel is verplicht").max(500),
        itemIds: z
          .array(z.number().int().positive())
          .min(1, "Elk cluster moet items bevatten"),
      })
    )
    .min(2, "Minimaal 2 nieuwe clusters vereist voor splitsen"),
});

// ── Generation & classification ────────────────────────────────────────

export const generateArticleSchema = z.object({
  clusterId: z.number().int().positive("clusterId is verplicht"),
});

export const classifyItemSchema = z.object({
  itemId: z.number().int().positive("itemId is verplicht"),
});

export const categorizeItemSchema = z.object({
  itemId: z.number().int().positive("itemId is verplicht"),
});

// ── Article operations ─────────────────────────────────────────────────

export const regenerateArticleSchema = z.object({
  instructions: z.string().max(2000).optional().default(""),
});

// ── Query parameter schemas ────────────────────────────────────────────

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.coerce.number().int().positive("Ongeldig ID");

// ── Helper for consistent error responses ──────────────────────────────

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join("; ");
}
