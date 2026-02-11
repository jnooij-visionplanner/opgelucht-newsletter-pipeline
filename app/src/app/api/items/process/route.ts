import { NextResponse } from "next/server";
import { processAllItems } from "@/lib/services/article-processor";

/**
 * POST /api/items/process — Trigger processing of all unprocessed items.
 * Runs paywall detection, archive resolution, and content extraction.
 */
export async function POST() {
  try {
    const result = await processAllItems();

    const status =
      result.errors.length > 0 && result.itemsProcessed > 0 ? 207 : 200;

    return NextResponse.json(result, { status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
