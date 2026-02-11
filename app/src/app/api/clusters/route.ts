import { NextResponse } from "next/server";
import {
  runClustering,
  resetClusters,
} from "@/lib/services/topic-clustering";

/**
 * POST /api/clusters — Run clustering on unclustered items
 */
export async function POST() {
  try {
    const result = await runClustering();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Clustering failed:", error);
    return NextResponse.json(
      { error: "Clustering failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clusters — Reset all clusters (for re-clustering)
 */
export async function DELETE() {
  try {
    await resetClusters();
    return NextResponse.json({ message: "All clusters reset" });
  } catch (error) {
    console.error("[API] Reset clusters failed:", error);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}
