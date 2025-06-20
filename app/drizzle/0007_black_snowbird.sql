CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text NOT NULL,
	`user_id` text NOT NULL,
	`content` text NOT NULL,
	`event_id` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_message_id_unique` ON `messages` (`message_id`);--> statement-breakpoint
CREATE INDEX `user_messages_idx` ON `messages` (`user_id`);--> statement-breakpoint
CREATE INDEX `event_message_idx` ON `messages` (`event_id`);