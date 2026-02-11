/**
 * Article Processing Pipeline
 *
 * Orchestrates the processing of ingested news items:
 * 1. Paywall detection
 * 2. Archive service resolution (fallback chain)
 * 3. Full content extraction
 *
 * Updates NewsItem records in-place with results.
 */

import { db } from "@/db";
import { newsItems, type NewsItem } from "@/db/schema/news-items";
import { eq, isNull, and, or } from "drizzle-orm";
import { detectPaywall, resolvePaywall } from "./archive-resolver";
import { extractContent } from "./content-extractor";

export interface ProcessingResult {
  itemId: number;
  title: string;
  paywallDetected: boolean;
  archiveResolved: boolean;
  archiveService: string | null;
  contentExtracted: boolean;
  contentLength: number;
  errors: string[];
}

export interface ProcessingCycleResult {
  startedAt: string;
  completedAt: string;
  itemsProcessed: number;
  paywallsDetected: number;
  paywallsResolved: number;
  contentExtracted: number;
  results: ProcessingResult[];
  errors: string[];
}

/**
 * Process a single news item through the full pipeline.
 */
async function processItem(item: NewsItem): Promise<ProcessingResult> {
  const result: ProcessingResult = {
    itemId: item.id,
    title: item.title,
    paywallDetected: item.isPaywalled,
    archiveResolved: item.paywallResolved,
    archiveService: null,
    contentExtracted: false,
    contentLength: 0,
    errors: [],
  };

  // Step 1: Paywall detection (skip if already determined)
  if (!item.isPaywalled) {
    try {
      const isPaywalled = await detectPaywall(item.originalUrl);
      result.paywallDetected = isPaywalled;

      if (isPaywalled) {
        db.update(newsItems)
          .set({ isPaywalled: true })
          .where(eq(newsItems.id, item.id))
          .run();

        console.log(
          `[Process] Paywall detected: "${item.title}" (${item.originalUrl})`
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown paywall detection error";
      result.errors.push(`Paywall detection: ${msg}`);
    }
  }

  // Step 2: Archive resolution (only for paywalled, unresolved items)
  if (result.paywallDetected && !item.paywallResolved && !item.archiveUrl) {
    try {
      const archiveResult = await resolvePaywall(item.originalUrl);

      if (archiveResult.archiveUrl) {
        result.archiveResolved = true;
        result.archiveService = archiveResult.service;

        db.update(newsItems)
          .set({
            archiveUrl: archiveResult.archiveUrl,
            paywallResolved: true,
          })
          .where(eq(newsItems.id, item.id))
          .run();

        console.log(
          `[Process] Archive resolved via ${archiveResult.service}: "${item.title}"`
        );
      } else {
        result.errors.push(
          ...archiveResult.errors.map((e) => `Archive: ${e}`)
        );
        console.log(
          `[Process] No archive found for "${item.title}" (tried: ${archiveResult.attempted.join(", ")})`
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown archive resolution error";
      result.errors.push(`Archive resolution: ${msg}`);
    }
  }

  // Step 3: Content extraction (skip if already extracted)
  if (!item.fullContent) {
    try {
      // Use the latest archive URL if we just resolved one
      const currentArchiveUrl =
        result.archiveResolved && result.archiveService
          ? (
              db
                .select({ archiveUrl: newsItems.archiveUrl })
                .from(newsItems)
                .where(eq(newsItems.id, item.id))
                .get()
            )?.archiveUrl
          : item.archiveUrl;

      const extraction = await extractContent(
        item.originalUrl,
        currentArchiveUrl
      );

      if (extraction.success && extraction.content) {
        result.contentExtracted = true;
        result.contentLength = extraction.content.length;

        db.update(newsItems)
          .set({ fullContent: extraction.content })
          .where(eq(newsItems.id, item.id))
          .run();

        console.log(
          `[Process] Content extracted: "${item.title}" (${extraction.content.length} chars from ${extraction.urlUsed})`
        );
      } else {
        if (extraction.error) {
          result.errors.push(`Extraction: ${extraction.error}`);
        }
        console.log(
          `[Process] Content extraction failed for "${item.title}": ${extraction.error}`
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown extraction error";
      result.errors.push(`Content extraction: ${msg}`);
    }
  } else {
    result.contentExtracted = true;
    result.contentLength = item.fullContent.length;
  }

  return result;
}

/**
 * Process all unprocessed news items.
 * Items are considered unprocessed if they have no fullContent
 * or have unresolved paywall status.
 */
export async function processAllItems(): Promise<ProcessingCycleResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  // Get items that need processing:
  // - No fullContent yet
  // - OR paywalled but not resolved (may need archive resolution)
  const allItems = db
    .select()
    .from(newsItems)
    .where(
      or(
        isNull(newsItems.fullContent),
        and(
          eq(newsItems.isPaywalled, true),
          eq(newsItems.paywallResolved, false)
        )
      )
    )
    .all();

  if (allItems.length === 0) {
    return {
      startedAt,
      completedAt: new Date().toISOString(),
      itemsProcessed: 0,
      paywallsDetected: 0,
      paywallsResolved: 0,
      contentExtracted: 0,
      results: [],
      errors: ["No items to process"],
    };
  }

  console.log(
    `[Process] Starting processing cycle for ${allItems.length} items`
  );

  const results: ProcessingResult[] = [];

  // Process items sequentially to be respectful of external services
  for (const item of allItems) {
    try {
      const itemResult = await processItem(item);
      results.push(itemResult);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unknown processing error";
      errors.push(`Failed to process item ${item.id} "${item.title}": ${msg}`);
    }
  }

  const completedAt = new Date().toISOString();

  const totals = results.reduce(
    (acc, r) => ({
      paywallsDetected:
        acc.paywallsDetected + (r.paywallDetected ? 1 : 0),
      paywallsResolved:
        acc.paywallsResolved + (r.archiveResolved ? 1 : 0),
      contentExtracted:
        acc.contentExtracted + (r.contentExtracted ? 1 : 0),
    }),
    { paywallsDetected: 0, paywallsResolved: 0, contentExtracted: 0 }
  );

  console.log(
    `[Process] Cycle complete: ${results.length} items, ` +
      `${totals.paywallsDetected} paywalls, ` +
      `${totals.paywallsResolved} resolved, ` +
      `${totals.contentExtracted} content extracted`
  );

  return {
    startedAt,
    completedAt,
    itemsProcessed: results.length,
    ...totals,
    results,
    errors,
  };
}

/**
 * Process a single news item by ID.
 */
export async function processSingleItem(
  itemId: number
): Promise<ProcessingResult | null> {
  const item = db
    .select()
    .from(newsItems)
    .where(eq(newsItems.id, itemId))
    .get();

  if (!item) return null;

  return processItem(item);
}
