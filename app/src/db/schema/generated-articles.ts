import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { topicClusters } from "./news-items";
import { categories } from "./categories";

export const generatedArticles = sqliteTable(
  "generated_articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    topicClusterId: integer("topic_cluster_id").references(
      () => topicClusters.id
    ),
    categoryId: integer("category_id").references(() => categories.id),
    classification: text("classification", {
      enum: ["binnenland", "buitenland"],
    }),
    title: text("title").notNull(),
    introduction: text("introduction").notNull(),
    narrativeSummary: text("narrative_summary").notNull(),
    sourceListHtml: text("source_list_html").notNull(),
    joomlaPushStatus: text("joomla_push_status", {
      enum: ["pending", "pushed", "failed"],
    })
      .notNull()
      .default("pending"),
    joomlaPushedAt: text("joomla_pushed_at"),
    promptVersionId: integer("prompt_version_id").references(
      () => systemPrompts.id
    ),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [
    index("idx_generated_articles_created_at").on(table.createdAt),
    index("idx_generated_articles_topic_cluster_id").on(table.topicClusterId),
    index("idx_generated_articles_category_id").on(table.categoryId),
    index("idx_generated_articles_push_status").on(table.joomlaPushStatus),
  ]
);

export const systemPrompts = sqliteTable("system_prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  comment: text("comment"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type GeneratedArticle = typeof generatedArticles.$inferSelect;
export type NewGeneratedArticle = typeof generatedArticles.$inferInsert;
export type SystemPrompt = typeof systemPrompts.$inferSelect;
export type NewSystemPrompt = typeof systemPrompts.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
