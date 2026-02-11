import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { rssFeeds } from "./schema/rss-feeds";
import { newsItems, topicClusters } from "./schema/news-items";
import { categories } from "./schema/categories";
import { systemPrompts, generatedArticles } from "./schema/generated-articles";

const dbPath = process.env.DATABASE_URL || ".db/opgelucht.db";

mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log("Seeding database...");

// Seed default categories (Dutch)
const defaultCategories = [
  { name: "Overheid", description: "Government policy and regulation" },
  { name: "Politiek", description: "Political developments and debate" },
  { name: "Wetenschap", description: "Scientific research and findings" },
  { name: "Onderwijs", description: "Education-related news" },
  { name: "Kort nieuws", description: "Short news items" },
  { name: "Opinie", description: "Opinion pieces and editorials" },
  { name: "Rookgordijn", description: "Smoke screen / industry tactics" },
  { name: "Vereniging", description: "Association news" },
  { name: "Persberichten", description: "Press releases" },
];

for (const cat of defaultCategories) {
  db.insert(categories)
    .values(cat)
    .onConflictDoNothing({ target: categories.name })
    .run();
}
console.log(`  Seeded ${defaultCategories.length} categories`);

// Seed default system prompt
const defaultPrompt = {
  name: "Article Generation",
  content: `Je bent een redactie-assistent voor Rookvrije Generatie NL. Genereer een artikel op basis van de aangeleverde bronnen.

Genereer:
1. **Bronnenlijst** — HTML <ul> lijst, gesorteerd op datum (nieuwste eerst), elke regel toont "Bron — Titel" als klikbare link (target="_blank")
2. **Titel** — maximaal 36 tekens, bondige samenvatting van het hoofdonderwerp
3. **Introductie** — maximaal 175 tekens, korte samenvatting of inleiding
4. **Samenvattend verhaal** — gedetailleerde, vloeiende HTML-samenvatting van alle bronnen

Schrijf in het Nederlands. Gebruik een zakelijke maar toegankelijke toon.`,
  version: 1,
  isActive: true,
};

db.insert(systemPrompts)
  .values(defaultPrompt)
  .onConflictDoNothing()
  .run();
console.log("  Seeded default system prompt");

// Seed example RSS feeds (Google Alerts)
const exampleFeeds = [
  { url: "https://www.google.com/alerts/feeds/example/roken", searchTermLabel: "roken" },
  { url: "https://www.google.com/alerts/feeds/example/roker", searchTermLabel: "roker" },
  { url: "https://www.google.com/alerts/feeds/example/rookvrij", searchTermLabel: "rookvrij" },
  { url: "https://www.google.com/alerts/feeds/example/rookverbod", searchTermLabel: "rookverbod" },
  { url: "https://www.google.com/alerts/feeds/example/tabak", searchTermLabel: "tabak" },
  { url: "https://www.google.com/alerts/feeds/example/nicotine", searchTermLabel: "nicotine" },
  { url: "https://www.google.com/alerts/feeds/example/sigaret", searchTermLabel: "sigaret" },
  { url: "https://www.google.com/alerts/feeds/example/shag", searchTermLabel: "shag" },
  { url: "https://www.google.com/alerts/feeds/example/sigaar", searchTermLabel: "sigaar" },
  { url: "https://www.google.com/alerts/feeds/example/waterpijp", searchTermLabel: "waterpijp" },
  { url: "https://www.google.com/alerts/feeds/example/shisha", searchTermLabel: "shisha" },
  { url: "https://www.google.com/alerts/feeds/example/vape", searchTermLabel: "vape" },
  { url: "https://www.google.com/alerts/feeds/example/e-sigaret", searchTermLabel: "e-sigaret" },
  { url: "https://www.google.com/alerts/feeds/example/vapen", searchTermLabel: "vapen" },
  { url: "https://www.google.com/alerts/feeds/example/e-liquid", searchTermLabel: "e-liquid" },
  { url: "https://www.google.com/alerts/feeds/example/snus", searchTermLabel: "snus" },
];

