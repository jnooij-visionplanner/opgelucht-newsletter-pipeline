import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { eq, inArray } from "drizzle-orm";

/**
 * POST /api/clusters/merge — Merge multiple clusters into one
 *
 * Body: { "clusterIds": [1, 2, ...] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clusterIds } = body;

    if (!Array.isArray(clusterIds) || clusterIds.length < 2) {
      return NextResponse.json(
        { error: "Minimaal 2 clusters vereist voor samenvoegen" },
        { status: 400 }
      );
    }

    // Fetch all clusters
    const clusters = db
      .select()
      .from(topicClusters)
      .where(inArray(topicClusters.id, clusterIds))
      .all();

    if (clusters.length !== clusterIds.length) {
      return NextResponse.json(
        { error: "Eén of meer clusters niet gevonden" },
        { status: 404 }
      );
    }

    // Use the title of the first cluster (by date) as the merged title
    const sorted = clusters.sort(
      (a, b) =>
        new Date(b.primaryDate).getTime() - new Date(a.primaryDate).getTime()
    );
    const primaryCluster = sorted[0];

    // Create new merged cluster
    const merged = db
      .insert(topicClusters)
      .values({
        title: primaryCluster.title,
        primaryDate: primaryCluster.primaryDate,
      })
      .returning()
      .get();

    // Move all items to the new cluster
    db.update(newsItems)
      .set({ topicClusterId: merged.id })
      .where(inArray(newsItems.topicClusterId, clusterIds))
      .run();

    // Delete original clusters
    for (const id of clusterIds) {
      db.delete(topicClusters).where(eq(topicClusters.id, id)).run();
    }

    console.log(
      `[Clusters] Merged ${clusterIds.length} clusters into new cluster ${merged.id}`
    );

    return NextResponse.json({
      merged,
      mergedCount: clusterIds.length,
    });
  } catch (error) {
    console.error("[API] Merge failed:", error);
    return NextResponse.json(
      { error: "Samenvoegen mislukt" },
      { status: 500 }
    );
  }
}
