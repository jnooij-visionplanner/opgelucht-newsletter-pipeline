import { NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/services/feed-fetcher";

/**
 * POST /api/feeds/fetch — Manually trigger a fetch cycle for all active feeds.
 * Used for testing and manual triggering.
 */
export async function POST() {
  try {
    console.log("[API /feeds/fetch] Manual fetch triggered");
    const result = await fetchAllFeeds();

    return NextResponse.json(result, {
      status: result.errors.length > 0 ? 207 : 200,
    });
  } catch (err) {
    console.error("[API /feeds/fetch] Error:", err);
    return NextResponse.json(
      { error: "Feed fetch failed" },
      { status: 500 }
    );
  }
}
