import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { rssFeeds } from "./schema/rss-feeds";
import { categories } from "./schema/categories";
import { systemPrompts } from "./schema/generated-articles";

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

console.log("Seeding complete.");
sqlite.close();
