import { NextResponse } from "next/server";
import { processSingleItem } from "@/lib/services/article-processor";

/**
 * POST /api/items/[id]/process — Process a single news item.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id, 10);

  if (isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
  }

  try {
    const result = await processSingleItem(itemId);

    if (!result) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
