import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const rssFeeds = sqliteTable("rss_feeds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  searchTermLabel: text("search_term_label").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type RssFeed = typeof rssFeeds.$inferSelect;
export type NewRssFeed = typeof rssFeeds.$inferInsert;
