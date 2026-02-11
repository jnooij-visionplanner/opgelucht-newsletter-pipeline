ALTER TABLE `categories` ADD `external_id` integer;--> statement-breakpoint
ALTER TABLE `categories` ADD `display_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `updated_at` text NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_categories_is_active` ON `categories` (`is_active`);