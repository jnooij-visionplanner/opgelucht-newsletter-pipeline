import { NextRequest, NextResponse } from "next/server";
import { classifyNewsItem } from "@/lib/services/llm-classification";
import { classifyItemSchema, formatZodError } from "@/lib/validations/api-schemas";

/**
 * POST /api/classify — Classify a news item as Binnenland/Buitenland
 * Body: { itemId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = classifyItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { itemId } = parsed.data;

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
