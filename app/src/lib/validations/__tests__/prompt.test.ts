/**
 * Tests for Prompt Validation Schemas
 *
 * Issue #36 — Prompt Management Screen with Versioning
 */

import { describe, it, expect } from "vitest";
import { createPromptSchema, updatePromptSchema } from "../prompt";

describe("Prompt Validation", () => {
  describe("createPromptSchema", () => {
    it("should accept valid prompt", () => {
      const result = createPromptSchema.safeParse({
        name: "Artikel Generatie",
        content: "Je bent een professionele journalist...",
        comment: "Eerste versie",
      });
      expect(result.success).toBe(true);
    });

    it("should accept prompt without comment", () => {
      const result = createPromptSchema.safeParse({
        name: "Artikel Generatie",
        content: "Je bent een professionele journalist...",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createPromptSchema.safeParse({
        name: "",
        content: "Je bent een professionele journalist...",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short content", () => {
      const result = createPromptSchema.safeParse({
        name: "Test",
        content: "kort",
      });
      expect(result.success).toBe(false);
    });

    it("should reject too long name", () => {
      const result = createPromptSchema.safeParse({
        name: "X".repeat(201),
        content: "Je bent een professionele journalist...",
      });
      expect(result.success).toBe(false);
    });

    it("should reject too long content", () => {
      const result = createPromptSchema.safeParse({
        name: "Test",
        content: "X".repeat(10001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePromptSchema", () => {
    it("should accept valid update", () => {
      const result = updatePromptSchema.safeParse({
        content: "Aangepaste prompt tekst voor generatie...",
        comment: "Toon informeler gemaakt",
      });
      expect(result.success).toBe(true);
    });

    it("should accept update without comment", () => {
      const result = updatePromptSchema.safeParse({
        content: "Aangepaste prompt tekst voor generatie...",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short content", () => {
      const result = updatePromptSchema.safeParse({
        content: "kort",
      });
      expect(result.success).toBe(false);
    });
  });
});
