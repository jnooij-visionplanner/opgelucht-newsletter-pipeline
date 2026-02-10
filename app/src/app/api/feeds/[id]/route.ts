import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rssFeeds } from "@/db/schema/rss-feeds";
import { eq } from "drizzle-orm";
import { updateRssFeedSchema } from "@/lib/validations/rss-feed";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/feeds/:id — Get a single RSS feed
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const feedId = parseInt(id, 10);
    if (isNaN(feedId)) {
      return NextResponse.json({ error: "Invalid feed ID" }, { status: 400 });
    }

    const feed = db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.id, feedId))
      .get();

    if (!feed) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    return NextResponse.json(feed);
  } catch (err) {
    console.error("[API /feeds/:id] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/feeds/:id — Update an RSS feed
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const feedId = parseInt(id, 10);
    if (isNaN(feedId)) {
      return NextResponse.json({ error: "Invalid feed ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateRssFeedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.id, feedId))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    const result = db
      .update(rssFeeds)
      .set({
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rssFeeds.id, feedId))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API /feeds/:id] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update feed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/feeds/:id — Soft-delete (deactivate) a feed
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const feedId = parseInt(id, 10);
    if (isNaN(feedId)) {
      return NextResponse.json({ error: "Invalid feed ID" }, { status: 400 });
    }

    const existing = db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.id, feedId))
      .get();

    if (!existing) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    const result = db
      .update(rssFeeds)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rssFeeds.id, feedId))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API /feeds/:id] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to deactivate feed" },
      { status: 500 }
    );
  }
}
