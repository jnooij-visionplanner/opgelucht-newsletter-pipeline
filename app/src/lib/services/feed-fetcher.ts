import { db } from "@/db";
import { rssFeeds, type RssFeed } from "@/db/schema/rss-feeds";
import { newsItems } from "@/db/schema/news-items";
import { fetchLogs } from "@/db/schema/fetch-logs";
import { eq, or } from "drizzle-orm";
import { parseFeed, toNewsItem } from "./rss-parser";

export interface FetchResult {
  feedId: number;
  feedLabel: string;
  feedUrl: string;
  itemsFetched: number;
  itemsInserted: number;
  duplicatesSkipped: number;
  errors: string[];
}

export interface FetchCycleResult {
  startedAt: string;
  completedAt: string;
  feedsProcessed: number;
  totalItemsFetched: number;
  totalItemsInserted: number;
  totalDuplicatesSkipped: number;
  results: FetchResult[];
  errors: string[];
}

/**
 * Fetch and process a single RSS feed.
 * Handles deduplication by checking originalUrl and guid.
 */
async function processFeed(feed: RssFeed): Promise<FetchResult> {
  const result: FetchResult = {
    feedId: feed.id,
    feedLabel: feed.searchTermLabel,
    feedUrl: feed.url,
    itemsFetched: 0,
    itemsInserted: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  try {
    const parsed = await parseFeed(feed.url);
    result.itemsFetched = parsed.items.length;
    result.errors.push(...parsed.errors);

    for (const item of parsed.items) {
      try {
        // Deduplication: check if item already exists by URL or GUID
        const conditions = [eq(newsItems.originalUrl, item.originalUrl)];
        if (item.guid) {
          conditions.push(eq(newsItems.guid, item.guid));
        }

        const existing = db
          .select({ id: newsItems.id })
          .from(newsItems)
          .where(or(...conditions))
          .get();

        if (existing) {
          result.duplicatesSkipped++;
          continue;
        }

        // Insert new item
        const newItem = toNewsItem(item, feed.id);
        db.insert(newsItems).values(newItem).run();
        result.itemsInserted++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown insert error";
        result.errors.push(
          `Failed to insert "${item.title}": ${message}`
        );
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown feed processing error";
    result.errors.push(`Feed processing failed: ${message}`);
  }

  return result;
}

/**
 * Fetch all active RSS feeds, parse them, and store new items.
 * This is the main ingestion entry point.
 */
export async function fetchAllFeeds(): Promise<FetchCycleResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  // Get all active feeds
  const activeFeeds = db
    .select()
    .from(rssFeeds)
    .where(eq(rssFeeds.isActive, true))
    .all();

  if (activeFeeds.length === 0) {
    return {
      startedAt,
      completedAt: new Date().toISOString(),
      feedsProcessed: 0,
      totalItemsFetched: 0,
      totalItemsInserted: 0,
      totalDuplicatesSkipped: 0,
      results: [],
      errors: ["No active feeds configured"],
    };
  }

  console.log(
    `[RSS Fetch] Starting fetch cycle for ${activeFeeds.length} active feeds`
  );

  const results: FetchResult[] = [];

  // Process feeds sequentially to avoid overwhelming external servers
  for (const feed of activeFeeds) {
    console.log(
      `[RSS Fetch] Processing feed: ${feed.searchTermLabel} (${feed.url})`
    );

    try {
      const feedResult = await processFeed(feed);
      results.push(feedResult);

      // Log fetch result to database
      db.insert(fetchLogs)
        .values({
          rssFeedId: feed.id,
          status:
            feedResult.errors.length > 0
              ? feedResult.itemsInserted > 0
                ? "partial"
                : "error"
              : "success",
          itemsFetched: feedResult.itemsFetched,
          itemsInserted: feedResult.itemsInserted,
          duplicatesSkipped: feedResult.duplicatesSkipped,
          errorMessages:
            feedResult.errors.length > 0
              ? JSON.stringify(feedResult.errors)
              : null,
          startedAt: startedAt,
          completedAt: new Date().toISOString(),
        })
        .run();

      console.log(
        `[RSS Fetch] Feed "${feed.searchTermLabel}": ` +
          `${feedResult.itemsFetched} fetched, ` +
          `${feedResult.itemsInserted} inserted, ` +
          `${feedResult.duplicatesSkipped} duplicates skipped` +
          (feedResult.errors.length > 0
            ? `, ${feedResult.errors.length} errors`
            : "")
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      errors.push(
        `Failed to process feed "${feed.searchTermLabel}": ${message}`
      );
      console.error(
        `[RSS Fetch] Fatal error for feed "${feed.searchTermLabel}": ${message}`
      );
    }
  }

  const completedAt = new Date().toISOString();

  const totals = results.reduce(
    (acc, r) => ({
      itemsFetched: acc.itemsFetched + r.itemsFetched,
      itemsInserted: acc.itemsInserted + r.itemsInserted,
      duplicatesSkipped: acc.duplicatesSkipped + r.duplicatesSkipped,
    }),
    { itemsFetched: 0, itemsInserted: 0, duplicatesSkipped: 0 }
  );

  console.log(
    `[RSS Fetch] Cycle complete: ` +
      `${results.length} feeds processed, ` +
      `${totals.itemsFetched} total items fetched, ` +
      `${totals.itemsInserted} inserted, ` +
      `${totals.duplicatesSkipped} duplicates skipped`
  );

  return {
    startedAt,
    completedAt,
    feedsProcessed: results.length,
    totalItemsFetched: totals.itemsFetched,
    totalItemsInserted: totals.itemsInserted,
    totalDuplicatesSkipped: totals.duplicatesSkipped,
    results,
    errors,
  };
}

/**
 * Fetch a single feed by its ID. Useful for testing individual feeds.
 */
export async function fetchSingleFeed(
  feedId: number
): Promise<FetchResult | null> {
  const feed = db
    .select()
    .from(rssFeeds)
    .where(eq(rssFeeds.id, feedId))
    .get();

  if (!feed) return null;

  return processFeed(feed);
}
