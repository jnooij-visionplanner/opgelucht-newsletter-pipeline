import { NextRequest, NextResponse } from "next/server";
import { categorizeNewsItem } from "@/lib/services/llm-categorization";

/**
 * POST /api/categorize — Categorize a news item from the active category list
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

    const result = await categorizeNewsItem(itemId);

    return NextResponse.json({
      itemId,
      categoryId: result.categoryId,
      categoryName: result.categoryName,
    });
  } catch (error) {
    console.error("[API] Categorization failed:", error);
    const message =
      error instanceof Error ? error.message : "Categorization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
