import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the openai module only
vi.mock("../openai", () => ({
  chatCompletion: vi.fn(),
}));

import { categorizeItem } from "../llm-categorization";
import { chatCompletion } from "../openai";
import type { Category } from "@/db/schema/categories";

const mockChatCompletion = vi.mocked(chatCompletion);

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Wetenschap", description: "Wetenschappelijk onderzoek", isActive: true, externalId: 5, displayOrder: 1, createdAt: "", updatedAt: "" },
  { id: 2, name: "Politiek", description: "Politiek nieuws", isActive: true, externalId: 6, displayOrder: 2, createdAt: "", updatedAt: "" },
  { id: 3, name: "Nieuws", description: "Algemeen nieuws", isActive: true, externalId: 7, displayOrder: 0, createdAt: "", updatedAt: "" },
];

describe("LLM Categorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("categorizeItem", () => {
    it("should match exact category name from LLM", async () => {
      mockChatCompletion.mockResolvedValue("Wetenschap");

      const result = await categorizeItem(
        "Nieuw onderzoek over vapen",
        "Wetenschappers hebben nieuwe resultaten gepubliceerd.",
        MOCK_CATEGORIES
      );

      expect(result.categoryId).toBe(1);
      expect(result.categoryName).toBe("Wetenschap");
    });

    it("should match case-insensitive", async () => {
      mockChatCompletion.mockResolvedValue("politiek");

      const result = await categorizeItem("Test", "Content", MOCK_CATEGORIES);

      expect(result.categoryId).toBe(2);
      expect(result.categoryName).toBe("Politiek");
    });

    it("should fall back to Nieuws for unmatched category", async () => {
      mockChatCompletion.mockResolvedValue("Onbekende Categorie");

      const result = await categorizeItem("Test", "Content", MOCK_CATEGORIES);

      expect(result.categoryId).toBe(3);
      expect(result.categoryName).toBe("Nieuws");
    });

    it("should throw when no active categories exist", async () => {
      await expect(
        categorizeItem("Test", "Content", [])
      ).rejects.toThrow("No active categories found");
    });

    it("should handle null content", async () => {
      mockChatCompletion.mockResolvedValue("Wetenschap");

      const result = await categorizeItem("Test", null, MOCK_CATEGORIES);

      expect(result.categoryId).toBe(1);
      expect(mockChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: expect.stringContaining("geen inhoud beschikbaar"),
        })
      );
    });

    it("should fuzzy match when response contains category name", async () => {
      mockChatCompletion.mockResolvedValue("De categorie is Wetenschap.");

      const result = await categorizeItem("Test", "Content", MOCK_CATEGORIES);

      expect(result.categoryId).toBe(1);
      expect(result.categoryName).toBe("Wetenschap");
    });
  });
});
