import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { rssFeeds } from "./rss-feeds";

/**
 * Tracks each feed fetch attempt for monitoring and debugging.
 */
export const fetchLogs = sqliteTable("fetch_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rssFeedId: integer("rss_feed_id").references(() => rssFeeds.id),
  status: text("status", { enum: ["success", "partial", "error"] }).notNull(),
  itemsFetched: integer("items_fetched").notNull().default(0),
  itemsInserted: integer("items_inserted").notNull().default(0),
  duplicatesSkipped: integer("duplicates_skipped").notNull().default(0),
  errorMessages: text("error_messages"), // JSON array of error strings
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at").notNull(),
});

export type FetchLog = typeof fetchLogs.$inferSelect;
export type NewFetchLog = typeof fetchLogs.$inferInsert;
