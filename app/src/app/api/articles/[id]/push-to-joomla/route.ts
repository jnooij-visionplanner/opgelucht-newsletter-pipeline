import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generatedArticles } from "@/db/schema/generated-articles";
import { categories } from "@/db/schema/categories";
import { eq } from "drizzle-orm";
import { pushToJoomla } from "@/lib/services/joomla";

/**
 * POST /api/articles/:id/push-to-joomla — Push article to Joomla CMS
 *
 * Pushes the article as an unpublished draft.
 * Updates joomlaPushStatus to "pushed" or "failed".
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  try {
    // Fetch article
    const article = db
      .select()
      .from(generatedArticles)
      .where(eq(generatedArticles.id, numId))
      .get();

    if (!article) {
      return NextResponse.json(
        { error: "Artikel niet gevonden" },
        { status: 404 }
      );
    }

    // Get category external ID if category is assigned
    let categoryExternalId: number | null = null;
    if (article.categoryId) {
      const cat = db
        .select()
        .from(categories)
        .where(eq(categories.id, article.categoryId))
        .get();
      categoryExternalId = cat?.externalId ?? null;
    }

    // Push to Joomla
    const result = await pushToJoomla({
      title: article.title,
      introduction: article.introduction,
      narrativeSummary: article.narrativeSummary,
      sourceListHtml: article.sourceListHtml,
      categoryExternalId,
      metaDescription: article.introduction,
    });

    // Update push status
    const pushStatus = result.success ? "pushed" : "failed";
    db.update(generatedArticles)
      .set({
        joomlaPushStatus: pushStatus as "pending" | "pushed" | "failed",
        joomlaPushedAt: result.success ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(generatedArticles.id, numId))
      .run();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Push naar Joomla mislukt",
          pushStatus: "failed",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      joomlaArticleId: result.joomlaArticleId,
      pushStatus: "pushed",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Push mislukt";
    console.error("[API] Joomla push failed:", message);

    // Update status to failed
    db.update(generatedArticles)
      .set({
        joomlaPushStatus: "failed" as const,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(generatedArticles.id, numId))
      .run();

    return NextResponse.json(
      { error: `Push mislukt: ${message}` },
      { status: 500 }
    );
  }
}
