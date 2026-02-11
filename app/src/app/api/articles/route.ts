import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generatedArticles } from "@/db/schema/generated-articles";
import { desc, count } from "drizzle-orm";

/**
 * GET /api/articles — List generated articles with pagination
 * Returns { articles, total } for pagination support.
 * Excludes large content fields (narrativeSummary, sourceListHtml) from list response.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const articles = db
      .select({
        id: generatedArticles.id,
        topicClusterId: generatedArticles.topicClusterId,
        categoryId: generatedArticles.categoryId,
        classification: generatedArticles.classification,
        title: generatedArticles.title,
        introduction: generatedArticles.introduction,
        joomlaPushStatus: generatedArticles.joomlaPushStatus,
        joomlaPushedAt: generatedArticles.joomlaPushedAt,
        createdAt: generatedArticles.createdAt,
        updatedAt: generatedArticles.updatedAt,
      })
      .from(generatedArticles)
      .orderBy(desc(generatedArticles.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    const total =
      db.select({ count: count() }).from(generatedArticles).get()?.count ?? 0;

    return NextResponse.json({ articles, total });
  } catch (error) {
    console.error("[API] Failed to list articles:", error);
    return NextResponse.json(
      { error: "Failed to list articles" },
      { status: 500 }
    );
  }
}
