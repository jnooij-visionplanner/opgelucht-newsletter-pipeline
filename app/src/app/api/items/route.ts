import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems } from "@/db/schema/news-items";
import { desc } from "drizzle-orm";

/**
 * GET /api/items — List all news items, newest first.
 * Query params: ?limit=50&offset=0
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const items = db
    .select()
    .from(newsItems)
    .orderBy(desc(newsItems.publishedDate))
    .limit(limit)
    .offset(offset)
    .all();

  return NextResponse.json(items);
}
