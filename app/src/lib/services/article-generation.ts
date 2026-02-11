/**
 * Article Draft Generation Service
 *
 * Generates article drafts following the "Standard Pattern":
 * - Source List (HTML) sorted newest first
 * - Title (≤36 characters, Dutch)
 * - Introduction (≤175 characters, Dutch)
 * - Narrative Summary (full HTML, Dutch)
 *
 * Issue #24 — Article Draft Generation (Standard Pattern)
 * Issue #41 — Title & Intro Validation and Regeneration
 * Issue #23 — Related Article Enrichment (Past Month Search)
 */

import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { generatedArticles } from "@/db/schema/generated-articles";
import { systemPrompts } from "@/db/schema/generated-articles";
import { eq, desc, and } from "drizzle-orm";
import { chatCompletion } from "./openai";
import { classifyItem } from "./llm-classification";
import { categorizeItem } from "./llm-categorization";
import { findRelatedArticles, formatRelatedContext } from "./related-articles";

// ── Configuration ──────────────────────────────────────────────────────

const TITLE_MAX_CHARS = 36;
const INTRO_MAX_CHARS = 175;
const MAX_VALIDATION_RETRIES = 2;
const GENERATION_MAX_TOKENS = 2000;

// ── Types ──────────────────────────────────────────────────────────────

export interface GenerationResult {
  articleId: number;
  title: string;
  introduction: string;
  sourceListHtml: string;
  narrativeSummary: string;
  classification: string;
  categoryId: number | null;
  titleRetries: number;
  introRetries: number;
}

interface ParsedArticle {
  title: string;
  introduction: string;
  sourceListHtml: string;
  narrativeSummary: string;
}

// ── Source list generation ──────────────────────────────────────────────

/**
 * Build the HTML source list from news items, sorted newest first.
 */
export function buildSourceListHtml(
  items: { title: string; originalUrl: string; sourceName: string | null; publishedDate: string }[]
): string {
  const sorted = [...items].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );

  const lis = sorted
    .map(
      (item) =>
        `<li><a href="${escapeHtml(item.originalUrl)}" target="_blank">${escapeHtml(item.title)} - ${escapeHtml(item.sourceName || "Onbekend")}</a></li>`
    )
    .join("\n  ");

  return `<ul>\n  ${lis}\n</ul>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── LLM prompt building ───────────────────────────────────────────────

function getDefaultSystemPrompt(): string {
  return `Je bent een professionele Nederlandse journalist voor het nieuwsblad van Rookvrije Generatie.
Je schrijft artikelen over tabaksbeleid, rookvrij opgroeien, en gerelateerd gezondheidsnieuws.

Je genereert artikelen volgens het "Standaard Patroon":

1. TITEL: Maximaal ${TITLE_MAX_CHARS} tekens. Pakkend, informatief, in het Nederlands.
2. INTRODUCTIE: Maximaal ${INTRO_MAX_CHARS} tekens. Beknopte samenvatting in het Nederlands.
3. NARRATIEF: Volledig HTML-artikel met <p> tags. Schrijf in het Nederlands.
   - Verwijs naar bronnen in de tekst
   - Gebruik een informatieve, objectieve toon
   - Vermeld relevante context en achtergrond

BELANGRIJK:
- Titel MOET ≤${TITLE_MAX_CHARS} tekens zijn (tel zorgvuldig!)
- Introductie MOET ≤${INTRO_MAX_CHARS} tekens zijn (tel zorgvuldig!)
- Alles in het Nederlands
- Gebruik HTML <p> tags voor alinea's in het narratief

Geef je antwoord in EXACT dit formaat:
TITEL: [jouw titel hier]
INTRODUCTIE: [jouw introductie hier]
NARRATIEF:
[jouw HTML-narratief hier]`;
}

function buildUserPrompt(
  items: { title: string; snippet: string | null; originalUrl: string; sourceName: string | null; publishedDate: string }[],
  relatedContext: string
): string {
  const sourceLines = items.map((item, i) => {
    const date = item.publishedDate.split("T")[0];
    const source = item.sourceName || "Onbekend";
    return `${i + 1}. [${date}] ${item.title} (${source})\n   URL: ${item.originalUrl}\n   Samenvatting: ${item.snippet || "(niet beschikbaar)"}`;
  });

  return `Schrijf een artikel op basis van de volgende ${items.length} bronnen:

