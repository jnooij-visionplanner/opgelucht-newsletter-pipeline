/**
 * Topic Clustering Service
 *
 * Groups news items by similarity using TF-IDF + cosine similarity.
 * Assigns items to TopicCluster records so editors see deduplicated topics.
 *
 * Issue #14 — Topic Clustering
 */

import { db } from "@/db";
import { newsItems, topicClusters } from "@/db/schema/news-items";
import { isNull, eq } from "drizzle-orm";

// ── Configuration ──────────────────────────────────────────────────────
const SIMILARITY_THRESHOLD = parseFloat(
  process.env.CLUSTERING_THRESHOLD || "0.35"
);

// ── Dutch stop words ───────────────────────────────────────────────────
const DUTCH_STOP_WORDS = new Set([
  "de",
  "het",
  "een",
  "van",
  "en",
  "in",
  "is",
  "dat",
  "op",
  "te",
  "zijn",
  "er",
  "aan",
  "voor",
  "met",
  "als",
  "niet",
  "maar",
  "om",
  "ook",
  "dan",
  "die",
  "dit",
  "wat",
  "nog",
  "wel",
  "al",
  "door",
  "bij",
  "zo",
  "naar",
  "kan",
  "na",
  "wordt",
  "werd",
  "uit",
  "over",
  "meer",
  "heeft",
  "tot",
  "was",
  "worden",
  "hun",
  "hebben",
  "zou",
  "zich",
  "alle",
  "onder",
  "andere",
  "veel",
  "geen",
  "nieuwe",
  "jaar",
  "moet",
  "had",
  "zij",
  "hij",
  "wij",
  "haar",
  "wie",
  "zal",
  "hier",
  "nu",
  "nog",
  "waar",
  // English stop words (many Dutch articles include English)
  "the",
  "and",
  "of",
  "to",
  "a",
  "in",
  "is",
  "for",
  "on",
  "that",
  "with",
]);

// ── Text processing ────────────────────────────────────────────────────

/** Tokenize text into lowercased word stems, stripping stop words. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !DUTCH_STOP_WORDS.has(w));
}

/**
 * Build a TF-IDF matrix from an array of documents (token arrays).
 * Returns a Map<docIndex, Map<term, tfidf>>.
 */
