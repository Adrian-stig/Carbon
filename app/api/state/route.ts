import { asc, eq, sql } from "drizzle-orm";
import { getAnonymousIdentity } from "../../anonymous-identity";
import { getDb } from "../../../db";
import { profiles, submissions } from "../../../db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CategoryTotals = Record<
  "clothing" | "food" | "home" | "travel" | "shopping" | "waste",
  number
>;

function weekStart(offset = 0) {
  const date = new Date();
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1 + offset * 7);
  return date.toISOString().slice(0, 10);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const identity = await getAnonymousIdentity();

  try {
    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, identity.userId))
      .limit(1);
    const rows = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, identity.userId))
      .orderBy(asc(submissions.weekStart));

    const currentWeek = weekStart();
    const allThisWeek = await db
      .select({
        totalKg: submissions.totalKg,
        categories: submissions.categoryTotalsJson,
      })
      .from(submissions)
      .where(eq(submissions.weekStart, currentWeek));

    const categorySum: CategoryTotals = {
      clothing: 0,
      food: 0,
      home: 0,
      travel: 0,
      shopping: 0,
      waste: 0,
    };
    let enterpriseTotal = 0;
    for (const row of allThisWeek) {
      enterpriseTotal += row.totalKg;
      const categories = parseJson<CategoryTotals>(row.categories, categorySum);
      for (const key of Object.keys(categorySum) as (keyof CategoryTotals)[]) {
        categorySum[key] += Number(categories[key] || 0);
      }
    }

    const enterprise = {
      teamSize: 200,
      submitted: allThisWeek.length,
      totalKg: enterpriseTotal,
      averageKg: allThisWeek.length ? enterpriseTotal / allThisWeek.length : 0,
      categories: categorySum,
    };

    return Response.json({
      identity,
      profile: profile ?? null,
      submissions: rows.map((row) => ({
        ...row,
        responses: parseJson(row.responsesJson, {}),
        categories: parseJson<CategoryTotals>(row.categoryTotalsJson, categorySum),
      })),
      currentWeek,
      enterprise,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "数据读取失败";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const identity = await getAnonymousIdentity();

  try {
    const payload = (await request.json()) as {
      action?: "save-profile" | "save-submission";
      profile?: {
        email?: string;
        displayName?: string;
        city?: string;
        householdSize?: number;
        billingDays?: number;
        electricityKwh?: number;
        gasM3?: number;
        waterM3?: number;
        reminderEnabled?: boolean;
      };
      submission?: {
        weekStart?: string;
        responses?: Record<string, number>;
        categories?: CategoryTotals;
        totalKg?: number;
      };
    };
    const db = getDb();

    if (payload.action === "save-profile" && payload.profile) {
      const p = payload.profile;
      const values = {
        userId: identity.userId,
        email: p.email?.trim() || identity.email,
        displayName: p.displayName?.trim() || identity.displayName,
        city: p.city?.trim() || "上海",
        householdSize: Math.max(1, Math.round(Number(p.householdSize) || 1)),
        billingDays: Math.max(1, Math.round(Number(p.billingDays) || 30)),
        electricityKwh: Math.max(0, Number(p.electricityKwh) || 0),
        gasM3: Math.max(0, Number(p.gasM3) || 0),
        waterM3: Math.max(0, Number(p.waterM3) || 0),
        reminderEnabled: p.reminderEnabled !== false,
        onboarded: true,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      };
      await db
        .insert(profiles)
        .values(values)
        .onConflictDoUpdate({ target: profiles.userId, set: values });
      return Response.json({ ok: true });
    }

    if (payload.action === "save-submission" && payload.submission) {
      const submission = payload.submission;
      if (!submission.weekStart || !submission.categories) {
        return Response.json({ error: "打卡数据不完整" }, { status: 400 });
      }
      const values = {
        userId: identity.userId,
        weekStart: submission.weekStart,
        responsesJson: JSON.stringify(submission.responses ?? {}),
        categoryTotalsJson: JSON.stringify(submission.categories),
        factorVersion: "SH-2026.1",
        totalKg: Math.max(0, Number(submission.totalKg) || 0),
        submittedAt: sql`CURRENT_TIMESTAMP`,
      };
      await db
        .insert(submissions)
        .values(values)
        .onConflictDoUpdate({
          target: [submissions.userId, submissions.weekStart],
          set: values,
        });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存失败";
    return Response.json({ error: message }, { status: 500 });
  }
}
