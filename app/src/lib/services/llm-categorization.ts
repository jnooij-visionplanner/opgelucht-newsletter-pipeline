/**
 * LLM Categorization Service
 *
 * Assigns a category from the active category list to news items using an LLM.
 *
 * Issue #39 — LLM Categorization from Active List
 */

import { db } from "@/db";
import { categories, type Category } from "@/db/schema/categories";
import { generatedArticles } from "@/db/schema/generated-articles";
import { newsItems } from "@/db/schema/news-items";
import { eq } from "drizzle-orm";
import { chatCompletion } from "./openai";

// ── Types ──────────────────────────────────────────────────────────────

export interface CategorizationResult {
  categoryId: number;
  categoryName: string;
}

// ── System prompt ──────────────────────────────────────────────────────

function buildCategorizationSystemPrompt(cats: Category[]): string {
  const categoryList = cats
    .map((c) => `- ${c.name}${c.description ? ` (${c.description})` : ""}`)
    .join("\n");

  return `Je bent een nieuwscategorisatie-assistent voor een Nederlands rookvrij-generatie nieuwsblad.
Je taak is om nieuwsitems in te delen bij EXACT één categorie uit de onderstaande lijst.

Beschikbare categorieën:
${categoryList}

Regels:
- Kies de meest relevante categorie op basis van het onderwerp van het artikel
- Geef ALLEEN de exacte categorienaam als antwoord (geen extra tekst)
- Als geen categorie goed past, kies dan "Nieuws" als die bestaat, anders de meest algemene categorie
- Wees consistent: vergelijkbare artikelen moeten dezelfde categorie krijgen`;
}

// ── Helper: match LLM response to category ─────────────────────────────

function matchCategory(
  response: string,
  cats: Category[]
): Category | null {
  const normalized = response.toLowerCase().trim();

  // Exact match
  for (const cat of cats) {
    if (cat.name.toLowerCase() === normalized) {
      return cat;
    }
  }

  // Fuzzy match: check if the response contains a category name
  for (const cat of cats) {
    if (normalized.includes(cat.name.toLowerCase())) {
      return cat;
    }
  }

  // Check if a category name contains the response
  for (const cat of cats) {
    if (cat.name.toLowerCase().includes(normalized)) {
      return cat;
    }
  }

  return null;
}

// ── Categorization functions ───────────────────────────────────────────

/**
 * Get all active categories from the database.
 */
export function getActiveCategories(): Category[] {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .all();
}

/**
 * Categorize a single item based on its title and content.
 * Optionally accepts categories array for testing (skips DB query).
 */
export async function categorizeItem(
  title: string,
  content: string | null,
  injectedCategories?: Category[]
): Promise<CategorizationResult> {
  const activeCats = injectedCategories ?? getActiveCategories();

  if (activeCats.length === 0) {
    throw new Error("No active categories found. Add categories first.");
  }

  const truncatedContent = content
    ? content.substring(0, 2000)
    : "(geen inhoud beschikbaar)";

  const userPrompt = `Titel: ${title}\nInhoud: ${truncatedContent}`;

  const response = await chatCompletion({
    systemPrompt: buildCategorizationSystemPrompt(activeCats),
    userPrompt,
    temperature: 0.1,
    maxTokens: 50,
  });

  const matched = matchCategory(response, activeCats);

  if (matched) {
    return { categoryId: matched.id, categoryName: matched.name };
  }

  // Fallback: try to find "Nieuws" category, or use the first one
  const fallback =
    activeCats.find((c) => c.name.toLowerCase() === "nieuws") ||
    activeCats[0];

  console.warn(
    `[Categorize] LLM returned "${response}" which didn't match any category. Falling back to "${fallback.name}"`
  );

  return { categoryId: fallback.id, categoryName: fallback.name };
}

/**
 * Categorize a generated article by its ID.
 */
export async function categorizeArticle(
  articleId: number
): Promise<CategorizationResult> {
  const article = db
    .select()
    .from(generatedArticles)
    .where(eq(generatedArticles.id, articleId))
    .get();

  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }

  const result = await categorizeItem(
    article.title,
    article.narrativeSummary
  );

  // Update the article
  db.update(generatedArticles)
    .set({
      categoryId: result.categoryId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(generatedArticles.id, articleId))
    .run();

  return result;
}

/**
 * Categorize a news item by its ID (for pre-generation categorization).
 */
export async function categorizeNewsItem(
  itemId: number
): Promise<CategorizationResult> {
  const item = db
    .select()
    .from(newsItems)
    .where(eq(newsItems.id, itemId))
    .get();

  if (!item) {
    throw new Error(`News item ${itemId} not found`);
  }

  return categorizeItem(item.title, item.fullContent || item.snippet);
}
