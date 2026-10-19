CREATE TABLE `translation_requests` (
	`exercise_id` integer PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `exercises` ADD `name_en` text;--> statement-breakpoint
ALTER TABLE `exercises` ADD `instructions_language` text DEFAULT 'fr' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `is_essential` integer DEFAULT false NOT NULL;