for (const feed of exampleFeeds) {
  db.insert(rssFeeds)
    .values(feed)
    .onConflictDoNothing()
    .run();
}
console.log(`  Seeded ${exampleFeeds.length} example RSS feeds`);

// ── Seed sample news items & clusters for development ───────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Create topic clusters
const sampleClusters = [
  { title: "Kabinet kondigt nieuw rookverbod aan voor terrassen horeca", primaryDate: daysAgo(0) },
  { title: "Onderzoek: vapen onder jongeren stijgt met 40 procent", primaryDate: daysAgo(0) },
  { title: "EU overweegt verbod op smaakjes in e-sigaretten", primaryDate: daysAgo(1) },
  { title: "Tabaksindustrie verliest rechtszaak over plain packaging", primaryDate: daysAgo(1) },
  { title: "GGD start campagne tegen waterpijpgebruik", primaryDate: daysAgo(2) },
  { title: "Nieuw onderzoek naar passief roken bij kinderen", primaryDate: daysAgo(3) },
  { title: "Accijnsverhoging tabak per 1 april aangekondigd", primaryDate: daysAgo(3) },
  { title: "WHO rapport: wereldwijd minder rokers maar meer vapers", primaryDate: daysAgo(4) },
];

const clusterIds: number[] = [];
for (const c of sampleClusters) {
  const result = db.insert(topicClusters).values(c).returning().get();
  clusterIds.push(result.id);
}
console.log(`  Seeded ${sampleClusters.length} topic clusters`);

// We need at least one feed ID for the news items
const firstFeed = db.select().from(rssFeeds).limit(1).get();
const feedId = firstFeed?.id || 1;

