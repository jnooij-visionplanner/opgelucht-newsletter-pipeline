CREATE INDEX `idx_rss_feeds_is_active` ON `rss_feeds` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_news_items_topic_cluster_id` ON `news_items` (`topic_cluster_id`);--> statement-breakpoint
CREATE INDEX `idx_news_items_is_paywalled` ON `news_items` (`is_paywalled`);--> statement-breakpoint
CREATE INDEX `idx_topic_clusters_primary_date` ON `topic_clusters` (`primary_date`);--> statement-breakpoint
CREATE INDEX `idx_generated_articles_created_at` ON `generated_articles` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_generated_articles_topic_cluster_id` ON `generated_articles` (`topic_cluster_id`);--> statement-breakpoint
CREATE INDEX `idx_generated_articles_category_id` ON `generated_articles` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_generated_articles_push_status` ON `generated_articles` (`joomla_push_status`);--> statement-breakpoint
CREATE INDEX `idx_fetch_logs_rss_feed_id` ON `fetch_logs` (`rss_feed_id`);