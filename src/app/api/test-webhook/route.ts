/**
 * /api/test-webhook
 *
 * Simulates a Stripe checkout.session.completed webhook event locally
 * without requiring a real payment or Stripe signature.
 *
 * Protected by ADMIN_SECRET — never call from client code.
 *
 * Usage (GET — easiest for quick browser tests):
 *   https://your-app.vercel.app/api/test-webhook
 *     ?secret=<ADMIN_SECRET>
 *     &user_id=a21cd9b4-4b40-4903-89b0-4874570b19f6
 *     &plan=starter
 *
 * Usage (POST):
 *   POST /api/test-webhook
 *   Authorization: Bearer <ADMIN_SECRET>
 *   { "user_id": "...", "plan": "starter" }
 *
 * Response: JSON object with a "logs" array containing every step's result
 * so you can see exactly what happened in Supabase without checking Vercel logs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLevel = "info" | "success" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  step: string;
  message: string;
  data?: unknown;
}

const VALID_PLANS = ["free", "starter", "pro", "agency", "enterprise"] as const;
type Plan = (typeof VALID_PLANS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function analysisLimitForPlan(plan: string): number | null {
  const map: Record<string, number | null> = {
    free:       1,
    starter:    15,
    pro:        30,
    agency:     null,
    enterprise: null,
  };
  return plan in map ? map[plan] : 1;
}

function getServiceSupabase() {
  const url  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
  const role = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !role || url.includes("placeholder")) return null;
  return createClient(url, role, { auth: { persistSession: false } });
}

// ─── Core simulation ──────────────────────────────────────────────────────────

async function simulateWebhook(userId: string, plan: Plan) {
  const logs: LogEntry[] = [];

  const log = (level: LogLevel, step: string, message: string, data?: unknown) => {
    logs.push({ level, step, message, data });
  };

  // ── Environment check ─────────────────────────────────────────────────────
  const supabaseUrl  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
  const serviceKey   = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  log("info", "env", "Checking environment variables", {
    NEXT_PUBLIC_SUPABASE_URL:  supabaseUrl ? `${supabaseUrl.slice(0, 30)}…` : "❌ MISSING",
    SUPABASE_SERVICE_ROLE_KEY: serviceKey  ? `${serviceKey.slice(0, 10)}…`  : "❌ MISSING",
  });

  if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
    log("error", "env", "NEXT_PUBLIC_SUPABASE_URL is missing or is a placeholder");
    return { ok: false, logs };
  }
  if (!serviceKey) {
    log("error", "env", "SUPABASE_SERVICE_ROLE_KEY is missing — Supabase writes will be blocked by RLS without it");
    return { ok: false, logs };
  }

  const supa = getServiceSupabase()!;
  const analysisLimit = analysisLimitForPlan(plan);

  log("info", "init", `Simulating checkout.session.completed`, {
    user_id:        userId,
    plan,
    analysis_limit: analysisLimit ?? "unlimited (null)",
  });

  // ── STEP 0: Read the profile BEFORE any changes ───────────────────────────
  log("info", "step0", "Reading current profile row BEFORE update");
  const { data: before, error: beforeErr } = await supa
    .from("profiles")
    .select("id, plan, analysis_count, analysis_limit, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (beforeErr) {
    log("warn", "step0", `Could not read profile: ${beforeErr.message}`, { code: beforeErr.code });
  } else if (!before) {
    log("info", "step0", "No profile row found yet — will be created in step 2");
  } else {
    log("info", "step0", "Current profile row in DB", before);
  }

  // ── STEP 1: UPDATE plan + analysis_count + analysis_limit ─────────────────
  log("info", "step1",
    `UPDATE profiles SET plan='${plan}', analysis_count=0, analysis_limit=${analysisLimit ?? "NULL"} WHERE id='${userId}'`
  );

  const { error: updateErr, count: updatedRows } = await supa
    .from("profiles")
    .update({ plan, analysis_count: 0, analysis_limit: analysisLimit })
    .eq("id", userId)
    .select("id", { count: "exact", head: true });

  if (updateErr) {
    log("error", "step1", `UPDATE failed: ${updateErr.message}`, {
      code:    updateErr.code,
      details: updateErr.details,
      hint:    updateErr.hint,
      advice:  "Did you run supabase/migrations/20260406000000_ensure_analysis_count.sql?",
    });
    return { ok: false, logs };
  }

  const rowsAffected = updatedRows ?? 0;
  log(
    rowsAffected > 0 ? "success" : "info",
    "step1",
    `UPDATE complete — rowsAffected=${rowsAffected}`,
    { rowsAffected },
  );

  // ── STEP 2: INSERT if no existing row ─────────────────────────────────────
  if (rowsAffected === 0) {
    log("info", "step2", "No existing row → inserting new profile");

    const { error: insertErr } = await supa
      .from("profiles")
      .insert({ id: userId, plan, analysis_count: 0, analysis_limit: analysisLimit });

    if (insertErr) {
      log("error", "step2", `INSERT failed: ${insertErr.message}`, {
        code:    insertErr.code,
        details: insertErr.details,
        hint:    insertErr.hint,
      });
      return { ok: false, logs };
    }
    log("success", "step2", `INSERT success — new profile created with plan=${plan}, analysis_limit=${analysisLimit ?? "null"}`);
  } else {
    log("info", "step2", "Skipped (row already updated in step 1)");
  }

  // ── STEP 3: Read back and verify ──────────────────────────────────────────
  log("info", "step3", "Reading profile row back to verify");

  const { data: after, error: afterErr } = await supa
    .from("profiles")
    .select("id, plan, analysis_count, analysis_limit, stripe_customer_id, stripe_price_id")
    .eq("id", userId)
    .maybeSingle();

  if (afterErr) {
    log("warn", "step3", `Read-back failed: ${afterErr.message}`, { code: afterErr.code });
  } else if (!after) {
    log("error", "step3", "Row NOT found after write — this should never happen");
    return { ok: false, logs };
  } else {
    log("info", "step3", "Row in DB after update", after);

    if (after.plan !== plan) {
      log("error", "step3",
        `plan MISMATCH — DB has "${after.plan}" but we wrote "${plan}". ` +
        `This means the UPDATE/INSERT silently failed or was overwritten.`
      );
      return { ok: false, logs };
    }
    if (after.analysis_limit !== analysisLimit) {
      log("warn", "step3",
        `analysis_limit mismatch — DB has ${after.analysis_limit} but expected ${analysisLimit}. ` +
        `The column may not exist yet — run the migration SQL.`
      );
    }
    log("success", "step3",
      `✅ plan="${after.plan}", analysis_count=${after.analysis_count}, analysis_limit=${after.analysis_limit ?? "null"}`
    );
  }

  // ── STEP 4: Simulate what resolveUsage would return for this user ─────────
  log("info", "step4", "Simulating what /api/analyze usage check would see now");

  const { data: usageProfile } = await supa
    .from("profiles")
    .select("plan, analysis_count, analysis_limit")
    .eq("id", userId)
    .maybeSingle();

  const livePlan         = String(usageProfile?.plan ?? "free");
  const liveLimit: number | null =
    usageProfile?.analysis_limit == null ? null : Number(usageProfile.analysis_limit);
  const liveCount        = Number(usageProfile?.analysis_count ?? 0);
  const isUnlimited      = liveLimit === null || ["agency", "enterprise"].includes(livePlan);
  const period           = livePlan === "free" ? "total" : "daily";

  log(
    isUnlimited || liveCount < (liveLimit ?? Infinity) ? "success" : "warn",
    "step4",
    isUnlimited
      ? `User is on ${livePlan} (unlimited) — no block`
      : liveCount >= (liveLimit ?? 0)
      ? `⚠ User would be BLOCKED — used=${liveCount} >= limit=${liveLimit} (${period})`
      : `User can run analyses — used=${liveCount} of ${liveLimit} (${period})`,
    { livePlan, liveCount, liveLimit, period, isUnlimited },
  );

  return { ok: true, logs };
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest, secret: string | null): boolean {
  const adminSecret = (process.env.ADMIN_SECRET ?? "").trim();
  if (!adminSecret) return false; // no secret configured = always deny
  const bearer = req.headers.get("Authorization")?.replace("Bearer ", "").trim() ?? "";
  return bearer === adminSecret || secret === adminSecret;
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret  = searchParams.get("secret");
  const userId  = (searchParams.get("user_id") ?? "").trim();
  const plan    = (searchParams.get("plan") ?? "starter").trim().toLowerCase();

  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized — pass ?secret=<ADMIN_SECRET>" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({
      usage: "GET /api/test-webhook?secret=<ADMIN_SECRET>&user_id=<UUID>&plan=starter",
      valid_plans: VALID_PLANS,
    });
  }

  if (!VALID_PLANS.includes(plan as Plan)) {
    return NextResponse.json(
      { error: `plan must be one of: ${VALID_PLANS.join(", ")}` },
      { status: 400 },
    );
  }

  const result = await simulateWebhook(userId, plan as Plan);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const secret = req.headers.get("Authorization")?.replace("Bearer ", "").trim() ?? null;

  if (!isAuthorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { user_id?: string; plan?: string };
  const userId = String(body.user_id ?? "").trim();
  const plan   = String(body.plan ?? "starter").trim().toLowerCase();

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }
  if (!VALID_PLANS.includes(plan as Plan)) {
    return NextResponse.json(
      { error: `plan must be one of: ${VALID_PLANS.join(", ")}` },
      { status: 400 },
    );
  }

  const result = await simulateWebhook(userId, plan as Plan);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
