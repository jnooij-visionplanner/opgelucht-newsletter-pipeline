import { describe, it, expect, vi } from "vitest";
import { callWithRetry } from "../openai";

describe("OpenAI Service", () => {
  describe("callWithRetry", () => {
    it("should return result on first success", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await callWithRetry(fn, 3);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and succeed", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("recovered");

      const result = await callWithRetry(fn, 3);

      expect(result).toBe("recovered");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should throw after exhausting retries", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("persistent error"));

      await expect(callWithRetry(fn, 1)).rejects.toThrow("persistent error");
      expect(fn).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it("should apply exponential backoff", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("ok");

      vi.useFakeTimers();
      const promise = callWithRetry(fn, 2);
      
      // Fast-forward timers
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(3);
      
      vi.useRealTimers();
    });
  });
});
