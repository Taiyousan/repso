CREATE TABLE `body_weights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`measured_at` integer NOT NULL,
	`weight` real NOT NULL
);
--> statement-breakpoint
CREATE INDEX `body_weights_measured_at_idx` ON `body_weights` (`measured_at`);