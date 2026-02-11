import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { eq } from "drizzle-orm";

/**
 * POST /api/clusters/split — Split a cluster into multiple new clusters
 *
 * Body: {
 *   "clusterId": 1,
 *   "newClusters": [
 *     { "title": "Cluster A", "itemIds": [1, 2] },
 *     { "title": "Cluster B", "itemIds": [3, 4] }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clusterId, newClusters } = body;

    if (!clusterId || typeof clusterId !== "number") {
      return NextResponse.json(
        { error: "clusterId is verplicht" },
        { status: 400 }
      );
    }

    if (!Array.isArray(newClusters) || newClusters.length < 2) {
      return NextResponse.json(
        { error: "Minimaal 2 nieuwe clusters vereist voor splitsen" },
        { status: 400 }
      );
    }

    // Verify original cluster exists
    const original = db
      .select()
      .from(topicClusters)
      .where(eq(topicClusters.id, clusterId))
      .get();

    if (!original) {
      return NextResponse.json(
        { error: "Cluster niet gevonden" },
        { status: 404 }
      );
    }

    // Create new clusters and reassign items
    const created = [];
    for (const nc of newClusters) {
      if (!nc.title || !Array.isArray(nc.itemIds) || nc.itemIds.length === 0) {
        return NextResponse.json(
          { error: "Elk nieuw cluster moet een titel en itemIds bevatten" },
          { status: 400 }
        );
      }

      const newCluster = db
        .insert(topicClusters)
        .values({
          title: nc.title,
          primaryDate: original.primaryDate,
        })
        .returning()
        .get();

      // Reassign items to new cluster
      for (const itemId of nc.itemIds) {
        db.update(newsItems)
          .set({ topicClusterId: newCluster.id })
          .where(eq(newsItems.id, itemId))
          .run();
      }

      created.push({
        ...newCluster,
        itemCount: nc.itemIds.length,
      });
    }

    // Delete original cluster
    db.delete(topicClusters).where(eq(topicClusters.id, clusterId)).run();

    console.log(
      `[Clusters] Split cluster ${clusterId} into ${created.length} new clusters`
    );

    return NextResponse.json({ created });
  } catch (error) {
    console.error("[API] Split failed:", error);
    return NextResponse.json(
      { error: "Splitsen mislukt" },
      { status: 500 }
    );
  }
}
