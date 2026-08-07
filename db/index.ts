import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getD1() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (!schemaReady) {
    const d1 = getD1();
    schemaReady = d1
      .batch([
        d1.prepare(`CREATE TABLE IF NOT EXISTS profiles (
          user_id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          display_name TEXT NOT NULL,
          city TEXT NOT NULL DEFAULT '上海',
          household_size INTEGER NOT NULL DEFAULT 1,
          billing_days INTEGER NOT NULL DEFAULT 30,
          electricity_kwh REAL NOT NULL DEFAULT 0,
          gas_m3 REAL NOT NULL DEFAULT 0,
          water_m3 REAL NOT NULL DEFAULT 0,
          reminder_enabled INTEGER NOT NULL DEFAULT 1,
          onboarded INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`),
        d1.prepare(`CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          week_start TEXT NOT NULL,
          responses_json TEXT NOT NULL,
          category_totals_json TEXT NOT NULL,
          factor_version TEXT NOT NULL DEFAULT 'SH-2026.1',
          total_kg REAL NOT NULL,
          submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`),
        d1.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_week
          ON submissions(user_id, week_start)`),
        d1.prepare(`CREATE TABLE IF NOT EXISTS emission_factors (
          code TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          label TEXT NOT NULL,
          value REAL NOT NULL,
          unit TEXT NOT NULL,
          geography TEXT NOT NULL,
          source TEXT NOT NULL,
          version TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`),
      ])
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}
