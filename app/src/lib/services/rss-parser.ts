import RssParser from "rss-parser";
import type { NewNewsItem } from "@/db/schema/news-items";

const parser = new RssParser({
  timeout: 30_000,
  headers: {
    "User-Agent":
      "Opgelucht-Pipeline/1.0 (+https://cleanairnederland.nl)",
  },
});

export interface ParsedFeedItem {
  guid: string | null;
  title: string;
  sourceName: string | null;
  originalUrl: string;
  publishedDate: string;
  snippet: string | null;
}

export interface ParsedFeed {
  feedTitle: string | null;
  items: ParsedFeedItem[];
  errors: string[];
}

/**
 * Fetches and parses an RSS or Atom feed URL.
 * Returns structured items and any per-item parsing errors.
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  const errors: string[] = [];
  let feed: RssParser.Output<Record<string, unknown>>;

  try {
    feed = await parser.parseURL(feedUrl);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown feed parsing error";
    return {
      feedTitle: null,
      items: [],
      errors: [`Feed-level error for ${feedUrl}: ${message}`],
    };
  }

  const items: ParsedFeedItem[] = [];

  for (const item of feed.items) {
    try {
      const url = item.link;
      if (!url) {
        errors.push(`Skipping item "${item.title}" — no link found`);
        continue;
      }

      const title = item.title?.trim();
      if (!title) {
        errors.push(`Skipping item with URL ${url} — no title found`);
        continue;
      }

      const publishedDate =
        item.pubDate || item.isoDate || new Date().toISOString();

      // Try to parse date, fall back to current time
      let parsedDate: string;
      try {
        parsedDate = new Date(publishedDate).toISOString();
      } catch {
        parsedDate = new Date().toISOString();
        errors.push(
          `Invalid date for "${title}", using current time`
        );
      }

      // Extract source name from creator, source, or URL hostname
      let sourceName: string | null =
        (item.creator as string) ||
        (item.source as string) ||
        null;

      if (!sourceName && url) {
        try {
          sourceName = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          sourceName = null;
        }
      }

      const snippet = item.contentSnippet?.slice(0, 500) ||
        item.content?.slice(0, 500) ||
        item.summary?.slice(0, 500) ||
        null;

      items.push({
        guid: item.guid || null,
        title,
        sourceName,
        originalUrl: url,
        publishedDate: parsedDate,
        snippet,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown item error";
      errors.push(
        `Error parsing item "${item.title || "unknown"}": ${message}`
      );
    }
  }

  return {
    feedTitle: feed.title || null,
    items,
    errors,
  };
}

/**
 * Convert a parsed feed item into a NewNewsItem for database insertion.
 */
export function toNewsItem(
  item: ParsedFeedItem,
  rssFeedId: number
): NewNewsItem {
  return {
    rssFeedId,
    guid: item.guid,
    title: item.title,
    sourceName: item.sourceName,
    originalUrl: item.originalUrl,
    publishedDate: item.publishedDate,
    snippet: item.snippet,
  };
}
