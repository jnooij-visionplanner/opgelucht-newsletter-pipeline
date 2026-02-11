/**
 * OpenAI Service Wrapper
 *
 * Centralized OpenAI client with retry logic and error handling.
 * Used by classification and categorization services.
 */

import OpenAI from "openai";

// ── Client singleton ───────────────────────────────────────────────────

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "sk-your-openai-api-key-here") {
      throw new Error(
        "OPENAI_API_KEY is not configured. Set it in your .env file."
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// ── Retry logic ────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[OpenAI] Attempt ${attempt + 1}/${retries + 1} failed: ${lastError.message}`
      );

      if (attempt < retries) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}

// ── Chat completion helper ─────────────────────────────────────────────

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function chatCompletion(request: LLMRequest): Promise<string> {
  const client = getOpenAIClient();
  const model = request.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const result = await callWithRetry(async () => {
    const response = await client.chat.completions.create({
      model,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens ?? 200,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    return content;
  });

  return result;
}
