import { NextRequest, NextResponse } from "next/server";
import { generateArticle } from "@/lib/services/article-generation";

/**
 * POST /api/generate — Generate an article draft for a topic cluster
 *
 * Body: { "clusterId": number }
 * Returns: { "articleId": number, ... }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clusterId = body.clusterId;

    if (!clusterId || typeof clusterId !== "number") {
      return NextResponse.json(
        { error: "clusterId is verplicht (number)" },
        { status: 400 }
      );
    }

    const result = await generateArticle(clusterId);

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
