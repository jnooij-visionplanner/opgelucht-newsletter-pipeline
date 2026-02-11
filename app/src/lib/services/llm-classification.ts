/**
 * LLM Classification Service
 *
 * Classifies news items as "Binnenland" (domestic) or "Buitenland" (international)
 * using an LLM.
 *
 * Issue #19 — LLM Classification (Binnenland/Buitenland)
 */

import { db } from "@/db";
import { generatedArticles } from "@/db/schema/generated-articles";
import { newsItems } from "@/db/schema/news-items";
import { eq } from "drizzle-orm";
import { chatCompletion } from "./openai";

// ── Types ──────────────────────────────────────────────────────────────

export type Classification = "binnenland" | "buitenland";

export interface ClassificationResult {
  classification: Classification;
  dutchLabel: string;
}

// ── System prompt ──────────────────────────────────────────────────────

const CLASSIFICATION_SYSTEM_PROMPT = `Je bent een nieuwsclassificatie-assistent voor een Nederlands rookvrij-generatie nieuwsblad.
Je taak is om nieuwsitems te classificeren als "Binnenland" (Nederlandse/lokale focus) of "Buitenland" (internationale focus).

Regels:
- Artikelen over Nederlandse wetgeving, beleid, evenementen, of organisaties → "Binnenland"
- Artikelen over EU-beleid, internationale verdragen, buitenlands onderzoek → "Buitenland"
- Artikelen over Nederland binnen een internationale context → "Binnenland" (tenzij de focus duidelijk internationaal is)
- Bij twijfel, kies "Binnenland"

Geef ALLEEN "Binnenland" of "Buitenland" als antwoord. Geen uitleg, geen extra tekst.`;

// ── Classification functions ───────────────────────────────────────────

/**
 * Classify a single news item by analyzing its title and content.
 */
export async function classifyItem(
  title: string,
  content: string | null
): Promise<ClassificationResult> {
  const truncatedContent = content
    ? content.substring(0, 2000)
    : "(geen inhoud beschikbaar)";

  const userPrompt = `Titel: ${title}\nInhoud: ${truncatedContent}`;

  const response = await chatCompletion({
    systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.1,
    maxTokens: 20,
  });

  const normalized = response.toLowerCase().trim();

  if (normalized.includes("buitenland")) {
    return { classification: "buitenland", dutchLabel: "Buitenland" };
  }

  // Default to binnenland
  return { classification: "binnenland", dutchLabel: "Binnenland" };
}

/**
 * Classify a generated article by its ID.
 * Fetches the related news items for content context.
 */
export async function classifyArticle(
  articleId: number
): Promise<ClassificationResult> {
  const article = db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.id, articleId))
    .get();

  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }

  // Use the article's own title and narrative as context
  const result = await classifyItem(
    article.title,
    article.narrativeSummary
  );

  // Update the article
  db.update(generatedArticles)
    .set({
      classification: result.classification,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(generatedArticles.id, articleId))
    .run();

  return result;
}

/**
 * Classify a news item by its ID (for pre-generation classification).
 */
export async function classifyNewsItem(
  itemId: number
): Promise<ClassificationResult> {
  const item = db
    .select()
    .from(newsItems)
    .where(eq(newsItems.id, itemId))
    .get();

  if (!item) {
    throw new Error(`News item ${itemId} not found`);
  }

  return classifyItem(item.title, item.fullContent || item.snippet);
}