export function buildTfIdf(
  docs: string[][]
): Map<number, Map<string, number>> {
  const N = docs.length;
  if (N === 0) return new Map();

  // Document frequency: how many docs contain each term
  const df = new Map<string, number>();
  for (const tokens of docs) {
    const seen = new Set(tokens);
    for (const term of seen) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  // Compute TF-IDF for each doc
  const tfidfMatrix = new Map<number, Map<string, number>>();
  for (let i = 0; i < N; i++) {
    const tokens = docs[i];
    const termCounts = new Map<string, number>();
    for (const t of tokens) {
      termCounts.set(t, (termCounts.get(t) || 0) + 1);
    }

    const tfidfVec = new Map<string, number>();
    const docLen = tokens.length || 1;
    for (const [term, count] of termCounts) {
      const tf = count / docLen;
      const idf = Math.log(N / (df.get(term) || 1));
      tfidfVec.set(term, tf * idf);
    }
    tfidfMatrix.set(i, tfidfVec);
  }

  return tfidfMatrix;
}

/** Cosine similarity between two sparse TF-IDF vectors. */
export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, valA] of a) {
    magA += valA * valA;
    const valB = b.get(term);
    if (valB !== undefined) {
      dot += valA * valB;
    }
  }
  for (const [, valB] of b) {
    magB += valB * valB;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Clustering algorithm ───────────────────────────────────────────────

interface ClusterCandidate {
  centroid: Map<string, number>;
  itemIndices: number[];
}

/**
 * Single-pass clustering: assign each item to the most similar existing
 * cluster (if above threshold), or create a new cluster.
 */
export function clusterDocuments(
  tfidfMatrix: Map<number, Map<string, number>>,
  threshold: number = SIMILARITY_THRESHOLD
): number[][] {
  const clusters: ClusterCandidate[] = [];

  for (const [idx, vec] of tfidfMatrix) {
    let bestCluster = -1;
    let bestSim = 0;

    for (let c = 0; c < clusters.length; c++) {
      const sim = cosineSimilarity(vec, clusters[c].centroid);
      if (sim > bestSim) {
        bestSim = sim;
        bestCluster = c;
      }
    }

    if (bestSim >= threshold && bestCluster >= 0) {
      // Add to existing cluster and update centroid (running average)
      clusters[bestCluster].itemIndices.push(idx);
      updateCentroid(clusters[bestCluster].centroid, vec, clusters[bestCluster].itemIndices.length);
    } else {
      // New cluster
      clusters.push({
        centroid: new Map(vec),
        itemIndices: [idx],
      });
    }
  }

  return clusters.map((c) => c.itemIndices);
}

/** Update centroid with a running average when adding a new vector. */
function updateCentroid(
  centroid: Map<string, number>,
  newVec: Map<string, number>,
  newSize: number
): void {
  // Bring existing values toward average
  for (const [term, val] of centroid) {
    centroid.set(term, val * ((newSize - 1) / newSize));
  }
  // Add new vector's contribution
  for (const [term, val] of newVec) {
    const existing = centroid.get(term) || 0;
    centroid.set(term, existing + val / newSize);
  }
}

// ── Main clustering pipeline ───────────────────────────────────────────

export interface ClusteringResult {
  totalItems: number;
  clustersCreated: number;
  itemsAssigned: number;
}

/**
 * Run clustering on all unclustered news items.
 * Creates TopicCluster records and assigns items.
 */
export async function runClustering(): Promise<ClusteringResult> {
  // 1. Fetch unclustered items
  const items = db
    .select({
      id: newsItems.id,
      title: newsItems.title,
      snippet: newsItems.snippet,
      publishedDate: newsItems.publishedDate,
    })
    .from(newsItems)
    .where(isNull(newsItems.topicClusterId))
    .all();

  if (items.length === 0) {
    console.log("[Clustering] No unclustered items found");
    return { totalItems: 0, clustersCreated: 0, itemsAssigned: 0 };
  }

  console.log(`[Clustering] Processing ${items.length} unclustered items`);

  // 2. Tokenize each item (title + snippet)
  const docs = items.map((item) =>
    tokenize(`${item.title} ${item.snippet || ""}`)
  );

  // 3. Build TF-IDF matrix
  const tfidfMatrix = buildTfIdf(docs);

  // 4. Cluster
  const clusterGroups = clusterDocuments(tfidfMatrix);

  // 5. Persist clusters
  let clustersCreated = 0;
  let itemsAssigned = 0;

  for (const group of clusterGroups) {
    const groupItems = group.map((idx) => items[idx]);
    const label = groupItems[0].title;

    // Use the newest item's date as primaryDate
    const sortedDates = groupItems
      .map((i) => i.publishedDate)
      .sort()
      .reverse();
    const primaryDate = sortedDates[0];

    // Create cluster
    const cluster = db
      .insert(topicClusters)
      .values({ title: label, primaryDate })
      .returning()
      .get();

    // Assign items to cluster
    for (const item of groupItems) {
      db.update(newsItems)
        .set({ topicClusterId: cluster.id })
        .where(eq(newsItems.id, item.id))
        .run();
      itemsAssigned++;
    }

    clustersCreated++;
  }

  console.log(
    `[Clustering] Created ${clustersCreated} clusters, assigned ${itemsAssigned} items`
  );

  return {
    totalItems: items.length,
    clustersCreated,
    itemsAssigned,
  };
}

/**
 * Delete all clusters and unassign all items.
 * Used for manual re-clustering.
 */
export async function resetClusters(): Promise<void> {
  // Unassign all items
  db.update(newsItems).set({ topicClusterId: null }).run();
  // Delete all clusters
  db.delete(topicClusters).run();
  console.log("[Clustering] All clusters reset");
}
