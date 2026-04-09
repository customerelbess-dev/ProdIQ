/**
 * Admin endpoint: manually set a user's plan in Supabase.
 *
 * Protected by ADMIN_SECRET env var — never expose or call from client code.
 *
 * Usage:
 *   POST /api/admin/fix-plan
 *   Authorization: Bearer <ADMIN_SECRET>
 *   { "user_id": "...", "plan": "starter" | "pro" | "agency" | "free" }
 *
 * Also accepts GET for quick browser check:
 *   GET /api/admin/fix-plan?secret=<ADMIN_SECRET>&user_id=...&plan=starter
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PLAN_LIMITS: Record<string, number | null> = {
  free:     1,
  starter:  15,
  pro:      30,
  agency:   null,   // unlimited
  enterprise: null,
};

function getServiceSupabase() {
  const url  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
  const role = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !role || url.includes("placeholder")) return null;
  return createClient(url, role, { auth: { persistSession: false } });
}

async function runFix(userId: string, plan: string) {
  const supa = getServiceSupabase();
  if (!supa) {
    return {
      ok: false,
      error: "Supabase service role not configured — check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars",
    };
  }

  const limit = PLAN_LIMITS[plan] ?? 1;
  console.log(`[fix-plan] upserting user=${userId} plan=${plan} analysis_count=0`);

  const { data, error } = await supa
    .from("profiles")
    .upsert(
      {
        id: userId,
        plan,
        analysis_count: 0,
        // Keep analysis_limit column in sync if it exists (soft migration safety)
        ...(limit !== null ? { analysis_limit: limit } : {}),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    console.error("[fix-plan] upsert error:", error.message, error.details, error.hint);
    return { ok: false, error: error.message, details: error.details, hint: error.hint };
  }

  console.log("[fix-plan] ✅ success:", data);

  // Read back the row to confirm
  const { data: verify } = await supa
    .from("profiles")
    .select("id, plan, analysis_count")
    .eq("id", userId)
    .single();

  return { ok: true, written: data, verified: verify };
}

export async function POST(req: NextRequest) {
  const adminSecret = (process.env.ADMIN_SECRET ?? "").trim();
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim() ?? "";

  if (!adminSecret || token !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { user_id?: string; plan?: string };
  const userId = String(body.user_id ?? "").trim();
  const plan   = String(body.plan   ?? "free").trim().toLowerCase();

  if (!userId) return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  if (!(plan in PLAN_LIMITS)) return NextResponse.json({ error: `plan must be one of: ${Object.keys(PLAN_LIMITS).join(", ")}` }, { status: 400 });

  const result = await runFix(userId, plan);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const adminSecret = (process.env.ADMIN_SECRET ?? "").trim();
  const secret  = searchParams.get("secret") ?? "";
  const userId  = (searchParams.get("user_id") ?? "").trim();
  const plan    = (searchParams.get("plan") ?? "free").trim().toLowerCase();

  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized — pass ?secret=<ADMIN_SECRET>" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({
      usage: "GET /api/admin/fix-plan?secret=<ADMIN_SECRET>&user_id=<UUID>&plan=starter",
      plans: Object.keys(PLAN_LIMITS),
    });
  }

  if (!(plan in PLAN_LIMITS)) {
    return NextResponse.json({ error: `plan must be one of: ${Object.keys(PLAN_LIMITS).join(", ")}` }, { status: 400 });
  }

  const result = await runFix(userId, plan);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
