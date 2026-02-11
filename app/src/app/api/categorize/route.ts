import { NextRequest, NextResponse } from "next/server";
import { categorizeNewsItem } from "@/lib/services/llm-categorization";
import { categorizeItemSchema, formatZodError } from "@/lib/validations/api-schemas";

/**
 * POST /api/categorize — Categorize a news item from the active category list
 * Body: { itemId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = categorizeItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { itemId } = parsed.data;

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
