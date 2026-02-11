CREATE TABLE `fetch_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rss_feed_id` integer,
	`status` text NOT NULL,
	`items_fetched` integer DEFAULT 0 NOT NULL,
	`items_inserted` integer DEFAULT 0 NOT NULL,
	`duplicates_skipped` integer DEFAULT 0 NOT NULL,
	`error_messages` text,
	`started_at` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`rss_feed_id`) REFERENCES `rss_feeds`(`id`) ON UPDATE no action ON DELETE no action
);