${sourceLines.join("\n\n")}
${relatedContext}

Genereer een artikel volgens het Standaard Patroon (titel ≤${TITLE_MAX_CHARS} tekens, introductie ≤${INTRO_MAX_CHARS} tekens, narratief in HTML).`;
}

function buildStricterPrompt(
  original: string,
  titleTooLong: boolean,
  introTooLong: boolean
): string {
  const fixes: string[] = [];
  if (titleTooLong) {
    fixes.push(
      `De titel was te lang. De titel MOET STRIKT MAXIMAAL ${TITLE_MAX_CHARS} tekens zijn. Tel elk teken zorgvuldig. Maak de titel korter!`
    );
  }
  if (introTooLong) {
    fixes.push(
      `De introductie was te lang. De introductie MOET STRIKT MAXIMAAL ${INTRO_MAX_CHARS} tekens zijn. Tel elk teken zorgvuldig. Maak de introductie korter!`
    );
  }

  return `${original}\n\nLET OP - CORRECTIE NODIG:\n${fixes.join("\n")}`;
}

// ── Response parsing ──────────────────────────────────────────────────

/**
 * Parse the LLM response into structured components.
 */
export function parseGeneratedArticle(response: string): ParsedArticle {
  // Extract title
  const titleMatch = response.match(/TITEL:\s*(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract introduction
  const introMatch = response.match(/INTRODUCTIE:\s*(.+?)(?:\n|$)/);
  const introduction = introMatch ? introMatch[1].trim() : "";

  // Extract narrative (everything after NARRATIEF:)
  const narrativeMatch = response.match(/NARRATIEF:\s*\n?([\s\S]+)$/);
  const narrativeSummary = narrativeMatch
    ? narrativeMatch[1].trim()
    : "";

  return { title, introduction, sourceListHtml: "", narrativeSummary };
}

// ── Validation & truncation ───────────────────────────────────────────

/**
 * Validate title and intro character limits.
 * Returns which fields exceed limits.
 */
export function validateLimits(title: string, intro: string): {
  titleValid: boolean;
  introValid: boolean;
  titleLength: number;
  introLength: number;
} {
  return {
    titleValid: title.length <= TITLE_MAX_CHARS,
    introValid: intro.length <= INTRO_MAX_CHARS,
    titleLength: title.length,
    introLength: intro.length,
  };
}

/**
 * Intelligently truncate text at a word boundary with ellipsis.
 */
export function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Reserve 3 chars for "..."
  const target = maxLength - 3;
  if (target <= 0) return text.substring(0, maxLength);

  // Find last space before target
  const lastSpace = text.lastIndexOf(" ", target);
  if (lastSpace > target * 0.5) {
    return text.substring(0, lastSpace) + "...";
  }

  // No good word boundary, hard truncate
  return text.substring(0, target) + "...";
}

// ── Main generation flow ──────────────────────────────────────────────

/**
 * Get the active system prompt, or fall back to the default.
 */
async function getActiveSystemPrompt(): Promise<{ id: number | null; content: string }> {
  const active = db
    .select()
    .from(systemPrompts)
    .where(eq(systemPrompts.isActive, true))
    .orderBy(desc(systemPrompts.version))
    .limit(1)
    .all();

  if (active.length > 0) {
    return { id: active[0].id, content: active[0].content };
  }

  return { id: null, content: getDefaultSystemPrompt() };
}

/**
 * Generate an article draft for a topic cluster.
 *
 * Flow:
 * 1. Fetch cluster items
 * 2. Search for related articles (past month)
 * 3. Build source list HTML
 * 4. Call LLM to generate title, intro, narrative
 * 5. Validate character limits (retry up to 2x, then truncate)
 * 6. Classify (binnenland/buitenland) and categorize
 * 7. Store GeneratedArticle record
 */
export async function generateArticle(clusterId: number): Promise<GenerationResult> {
  console.log(`[Generate] Starting generation for cluster ${clusterId}`);

  // 1. Fetch cluster and its items
  const cluster = db
    .select()
    .from(topicClusters)
    .where(eq(topicClusters.id, clusterId))
    .get();

  if (!cluster) {
    throw new Error(`Cluster ${clusterId} niet gevonden`);
  }

  const items = db
    .select()
    .from(newsItems)
    .where(eq(newsItems.topicClusterId, clusterId))
    .orderBy(desc(newsItems.publishedDate))
    .all();

  if (items.length === 0) {
    throw new Error(`Cluster ${clusterId} heeft geen items`);
  }

  // 2. Find related articles from past month
  const relatedArticles = await findRelatedArticles(items);
  const relatedContext = formatRelatedContext(relatedArticles);

  // 3. Build source list HTML (includes related articles)
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

  // 4. Get system prompt
  const { id: promptVersionId, content: systemPromptContent } =
    await getActiveSystemPrompt();

  // 5. Generate with LLM + validate
  const userPrompt = buildUserPrompt(items, relatedContext);
  let titleRetries = 0;
  let introRetries = 0;
  let parsed: ParsedArticle;
  let validation;
  let currentUserPrompt = userPrompt;

  // Initial generation
  const response = await chatCompletion({
    systemPrompt: systemPromptContent,
    userPrompt: currentUserPrompt,
    maxTokens: GENERATION_MAX_TOKENS,
    temperature: 0.4,
  });
  parsed = parseGeneratedArticle(response);
  validation = validateLimits(parsed.title, parsed.introduction);

  // Retry loop for character limit compliance
  for (let attempt = 0; attempt < MAX_VALIDATION_RETRIES; attempt++) {
    if (validation.titleValid && validation.introValid) break;

    console.log(
      `[Generate] Validation failed (attempt ${attempt + 1}): title=${validation.titleLength}/${TITLE_MAX_CHARS}, intro=${validation.introLength}/${INTRO_MAX_CHARS}`
    );

    currentUserPrompt = buildStricterPrompt(
      userPrompt,
      !validation.titleValid,
      !validation.introValid
    );

    if (!validation.titleValid) titleRetries++;
    if (!validation.introValid) introRetries++;

    const retryResponse = await chatCompletion({
      systemPrompt: systemPromptContent,
      userPrompt: currentUserPrompt,
      maxTokens: GENERATION_MAX_TOKENS,
      temperature: 0.3,
    });
    parsed = parseGeneratedArticle(retryResponse);
    validation = validateLimits(parsed.title, parsed.introduction);
  }

  // Fallback: truncate at word boundary if still over limit
  if (!validation.titleValid) {
    console.log(
      `[Generate] Title still over limit after retries (${validation.titleLength}), truncating`
    );
    parsed.title = truncateAtWordBoundary(parsed.title, TITLE_MAX_CHARS);
  }
  if (!validation.introValid) {
    console.log(
      `[Generate] Intro still over limit after retries (${validation.introLength}), truncating`
    );
    parsed.introduction = truncateAtWordBoundary(
      parsed.introduction,
      INTRO_MAX_CHARS
    );
  }

  // 6. Classify and categorize
  const combinedContent = `${parsed.title} ${parsed.introduction} ${parsed.narrativeSummary}`;
  const classificationResult = await classifyItem(parsed.title, combinedContent);
  const categorizationResult = await categorizeItem(parsed.title, combinedContent);

  // 7. Store record
  const article = db
    .insert(generatedArticles)
    .values({
      topicClusterId: clusterId,
      categoryId: categorizationResult.categoryId,
      classification: classificationResult.classification,
      title: parsed.title,
      introduction: parsed.introduction,
      narrativeSummary: parsed.narrativeSummary,
      sourceListHtml,
      promptVersionId,
    })
    .returning()
    .get();

  console.log(
    `[Generate] Article ${article.id} created for cluster ${clusterId}: "${parsed.title}" (${classificationResult.classification}, cat=${categorizationResult.categoryName})`
  );

  return {
    articleId: article.id,
    title: parsed.title,
    introduction: parsed.introduction,
    sourceListHtml,
    narrativeSummary: parsed.narrativeSummary,
    classification: classificationResult.classification,
    categoryId: categorizationResult.categoryId,
    titleRetries,
    introRetries,
  };
}
