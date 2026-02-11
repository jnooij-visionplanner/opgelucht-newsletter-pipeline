import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generatedArticles } from "@/db/schema/generated-articles";
import { newsItems } from "@/db/schema/news-items";
import { eq, desc } from "drizzle-orm";
import { chatCompletion } from "@/lib/services/openai";
import {
  buildSourceListHtml,
  parseGeneratedArticle,
  validateLimits,
  truncateAtWordBoundary,
} from "@/lib/services/article-generation";
import { classifyItem } from "@/lib/services/llm-classification";
import { categorizeItem } from "@/lib/services/llm-categorization";
import {
  findRelatedArticles,
  formatRelatedContext,
} from "@/lib/services/related-articles";

const TITLE_MAX_CHARS = 36;
const INTRO_MAX_CHARS = 175;
const GENERATION_MAX_TOKENS = 2000;

/**
 * POST /api/articles/:id/regenerate — Regenerate an article with optional instructions
 *
 * Body: { "instructions"?: string }
 *
 * Appends any editor instructions to the prompt, then regenerates entirely.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Ongeldig ID" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const instructions = body.instructions || "";

    // Fetch existing article
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

    if (!article.topicClusterId) {
      return NextResponse.json(
        { error: "Artikel heeft geen gekoppeld cluster" },
        { status: 400 }
      );
    }

    // Fetch cluster items
    const items = db
      .select()
      .from(newsItems)
      .where(eq(newsItems.topicClusterId, article.topicClusterId))
      .orderBy(desc(newsItems.publishedDate))
      .all();

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Cluster heeft geen items" },
        { status: 400 }
      );
    }

    // Find related articles
    const relatedArticles = await findRelatedArticles(items);
    const relatedContext = formatRelatedContext(relatedArticles);

    // Rebuild source list
    const allSourceItems = [
      ...items,
      ...relatedArticles.map((ra) => ({
        title: ra.title,
        originalUrl: ra.originalUrl,
        sourceName: ra.sourceName,
        publishedDate: ra.publishedDate,
      })),
    ];
    const sourceListHtml = buildSourceListHtml(allSourceItems);

    // Build regeneration prompt
    const sourceLines = items.map((item, i) => {
      const date = (item.publishedDate || "").split("T")[0];
      const source = item.sourceName || "Onbekend";
      return `${i + 1}. [${date}] ${item.title} (${source})\n   URL: ${item.originalUrl}\n   Samenvatting: ${item.snippet || "(niet beschikbaar)"}`;
    });

    let userPrompt = `Schrijf een artikel op basis van de volgende ${items.length} bronnen:

${sourceLines.join("\n\n")}
${relatedContext}

Genereer een artikel volgens het Standaard Patroon (titel ≤${TITLE_MAX_CHARS} tekens, introductie ≤${INTRO_MAX_CHARS} tekens, narratief in HTML).`;

    // Append editor instructions if provided
    if (instructions.trim()) {
      userPrompt += `\n\nBELANGRIJKE REDACTIE-INSTRUCTIES:\n${instructions.trim()}`;
    }

    // System prompt
    const systemPrompt = `Je bent een professionele Nederlandse journalist voor het nieuwsblad van Rookvrije Generatie.
Je schrijft artikelen over tabaksbeleid, rookvrij opgroeien, en gerelateerd gezondheidsnieuws.

Je genereert artikelen volgens het "Standaard Patroon":

1. TITEL: Maximaal ${TITLE_MAX_CHARS} tekens. Pakkend, informatief, in het Nederlands.
2. INTRODUCTIE: Maximaal ${INTRO_MAX_CHARS} tekens. Beknopte samenvatting in het Nederlands.
3. NARRATIEF: Volledig HTML-artikel met <p> tags. Schrijf in het Nederlands.

Geef je antwoord in EXACT dit formaat:
TITEL: [jouw titel hier]
INTRODUCTIE: [jouw introductie hier]
NARRATIEF:
[jouw HTML-narratief hier]`;

    // Generate
    const response = await chatCompletion({
      systemPrompt,
      userPrompt,
      maxTokens: GENERATION_MAX_TOKENS,
      temperature: 0.4,
    });

    const parsed = parseGeneratedArticle(response);
    const validation = validateLimits(parsed.title, parsed.introduction);

    // Truncate if over limits
    const title = validation.titleValid
      ? parsed.title
      : truncateAtWordBoundary(parsed.title, TITLE_MAX_CHARS);
    const introduction = validation.introValid
      ? parsed.introduction
      : truncateAtWordBoundary(parsed.introduction, INTRO_MAX_CHARS);

    // Re-classify and re-categorize
    const combinedContent = `${title} ${introduction} ${parsed.narrativeSummary}`;
    const classificationResult = await classifyItem(title, combinedContent);
    const categorizationResult = await categorizeItem(title, combinedContent);

    // Update existing article
    const updated = db
      .update(generatedArticles)
      .set({
        title,
        introduction,
        narrativeSummary: parsed.narrativeSummary,
        sourceListHtml,
        classification: classificationResult.classification as
          | "binnenland"
          | "buitenland",
        categoryId: categorizationResult.categoryId,
        joomlaPushStatus: "pending",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(generatedArticles.id, numId))
      .returning()
      .get();

    console.log(
      `[Regenerate] Article ${numId} regenerated: "${title}" (instructions: ${instructions ? "yes" : "none"})`
    );

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Regeneratie mislukt";
    console.error("[API] Regeneration failed:", message);
    return NextResponse.json(
      { error: `Regeneratie mislukt: ${message}` },
      { status: 500 }
    );
  }
}
