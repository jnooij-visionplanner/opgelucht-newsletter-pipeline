CREATE TABLE `rss_feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`search_term_label` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `news_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rss_feed_id` integer NOT NULL,
	`guid` text,
	`title` text NOT NULL,
	`source_name` text,
	`original_url` text NOT NULL,
	`archive_url` text,
	`published_date` text NOT NULL,
	`snippet` text,
	`full_content` text,
	`is_paywalled` integer DEFAULT false NOT NULL,
	`paywall_resolved` integer DEFAULT false NOT NULL,
	`is_selected` integer DEFAULT false NOT NULL,
	`topic_cluster_id` integer,
	`crawled_at` text NOT NULL,
	FOREIGN KEY (`rss_feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_cluster_id`) REFERENCES `topic_clusters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_news_items_original_url` ON `news_items` (`original_url`);--> statement-breakpoint
CREATE INDEX `idx_news_items_guid` ON `news_items` (`guid`);--> statement-breakpoint
CREATE INDEX `idx_news_items_rss_feed_id` ON `news_items` (`rss_feed_id`);--> statement-breakpoint
CREATE INDEX `idx_news_items_published_date` ON `news_items` (`published_date`);--> statement-breakpoint
CREATE TABLE `topic_clusters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`primary_date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`details` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `generated_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_cluster_id` integer,
	`category_id` integer,
	`classification` text,
	`title` text NOT NULL,
	`introduction` text NOT NULL,
	`narrative_summary` text NOT NULL,
	`source_list_html` text NOT NULL,
	`joomla_push_status` text DEFAULT 'pending' NOT NULL,
	`joomla_pushed_at` text,
	`prompt_version_id` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`topic_cluster_id`) REFERENCES `topic_clusters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`prompt_version_id`) REFERENCES `system_prompts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `system_prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
