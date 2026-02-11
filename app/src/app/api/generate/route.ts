import { NextRequest, NextResponse } from "next/server";
import { generateArticle } from "@/lib/services/article-generation";
import { generateArticleSchema, formatZodError } from "@/lib/validations/api-schemas";

/**
 * POST /api/generate — Generate an article draft for a topic cluster
 *
 * Body: { "clusterId": number }
 * Returns: { "articleId": number, ... }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const result = await generateArticle(parsed.data.clusterId);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("[API] Generation failed:", message);

    if (message.includes("niet gevonden") || message.includes("geen items")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Generatie mislukt: ${message}` },
      { status: 500 }
    );
  }
}
