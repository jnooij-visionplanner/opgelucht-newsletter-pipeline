import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We test validateEnv by manipulating process.env

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return defaults when no env vars are set", async () => {
    // Remove all relevant env vars
    delete process.env.DATABASE_URL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.JOOMLA_API_URL;
    delete process.env.JOOMLA_API_TOKEN;
    delete process.env.FEED_FETCH_CRON;
    delete process.env.CLUSTERING_THRESHOLD;

    const { validateEnv } = await import("../env");
    const env = validateEnv();

    expect(env.DATABASE_URL).toBe(".db/opgelucht.db");
    expect(env.OPENAI_MODEL).toBe("gpt-4o-mini");
    expect(env.FEED_FETCH_CRON).toBe("*/30 * * * *");
    expect(env.CLUSTERING_THRESHOLD).toBe(0.3);
  });

  it("should use provided env values", async () => {
    process.env.DATABASE_URL = "/custom/path.db";
    process.env.OPENAI_API_KEY = "sk-test-key";
    process.env.OPENAI_MODEL = "gpt-4o";
    process.env.CLUSTERING_THRESHOLD = "0.5";

    const { validateEnv } = await import("../env");
    const env = validateEnv();

    expect(env.DATABASE_URL).toBe("/custom/path.db");
    expect(env.OPENAI_API_KEY).toBe("sk-test-key");
    expect(env.OPENAI_MODEL).toBe("gpt-4o");
    expect(env.CLUSTERING_THRESHOLD).toBe(0.5);
  });

  it("should reject invalid JOOMLA_API_URL", async () => {
    process.env.JOOMLA_API_URL = "not-a-url";

    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow("Ongeldige omgevingsvariabelen");
  });

  it("should reject CLUSTERING_THRESHOLD out of range", async () => {
    process.env.CLUSTERING_THRESHOLD = "1.5";

    const { validateEnv } = await import("../env");
    expect(() => validateEnv()).toThrow();
  });

  it("should warn when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { validateEnv } = await import("../env");
    validateEnv();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("OPENAI_API_KEY")
    );
    warnSpy.mockRestore();
  });

  it("should warn when Joomla config is incomplete", async () => {
    delete process.env.JOOMLA_API_URL;
    delete process.env.JOOMLA_API_TOKEN;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { validateEnv } = await import("../env");
    validateEnv();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Joomla")
    );
    warnSpy.mockRestore();
  });

  it("getEnv should cache the result", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.JOOMLA_API_URL = "https://example.com";
    process.env.JOOMLA_API_TOKEN = "token";

    const { getEnv } = await import("../env");
    const env1 = getEnv();
    const env2 = getEnv();

    expect(env1).toBe(env2);
  });
});
