import { NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { eq, count, and, sql, desc, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard — Returns dashboard data: stats + clusters with items
 * Optimized: uses aggregated stats query and batch item loading instead of N+1
 */
export async function GET() {
  try {
    // ── Stats (single aggregated query) ─────────────────────
    const statsRow = db
      .select({
        totalItems: count(),
        paywalled: sql<number>`SUM(CASE WHEN ${newsItems.isPaywalled} = 1 THEN 1 ELSE 0 END)`,
        resolved: sql<number>`SUM(CASE WHEN ${newsItems.isPaywalled} = 1 AND ${newsItems.paywallResolved} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(newsItems)
      .get();

    const totalItems = statsRow?.totalItems ?? 0;
    const paywalledCount = statsRow?.paywalled ?? 0;
    const resolvedCount = statsRow?.resolved ?? 0;

    const totalClusters =
      db.select({ count: count() }).from(topicClusters).get()?.count ?? 0;

    const stats = {
      totalItems,
      clusters: totalClusters,
      paywalled: paywalledCount,
      resolved: resolvedCount,
      unresolved: paywalledCount - resolvedCount,
    };

    // ── Clusters ────────────────────────────────────────────
    const clusters = db
      .select()
      .from(topicClusters)
      .orderBy(desc(topicClusters.primaryDate))
      .all();

    // ── Batch-load all clustered items in one query ─────────
    const clusterIds = clusters.map((c) => c.id);

    const allClusteredItems =
      clusterIds.length > 0
        ? db
            .select({
              id: newsItems.id,
              title: newsItems.title,
              sourceName: newsItems.sourceName,
              originalUrl: newsItems.originalUrl,
              publishedDate: newsItems.publishedDate,
              isPaywalled: newsItems.isPaywalled,
              paywallResolved: newsItems.paywallResolved,
              isSelected: newsItems.isSelected,
              topicClusterId: newsItems.topicClusterId,
            })
            .from(newsItems)
            .where(
              sql`${newsItems.topicClusterId} IN (${sql.join(
                clusterIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(desc(newsItems.publishedDate))
            .all()
        : [];

    // Group items by cluster
    const itemsByCluster = new Map<number, typeof allClusteredItems>();
    for (const item of allClusteredItems) {
      const clusterId = item.topicClusterId!;
      if (!itemsByCluster.has(clusterId)) {
        itemsByCluster.set(clusterId, []);
      }
      itemsByCluster.get(clusterId)!.push(item);
    }

    const clustersWithItems = clusters.map((cluster) => {
      const items = itemsByCluster.get(cluster.id) ?? [];
      return {
        ...cluster,
        itemCount: items.length,
        items,
      };
    });

    // ── Unclustered items ──────────────────────────────────
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
      .where(isNull(newsItems.topicClusterId))
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
