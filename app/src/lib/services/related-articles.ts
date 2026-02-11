/**
 * Related Article Enrichment Service
 *
 * Searches feed history for related articles from the past month
 * to enrich article generation with historical context.
 *
 * Issue #23 — Related Article Enrichment (Past Month Search)
 */

import { db } from "@/db";
import { newsItems, type NewsItem } from "@/db/schema/news-items";
import { gte, or, like, desc, and, ne } from "drizzle-orm";
import { tokenize } from "./topic-clustering";

// ── Configuration ──────────────────────────────────────────────────────

const PAST_MONTH_DAYS = 30;
const MAX_RELATED_RESULTS = 10;
const MIN_KEYWORD_LENGTH = 3;
const MAX_KEYWORDS = 8;

// ── Keyword extraction ─────────────────────────────────────────────────

/**
 * Extract the most significant keywords from a set of news items.
 * Uses TF-IDF-inspired frequency counting across the cluster items.
 */
export function extractKeywords(items: { title: string; snippet?: string | null }[]): string[] {
  const freq = new Map<string, number>();

  for (const item of items) {
    const text = `${item.title} ${item.snippet || ""}`;
    const tokens = tokenize(text);
    const unique = new Set(tokens);

    for (const token of unique) {
      if (token.length >= MIN_KEYWORD_LENGTH) {
        freq.set(token, (freq.get(token) || 0) + 1);
      }
    }
  }

  // Sort by frequency descending, take top N
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_KEYWORDS)
    .map(([word]) => word);
}

// ── Related article search ─────────────────────────────────────────────

/**
 * Search for related articles from the past month based on keywords
 * extracted from the current cluster items.
 */
export async function findRelatedArticles(
  clusterItems: { id: number; title: string; snippet?: string | null }[],
  excludeItemIds?: number[]
): Promise<NewsItem[]> {
  const keywords = extractKeywords(clusterItems);

  if (keywords.length === 0) {
    console.log("[Enrichment] No keywords extracted, skipping search");
    return [];
  }

  console.log(`[Enrichment] Searching with keywords: ${keywords.join(", ")}`);

  // Calculate date 30 days ago
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - PAST_MONTH_DAYS);
  const pastDateStr = pastDate.toISOString();

  // Build LIKE conditions for title and snippet
  const conditions = keywords.flatMap((kw) => [
    like(newsItems.title, `%${kw}%`),
    like(newsItems.snippet, `%${kw}%`),
  ]);

  // Query database
  const excludeIds = new Set(excludeItemIds || clusterItems.map((i) => i.id));
  const results = db
    .select()
    .from(newsItems)
    .where(and(gte(newsItems.publishedDate, pastDateStr), or(...conditions)))
    .orderBy(desc(newsItems.publishedDate))
    .limit(MAX_RELATED_RESULTS * 2) // Fetch extra to compensate for filtering
    .all();

  // Filter out items that are already in the cluster
  const filtered = results.filter((r) => !excludeIds.has(r.id));

  console.log(
    `[Enrichment] Found ${filtered.length} related articles (from ${results.length} total matches)`
  );

  return filtered.slice(0, MAX_RELATED_RESULTS);
}

/**
 * Format related articles as additional context for the LLM prompt.
 */
export function formatRelatedContext(relatedArticles: NewsItem[]): string {
  if (relatedArticles.length === 0) return "";

  const lines = relatedArticles.map((a) => {
    const date = a.publishedDate.split("T")[0];
    const source = a.sourceName || "Onbekend";
    return `- [${date}] ${a.title} (${source})${a.snippet ? `: ${a.snippet.substring(0, 100)}` : ""}`;
  });

  return `\n\nGERELATEERDE EERDERE BERICHTGEVING (afgelopen maand):\n${lines.join("\n")}`;
}
