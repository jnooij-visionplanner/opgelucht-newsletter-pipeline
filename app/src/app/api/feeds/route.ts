import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rssFeeds } from "@/db/schema/rss-feeds";
import { createRssFeedSchema } from "@/lib/validations/rss-feed";

/**
 * GET /api/feeds — List all RSS feeds
 */
export async function GET() {
  try {
    const feeds = db.select().from(rssFeeds).all();
    return NextResponse.json(feeds);
  } catch (err) {
    console.error("[API /feeds] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feeds" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feeds — Create a new RSS feed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createRssFeedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = db
      .insert(rssFeeds)
      .values({
        url: parsed.data.url,
        searchTermLabel: parsed.data.searchTermLabel,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[API /feeds] POST error:", err);
    return NextResponse.json(
      { error: "Failed to create feed" },
      { status: 500 }
    );
  }
}
