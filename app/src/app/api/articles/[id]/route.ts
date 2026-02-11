import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generatedArticles } from "@/db/schema/generated-articles";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateArticleSchema = z.object({
  classification: z.enum(["binnenland", "buitenland"]).optional(),
  categoryId: z.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  introduction: z.string().min(1).max(500).optional(),
});

/**
 * GET /api/articles/:id — Get a generated article
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const article = db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.id, numId))
    .get();

  if (!article) {
    return NextResponse.json(
      { error: "Article not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(article);
}

/**
 * PUT /api/articles/:id — Update article (editor override)
 * Allows overriding classification, category, title, introduction
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = updateArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(generatedArticles)
      .where(eq(generatedArticles.id, numId))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const updated = db
      .update(generatedArticles)
      .set({
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(generatedArticles.id, numId))
      .returning()
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[API] Failed to update article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}
