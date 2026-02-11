/**
 * Joomla CMS Push Service
 *
 * Pushes generated articles to the Joomla CMS via its REST API.
 * Uses JOOMLA_API_URL and JOOMLA_API_TOKEN environment variables.
 *
 * Issue #27 — Joomla CMS Publishing Push
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface JoomlaPushPayload {
  title: string;
  introtext: string;
  fulltext: string;
  catid: number;
  state: number; // 0 = unpublished, 1 = published, 2 = archived
  language: string;
  metadesc?: string;
}

export interface JoomlaPushResult {
  success: boolean;
  joomlaArticleId?: number;
  error?: string;
}

// ── Configuration ──────────────────────────────────────────────────────

function getJoomlaConfig(): { apiUrl: string; apiToken: string } {
  const apiUrl = process.env.JOOMLA_API_URL;
  const apiToken = process.env.JOOMLA_API_TOKEN;

  if (!apiUrl || !apiToken) {
    throw new Error(
      "Joomla configuratie ontbreekt: JOOMLA_API_URL en JOOMLA_API_TOKEN zijn vereist"
    );
  }

  return { apiUrl: apiUrl.replace(/\/$/, ""), apiToken };
}

// ── Push function ──────────────────────────────────────────────────────

/**
 * Push an article to Joomla CMS.
 *
 * Sends the article as an unpublished draft (state=0) so the editor
 * can review it in Joomla before publishing.
 */
export async function pushToJoomla(params: {
  title: string;
  introduction: string;
  narrativeSummary: string;
  sourceListHtml: string;
  categoryExternalId?: number | null;
  metaDescription?: string;
}): Promise<JoomlaPushResult> {
  const { apiUrl, apiToken } = getJoomlaConfig();

  // Build the full article body: narrative + source list
  const fulltext = `${params.narrativeSummary}\n\n<h3>Bronnen</h3>\n${params.sourceListHtml}`;

  const payload: JoomlaPushPayload = {
    title: params.title,
    introtext: params.introduction,
    fulltext,
    catid: params.categoryExternalId || 2, // Default to "Uncategorised" (Joomla default catid=2)
    state: 0, // Unpublished draft
    language: "nl-NL",
    metadesc: params.metaDescription || params.introduction,
  };

  console.log(`[Joomla] Pushing article: "${params.title}" to ${apiUrl}`);

  try {
    const response = await fetch(
      `${apiUrl}/api/index.php/v1/content/articles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Joomla] Push failed (${response.status}): ${errorText}`
      );
      return {
        success: false,
        error: `Joomla API fout (${response.status}): ${errorText.substring(0, 200)}`,
      };
    }

    const result = await response.json();
    const joomlaArticleId = result?.data?.id || result?.data?.attributes?.id;

    console.log(
      `[Joomla] Article pushed successfully: Joomla ID ${joomlaArticleId}`
    );

    return {
      success: true,
      joomlaArticleId: joomlaArticleId ? Number(joomlaArticleId) : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende fout";
    console.error(`[Joomla] Push failed:`, message);
    return {
      success: false,
      error: `Verbindingsfout: ${message}`,
    };
  }
}
