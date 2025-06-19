ALTER TABLE `calendar_events` ADD `message_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_events_message_id_unique` ON `calendar_events` (`message_id`);