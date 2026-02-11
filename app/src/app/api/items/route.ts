import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems } from "@/db/schema/news-items";
import { desc, count } from "drizzle-orm";

/**
 * GET /api/items — List all news items, newest first.
 * Query params: ?limit=50&offset=0
 * Returns { items, total } for pagination support.
 * Excludes fullContent from list response for performance.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const items = db
      .select({
        id: newsItems.id,
        rssFeedId: newsItems.rssFeedId,
        guid: newsItems.guid,
        title: newsItems.title,
        sourceName: newsItems.sourceName,
        originalUrl: newsItems.originalUrl,
        archiveUrl: newsItems.archiveUrl,
        publishedDate: newsItems.publishedDate,
        snippet: newsItems.snippet,
        isPaywalled: newsItems.isPaywalled,
        paywallResolved: newsItems.paywallResolved,
        isSelected: newsItems.isSelected,
        topicClusterId: newsItems.topicClusterId,
        crawledAt: newsItems.crawledAt,
      })
      .from(newsItems)
      .orderBy(desc(newsItems.publishedDate))
      .limit(limit)
      .offset(offset)
      .all();

    const total = db.select({ count: count() }).from(newsItems).get()?.count ?? 0;

    return NextResponse.json({ items, total });
  } catch (error) {
    console.error("[API] Failed to list items:", error);
    return NextResponse.json(
      { error: "Failed to list items" },
      { status: 500 }
    );
  }
}