// Sample news items distributed across clusters
const sampleItems = [
  // Cluster 1: Rookverbod terrassen (4 items)
  { title: "Kabinet wil rookverbod op alle horecaterrassen", sourceName: "NOS", originalUrl: "https://nos.nl/artikel/rookverbod-terrassen", isPaywalled: false, topicClusterId: clusterIds[0], publishedDate: daysAgo(0) },
  { title: "Rookverbod terrassen: dit zijn de nieuwe regels", sourceName: "RTL Nieuws", originalUrl: "https://rtlnieuws.nl/rookverbod-terrassen", isPaywalled: false, topicClusterId: clusterIds[0], publishedDate: daysAgo(0) },
  { title: "Horeca reageert verdeeld op nieuw rookverbod", sourceName: "de Volkskrant", originalUrl: "https://volkskrant.nl/horeca-rookverbod", isPaywalled: true, archiveUrl: "https://archive.ph/example1", paywallResolved: true, topicClusterId: clusterIds[0], publishedDate: daysAgo(0) },
  { title: "Rookverbod terrassen gaat in per 1 juli", sourceName: "AD", originalUrl: "https://ad.nl/rookverbod-terrassen", isPaywalled: false, topicClusterId: clusterIds[0], publishedDate: daysAgo(0) },

  // Cluster 2: Vapen jongeren (3 items)
  { title: "Alarmerende stijging vapegebruik onder tieners", sourceName: "Trimbos Instituut", originalUrl: "https://trimbos.nl/vapen-jongeren", isPaywalled: false, topicClusterId: clusterIds[1], publishedDate: daysAgo(0) },
  { title: "Onderzoek: 1 op 5 scholieren heeft gevapet", sourceName: "NRC", originalUrl: "https://nrc.nl/vapen-scholieren", isPaywalled: true, archiveUrl: "https://archive.ph/example2", paywallResolved: true, topicClusterId: clusterIds[1], publishedDate: daysAgo(0) },
  { title: "Vapen populairder dan roken bij Nederlandse jongeren", sourceName: "NU.nl", originalUrl: "https://nu.nl/vapen-jongeren", isPaywalled: false, topicClusterId: clusterIds[1], publishedDate: daysAgo(0) },

  // Cluster 3: EU smaakjes verbod (2 items, one paywalled unresolved)
  { title: "Brussel overweegt verbod op fruitsmaakjes e-sigaret", sourceName: "FD", originalUrl: "https://fd.nl/eu-smaakjes-verbod", isPaywalled: true, paywallResolved: false, topicClusterId: clusterIds[2], publishedDate: daysAgo(1) },
  { title: "EU Commission considers flavored e-cigarette ban", sourceName: "Reuters", originalUrl: "https://reuters.com/eu-ecig-ban", isPaywalled: false, topicClusterId: clusterIds[2], publishedDate: daysAgo(1) },

  // Cluster 4: Plain packaging rechtszaak (5 items)
  { title: "Tabaksfabrikanten verliezen zaak over neutrale verpakkingen", sourceName: "NOS", originalUrl: "https://nos.nl/plain-packaging", isPaywalled: false, topicClusterId: clusterIds[3], publishedDate: daysAgo(1) },
  { title: "Uitspraak: neutrale sigarettenverpakking mag", sourceName: "de Volkskrant", originalUrl: "https://volkskrant.nl/plain-packaging", isPaywalled: true, archiveUrl: "https://archive.ph/example3", paywallResolved: true, topicClusterId: clusterIds[3], publishedDate: daysAgo(1) },
  { title: "Rechter wijst klacht tabaksindustrie af", sourceName: "Trouw", originalUrl: "https://trouw.nl/plain-packaging", isPaywalled: true, archiveUrl: "https://archive.ph/example4", paywallResolved: true, topicClusterId: clusterIds[3], publishedDate: daysAgo(1) },
  { title: "Plain packaging: overwinning voor volksgezondheid", sourceName: "RTL Nieuws", originalUrl: "https://rtlnieuws.nl/plain-packaging", isPaywalled: false, topicClusterId: clusterIds[3], publishedDate: daysAgo(1) },
  { title: "Tabakslobby verliest rechtszaak neutrale verpakkingen", sourceName: "ANP", originalUrl: "https://anp.nl/plain-packaging", isPaywalled: false, topicClusterId: clusterIds[3], publishedDate: daysAgo(1) },

  // Cluster 5: GGD waterpijp (2 items)
  { title: "GGD waarschuwt voor gevaren waterpijp", sourceName: "GGD GHOR", originalUrl: "https://ggdghor.nl/waterpijp", isPaywalled: false, topicClusterId: clusterIds[4], publishedDate: daysAgo(2) },
  { title: "Campagne moet jongeren bewust maken van waterpijprisicos", sourceName: "Tubantia", originalUrl: "https://tubantia.nl/waterpijp-campagne", isPaywalled: false, topicClusterId: clusterIds[4], publishedDate: daysAgo(2) },

  // Cluster 6: Passief roken kinderen (3 items)
  { title: "Passief roken: meer kinderen met luchtwegklachten", sourceName: "RIVM", originalUrl: "https://rivm.nl/passief-roken", isPaywalled: false, topicClusterId: clusterIds[5], publishedDate: daysAgo(3) },
  { title: "Artsen bezorgd over passief roken in huis", sourceName: "Medisch Contact", originalUrl: "https://medischcontact.nl/passief-roken", isPaywalled: false, topicClusterId: clusterIds[5], publishedDate: daysAgo(3) },
  { title: "Rookvrije generatie: kinderen nog steeds blootgesteld", sourceName: "NOS", originalUrl: "https://nos.nl/passief-roken-kinderen", isPaywalled: false, topicClusterId: clusterIds[5], publishedDate: daysAgo(3) },

  // Cluster 7: Accijnsverhoging (2 items)
  { title: "Pakje sigaretten wordt 2 euro duurder in april", sourceName: "NOS", originalUrl: "https://nos.nl/accijns-tabak", isPaywalled: false, topicClusterId: clusterIds[6], publishedDate: daysAgo(3) },
  { title: "Accijnsverhoging tabak: effect op rookgedrag onderzocht", sourceName: "Trimbos Instituut", originalUrl: "https://trimbos.nl/accijns-roken", isPaywalled: false, topicClusterId: clusterIds[6], publishedDate: daysAgo(3) },

  // Cluster 8: WHO rapport (2 items)
  { title: "WHO: aantal rokers wereldwijd daalt, maar vapers stijgt", sourceName: "WHO", originalUrl: "https://who.int/tobacco-report-2026", isPaywalled: false, topicClusterId: clusterIds[7], publishedDate: daysAgo(4) },
  { title: "Wereldgezondheidsorganisatie waarschuwt voor vapetrend", sourceName: "NOS", originalUrl: "https://nos.nl/who-vapen-rapport", isPaywalled: false, topicClusterId: clusterIds[7], publishedDate: daysAgo(4) },

  // Unclustered items (3 loose items)
  { title: "Sigarettenautomaten verdwijnen uit horeca", sourceName: "AD", originalUrl: "https://ad.nl/sigarettenautomaten", isPaywalled: false, topicClusterId: null, publishedDate: daysAgo(1) },
  { title: "Rookruimtes definitief verboden in 2027", sourceName: "Rijksoverheid", originalUrl: "https://rijksoverheid.nl/rookruimtes", isPaywalled: false, topicClusterId: null, publishedDate: daysAgo(2) },
  { title: "Philip Morris investeert in rookvrije producten", sourceName: "FD", originalUrl: "https://fd.nl/philip-morris", isPaywalled: true, paywallResolved: false, topicClusterId: null, publishedDate: daysAgo(5) },
];

