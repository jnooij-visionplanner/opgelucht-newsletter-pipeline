import { NextRequest, NextResponse } from "next/server";
import { classifyNewsItem } from "@/lib/services/llm-classification";

/**
 * POST /api/classify — Classify a news item as Binnenland/Buitenland
 * Body: { itemId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId } = body;

    if (!itemId || typeof itemId !== "number") {
      return NextResponse.json(
        { error: "itemId is required and must be a number" },
        { status: 400 }
      );
    }

    const result = await classifyNewsItem(itemId);

    return NextResponse.json({
      itemId,
      classification: result.dutchLabel,
      value: result.classification,
    });
  } catch (error) {
    console.error("[API] Classification failed:", error);
    const message =
      error instanceof Error ? error.message : "Classification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
