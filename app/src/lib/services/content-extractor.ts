/**
 * Full Content Extraction Service
 *
 * Extracts the main article content from a URL using Mozilla Readability.
 * Falls back to archive URL if available.
 *
 * Returns clean text content suitable for LLM context.
 */

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface ExtractionResult {
  content: string | null;
  title: string | null;
  excerpt: string | null;
  siteName: string | null;
  urlUsed: string;
  success: boolean;
  error: string | null;
}

const EXTRACTION_TIMEOUT_MS = 15_000;
const MAX_CONTENT_LENGTH = 50_000; // ~50KB text limit

/**
 * Extract full article content from a URL.
 * Prefers archiveUrl if provided, falls back to originalUrl.
 */
export async function extractContent(
  originalUrl: string,
  archiveUrl?: string | null
): Promise<ExtractionResult> {
  // Try archive URL first (more likely to have full content), then original
  const urlsToTry = archiveUrl
    ? [archiveUrl, originalUrl]
    : [originalUrl];

  for (const url of urlsToTry) {
    const result = await extractFromUrl(url);
    if (result.success && result.content) {
      return result;
    }
  }

  return {
    content: null,
    title: null,
    excerpt: null,
    siteName: null,
    urlUsed: originalUrl,
    success: false,
    error: `Failed to extract content from any URL`,
  };
}

/**
 * Extract article content from a single URL using Readability.
 */
async function extractFromUrl(url: string): Promise<ExtractionResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      EXTRACTION_TIMEOUT_MS
    );

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        content: null,
        title: null,
        excerpt: null,
        siteName: null,
        urlUsed: url,
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Parse with JSDOM and Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return {
        content: null,
        title: null,
        excerpt: null,
        siteName: null,
        urlUsed: url,
        success: false,
        error: "Readability could not extract content",
      };
    }

    // Clean and truncate content
    const cleanContent = article.textContent
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_CONTENT_LENGTH);

    console.log(
      `[Extract] Extracted ${cleanContent.length} chars from ${url}`
    );

    return {
      content: cleanContent,
      title: article.title || null,
      excerpt: article.excerpt || null,
      siteName: article.siteName || null,
      urlUsed: url,
      success: true,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown extraction error";
    return {
      content: null,
      title: null,
      excerpt: null,
      siteName: null,
      urlUsed: url,
      success: false,
      error: message,
    };
  }
}
