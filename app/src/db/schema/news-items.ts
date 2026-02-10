import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { rssFeeds } from "./rss-feeds";

export const newsItems = sqliteTable(
  "news_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rssFeedId: integer("rss_feed_id")
      .notNull()
      .references(() => rssFeeds.id),
    guid: text("guid"),
    title: text("title").notNull(),
    sourceName: text("source_name"),
    originalUrl: text("original_url").notNull(),
    archiveUrl: text("archive_url"),
    publishedDate: text("published_date").notNull(),
    snippet: text("snippet"),
    fullContent: text("full_content"),
    isPaywalled: integer("is_paywalled", { mode: "boolean" })
      .notNull()
      .default(false),
    paywallResolved: integer("paywall_resolved", { mode: "boolean" })
      .notNull()
      .default(false),
    isSelected: integer("is_selected", { mode: "boolean" })
      .notNull()
      .default(false),
    topicClusterId: integer("topic_cluster_id").references(
      () => topicClusters.id
    ),
    crawledAt: text("crawled_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_news_items_original_url").on(table.originalUrl),
    index("idx_news_items_guid").on(table.guid),
    index("idx_news_items_rss_feed_id").on(table.rssFeedId),
    index("idx_news_items_published_date").on(table.publishedDate),
  ]
);

export const topicClusters = sqliteTable("topic_clusters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  primaryDate: text("primary_date").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type NewsItem = typeof newsItems.$inferSelect;
export type NewNewsItem = typeof newsItems.$inferInsert;
export type TopicCluster = typeof topicClusters.$inferSelect;
export type NewTopicCluster = typeof topicClusters.$inferInsert;
