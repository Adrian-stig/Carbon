CREATE TABLE `emission_factors` (
	`code` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`label` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`geography` text NOT NULL,
	`source` text NOT NULL,
	`version` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`city` text DEFAULT '上海' NOT NULL,
	`household_size` integer DEFAULT 1 NOT NULL,
	`billing_days` integer DEFAULT 30 NOT NULL,
	`electricity_kwh` real DEFAULT 0 NOT NULL,
	`gas_m3` real DEFAULT 0 NOT NULL,
	`water_m3` real DEFAULT 0 NOT NULL,
	`reminder_enabled` integer DEFAULT true NOT NULL,
	`onboarded` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`responses_json` text NOT NULL,
	`category_totals_json` text NOT NULL,
	`factor_version` text DEFAULT 'SH-2026.1' NOT NULL,
	`total_kg` real NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_submissions_user_week` ON `submissions` (`user_id`,`week_start`);