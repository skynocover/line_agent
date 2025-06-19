PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_calendar_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`all_day` integer DEFAULT false,
	`color` text,
	`label` text,
	`location` text,
	`completed` integer DEFAULT false,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_calendar_events`("id", "title", "description", "start", "end", "all_day", "color", "label", "location", "completed", "user_id", "created_at") SELECT "id", "title", "description", "start", "end", "all_day", "color", "label", "location", "completed", "user_id", "created_at" FROM `calendar_events`;--> statement-breakpoint
DROP TABLE `calendar_events`;--> statement-breakpoint
ALTER TABLE `__new_calendar_events` RENAME TO `calendar_events`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `user_events_idx` ON `calendar_events` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_id` text NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`mime_type` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
INSERT INTO `__new_files`("id", "file_id", "user_id", "file_name", "file_size", "mime_type", "created_at") SELECT "id", "file_id", "user_id", "file_name", "file_size", "mime_type", "created_at" FROM `files`;--> statement-breakpoint
DROP TABLE `files`;--> statement-breakpoint
ALTER TABLE `__new_files` RENAME TO `files`;--> statement-breakpoint
CREATE UNIQUE INDEX `files_file_id_unique` ON `files` (`file_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `files` (`user_id`);