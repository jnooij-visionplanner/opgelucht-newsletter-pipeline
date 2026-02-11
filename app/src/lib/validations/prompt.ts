/**
 * Prompt Management Validation Schemas
 *
 * Zod schemas for system prompt CRUD operations.
 * Issue #36 — Prompt Management Screen with Versioning
 */

import { z } from "zod";

export const createPromptSchema = z.object({
  name: z
    .string()
    .min(1, "Naam is verplicht")
    .max(200, "Naam mag maximaal 200 tekens zijn"),
  content: z
    .string()
    .min(10, "Prompt moet minimaal 10 tekens bevatten")
    .max(10000, "Prompt mag maximaal 10.000 tekens zijn"),
  comment: z
    .string()
    .max(500, "Opmerking mag maximaal 500 tekens zijn")
    .optional()
    .nullable(),
});

export const updatePromptSchema = z.object({
  content: z
    .string()
    .min(10, "Prompt moet minimaal 10 tekens bevatten")
    .max(10000, "Prompt mag maximaal 10.000 tekens zijn"),
  comment: z
    .string()
    .max(500, "Opmerking mag maximaal 500 tekens zijn")
    .optional()
    .nullable(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
