import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { eq } from "drizzle-orm";
import { splitClusterSchema, formatZodError } from "@/lib/validations/api-schemas";

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
    const parsed = splitClusterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { clusterId, newClusters } = parsed.data;

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
