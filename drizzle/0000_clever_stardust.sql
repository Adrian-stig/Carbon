CREATE TABLE "emission_factors" (
	"code" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"value" double precision NOT NULL,
	"unit" text NOT NULL,
	"geography" text NOT NULL,
	"source" text NOT NULL,
	"version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"city" text DEFAULT '上海' NOT NULL,
	"household_size" integer DEFAULT 1 NOT NULL,
	"billing_days" integer DEFAULT 30 NOT NULL,
	"electricity_kwh" double precision DEFAULT 0 NOT NULL,
	"gas_m3" double precision DEFAULT 0 NOT NULL,
	"water_m3" double precision DEFAULT 0 NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start" text NOT NULL,
	"responses_json" text NOT NULL,
	"category_totals_json" text NOT NULL,
	"factor_version" text DEFAULT 'SH-2026.1' NOT NULL,
	"total_kg" double precision NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_submissions_user_week" ON "submissions" USING btree ("user_id","week_start");