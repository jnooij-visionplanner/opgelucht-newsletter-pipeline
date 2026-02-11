import { describe, it, expect } from "vitest";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../category";

describe("Category Validation", () => {
  describe("createCategorySchema", () => {
    it("should validate a valid category", () => {
      const result = createCategorySchema.safeParse({
        name: "Wetenschap",
        externalId: 5,
        displayOrder: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should accept minimal input", () => {
      const result = createCategorySchema.safeParse({
        name: "Nieuws",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayOrder).toBe(0);
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should reject empty name", () => {
      const result = createCategorySchema.safeParse({
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject name over 100 chars", () => {
      const result = createCategorySchema.safeParse({
        name: "A".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative externalId", () => {
      const result = createCategorySchema.safeParse({
        name: "Test",
        externalId: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer externalId", () => {
      const result = createCategorySchema.safeParse({
        name: "Test",
        externalId: 3.14,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateCategorySchema", () => {
    it("should accept partial updates", () => {
      const result = updateCategorySchema.safeParse({
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = updateCategorySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should allow nullable externalId", () => {
      const result = updateCategorySchema.safeParse({
        externalId: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept isActive toggle", () => {
      const result = updateCategorySchema.safeParse({
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });
});