for (const item of sampleItems) {
  db.insert(newsItems)
    .values({
      rssFeedId: feedId,
      title: item.title,
      sourceName: item.sourceName,
      originalUrl: item.originalUrl,
      archiveUrl: (item as Record<string, unknown>).archiveUrl as string || null,
      publishedDate: item.publishedDate,
      snippet: `Samenvatting van: ${item.title}`,
      isPaywalled: item.isPaywalled,
      paywallResolved: (item as Record<string, unknown>).paywallResolved as boolean || false,
      topicClusterId: item.topicClusterId,
    })
    .onConflictDoNothing()
    .run();
}
console.log(`  Seeded ${sampleItems.length} news items`);

// Seed a sample generated article
const firstCat = db.select().from(categories).limit(1).get();
const firstPrompt = db.select().from(systemPrompts).limit(1).get();

db.insert(generatedArticles)
  .values({
    topicClusterId: clusterIds[0],
    categoryId: firstCat?.id || null,
    classification: "binnenland",
    title: "Rookverbod terrassen per 1 juli",
    introduction: "Het kabinet kondigt een algeheel rookverbod aan op alle horecaterrassen, ingaand per 1 juli dit jaar.",
    narrativeSummary: `<p>Het kabinet heeft besloten om per 1 juli een algeheel rookverbod in te voeren op alle horecaterrassen in Nederland. De maatregel is onderdeel van het bredere Nationaal Preventieakkoord.</p>
<p>Horecaondernemers reageren verdeeld. Brancheorganisatie KHN noemt de maatregel "begrijpelijk maar ingrijpend" en vraagt om een overgangsperiode. Tegenstanders vrezen omzetverlies.</p>
<p>Staatssecretaris Van Ooijen benadrukt dat de volksgezondheid prevaleert en wijst op het succes van eerdere rookverboden in binnenruimtes. "We zien in landen als Ierland en Australië dat terrasbezoekers niet wegblijven," aldus de bewindspersoon.</p>`,
    sourceListHtml: `<ul>
  <li><a href="https://nos.nl/artikel/rookverbod-terrassen" target="_blank">Kabinet wil rookverbod op alle horecaterrassen - NOS</a></li>
  <li><a href="https://rtlnieuws.nl/rookverbod-terrassen" target="_blank">Rookverbod terrassen: dit zijn de nieuwe regels - RTL Nieuws</a></li>
  <li><a href="https://volkskrant.nl/horeca-rookverbod" target="_blank">Horeca reageert verdeeld op nieuw rookverbod - de Volkskrant</a></li>
  <li><a href="https://ad.nl/rookverbod-terrassen" target="_blank">Rookverbod terrassen gaat in per 1 juli - AD</a></li>
</ul>`,
    promptVersionId: firstPrompt?.id || null,
    joomlaPushStatus: "pending",
  })
  .run();
console.log("  Seeded 1 sample generated article");

console.log("Seeding complete.");
sqlite.close();
