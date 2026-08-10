import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  city: text("city").notNull().default("上海"),
  householdSize: integer("household_size").notNull().default(1),
  billingDays: integer("billing_days").notNull().default(30),
  electricityKwh: doublePrecision("electricity_kwh").notNull().default(0),
  gasM3: doublePrecision("gas_m3").notNull().default(0),
  waterM3: doublePrecision("water_m3").notNull().default(0),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    weekStart: text("week_start").notNull(),
    responsesJson: text("responses_json").notNull(),
    categoryTotalsJson: text("category_totals_json").notNull(),
    factorVersion: text("factor_version").notNull().default("SH-2026.1"),
    totalKg: doublePrecision("total_kg").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_submissions_user_week").on(
      table.userId,
      table.weekStart,
    ),
  ],
);

export const emissionFactors = pgTable("emission_factors", {
  code: text("code").primaryKey(),
  category: text("category").notNull(),
  label: text("label").notNull(),
  value: doublePrecision("value").notNull(),
  unit: text("unit").notNull(),
  geography: text("geography").notNull(),
  source: text("source").notNull(),
  version: text("version").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
