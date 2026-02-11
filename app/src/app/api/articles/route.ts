import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generatedArticles } from "@/db/schema/generated-articles";
import { desc } from "drizzle-orm";

/**
 * GET /api/articles — List generated articles with pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const articles = db
      .select()
      .from(generatedArticles)
      .orderBy(desc(generatedArticles.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return NextResponse.json(articles);
  } catch (error) {
    console.error("[API] Failed to list articles:", error);
    return NextResponse.json(
      { error: "Failed to list articles" },
      { status: 500 }
    );
  }
}
