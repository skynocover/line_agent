CREATE TABLE `calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`all_day` integer DEFAULT false,
	`color` text,
	`label` text,
	`location` text,
	`completed` integer DEFAULT false,
	`user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `user_events_idx` ON `calendar_events` (`user_id`);