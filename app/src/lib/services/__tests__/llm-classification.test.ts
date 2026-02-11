import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock openai module
vi.mock("../openai", () => ({
  chatCompletion: vi.fn(),
}));

import { classifyItem } from "../llm-classification";
import { chatCompletion } from "../openai";

const mockChatCompletion = vi.mocked(chatCompletion);

describe("LLM Classification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("classifyItem", () => {
    it("should classify Binnenland for domestic content", async () => {
      mockChatCompletion.mockResolvedValue("Binnenland");

      const result = await classifyItem(
        "Nieuwe rookverbod in Amsterdam",
        "De gemeente Amsterdam voert nieuw rookverbod in op terrassen."
      );

      expect(result.classification).toBe("binnenland");
      expect(result.dutchLabel).toBe("Binnenland");
      expect(mockChatCompletion).toHaveBeenCalledOnce();
    });

    it("should classify Buitenland for international content", async () => {
      mockChatCompletion.mockResolvedValue("Buitenland");

      const result = await classifyItem(
        "WHO publiceert rapport over tabaksbeleid",
        "De World Health Organization heeft een nieuw rapport gepubliceerd."
      );

      expect(result.classification).toBe("buitenland");
      expect(result.dutchLabel).toBe("Buitenland");
    });

    it("should default to Binnenland for unclear response", async () => {
      mockChatCompletion.mockResolvedValue("Niet duidelijk");

      const result = await classifyItem("Test", "Content");

      expect(result.classification).toBe("binnenland");
      expect(result.dutchLabel).toBe("Binnenland");
    });

    it("should handle null content", async () => {
      mockChatCompletion.mockResolvedValue("Binnenland");

      const result = await classifyItem("Test artikel", null);

      expect(result.classification).toBe("binnenland");
      // Should have been called with placeholder text
      expect(mockChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          userPrompt: expect.stringContaining("geen inhoud beschikbaar"),
        })
      );
    });

    it("should truncate long content to 2000 chars", async () => {
      mockChatCompletion.mockResolvedValue("Binnenland");

      const longContent = "A".repeat(5000);
      await classifyItem("Test", longContent);

      const call = mockChatCompletion.mock.calls[0][0];
      // Content in the prompt should be truncated
      expect(call.userPrompt.length).toBeLessThan(2200);
    });
  });
});
