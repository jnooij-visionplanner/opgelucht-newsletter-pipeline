import { z } from "zod";

/**
 * Environment variable validation
 *
 * Validates required and optional environment variables at startup.
 * Issue #30 — Security Requirements (NFR-011 Secret Management)
 * Issue #33 — Reliability (fail-fast on missing config)
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().optional().default(".db/opgelucht.db"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is vereist").optional(),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),

  // Joomla
  JOOMLA_API_URL: z
    .string()
    .url("JOOMLA_API_URL moet een geldige URL zijn")
    .optional(),
  JOOMLA_API_TOKEN: z.string().optional(),

  // Scheduling
  FEED_FETCH_CRON: z.string().optional().default("*/30 * * * *"),
  CLUSTERING_THRESHOLD: z.coerce.number().min(0).max(1).optional().default(0.3),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables. Logs warnings for missing optional vars
 * and throws on invalid values.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      "[Env] Ongeldige omgevingsvariabelen:",
      result.error.flatten().fieldErrors
    );
    throw new Error(
      `Ongeldige omgevingsvariabelen: ${result.error.issues.map((i) => i.message).join(", ")}`
    );
  }

  const env = result.data;

  // Warn about missing optional but recommended vars
  if (!env.OPENAI_API_KEY) {
    console.warn(
      "[Env] OPENAI_API_KEY niet ingesteld — LLM functies zijn uitgeschakeld"
    );
  }
  if (!env.JOOMLA_API_URL || !env.JOOMLA_API_TOKEN) {
    console.warn(
      "[Env] Joomla configuratie onvolledig — publiceren is uitgeschakeld"
    );
  }

  return env;
}

// Validate on import (fail-fast)
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
