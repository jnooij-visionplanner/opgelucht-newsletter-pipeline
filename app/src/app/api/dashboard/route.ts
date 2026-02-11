import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { eq, count, and, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard — Returns dashboard data: stats + clusters with items
 */
export async function GET() {
  try {
    // ── Stats ──────────────────────────────────────────────
    const totalItems = db.select({ count: count() }).from(newsItems).get()?.count ?? 0;

    const totalClusters =
      db.select({ count: count() }).from(topicClusters).get()?.count ?? 0;

    const paywalledCount =
      db
        .select({ count: count() })
        .from(newsItems)
        .where(eq(newsItems.isPaywalled, true))
        .get()?.count ?? 0;

    const resolvedCount =
      db
        .select({ count: count() })
        .from(newsItems)
        .where(
          and(
            eq(newsItems.isPaywalled, true),
            eq(newsItems.paywallResolved, true)
          )
        )
        .get()?.count ?? 0;

    const unresolvedCount = paywalledCount - resolvedCount;

    const stats = {
      totalItems,
      clusters: totalClusters,
      paywalled: paywalledCount,
      resolved: resolvedCount,
      unresolved: unresolvedCount,
    };

    // ── Clusters with items ────────────────────────────────
    const clusters = db
      .select()
      .from(topicClusters)
      .orderBy(desc(topicClusters.primaryDate))
      .all();

    const clustersWithItems = clusters.map((cluster) => {
      const items = db
        .select({
          id: newsItems.id,
          title: newsItems.title,
          sourceName: newsItems.sourceName,
          originalUrl: newsItems.originalUrl,
          publishedDate: newsItems.publishedDate,
          isPaywalled: newsItems.isPaywalled,
          paywallResolved: newsItems.paywallResolved,
          isSelected: newsItems.isSelected,
        })
        .from(newsItems)
        .where(eq(newsItems.topicClusterId, cluster.id))
        .orderBy(desc(newsItems.publishedDate))
        .all();

      return {
        ...cluster,
        itemCount: items.length,
        items,
      };
    });

    // Also get unclustered items
    const unclusteredItems = db
      .select({
        id: newsItems.id,
        title: newsItems.title,
        sourceName: newsItems.sourceName,
        originalUrl: newsItems.originalUrl,
        publishedDate: newsItems.publishedDate,
        isPaywalled: newsItems.isPaywalled,
        paywallResolved: newsItems.paywallResolved,
        isSelected: newsItems.isSelected,
      })
      .from(newsItems)
      .where(sql`${newsItems.topicClusterId} IS NULL`)
      .orderBy(desc(newsItems.publishedDate))
      .all();

    return NextResponse.json({
      stats,
      clusters: clustersWithItems,
      unclusteredItems,
    });
  } catch (error) {
    console.error("[API] Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
