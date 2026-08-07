import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  city: text("city").notNull().default("上海"),
  householdSize: integer("household_size").notNull().default(1),
  billingDays: integer("billing_days").notNull().default(30),
  electricityKwh: real("electricity_kwh").notNull().default(0),
  gasM3: real("gas_m3").notNull().default(0),
  waterM3: real("water_m3").notNull().default(0),
  reminderEnabled: integer("reminder_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  onboarded: integer("onboarded", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const submissions = sqliteTable(
  "submissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    weekStart: text("week_start").notNull(),
    responsesJson: text("responses_json").notNull(),
    categoryTotalsJson: text("category_totals_json").notNull(),
    factorVersion: text("factor_version").notNull().default("SH-2026.1"),
    totalKg: real("total_kg").notNull(),
    submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_submissions_user_week").on(
      table.userId,
      table.weekStart,
    ),
  ],
);

export const emissionFactors = sqliteTable("emission_factors", {
  code: text("code").primaryKey(),
  category: text("category").notNull(),
  label: text("label").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  geography: text("geography").notNull(),
  source: text("source").notNull(),
  version: text("version").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
