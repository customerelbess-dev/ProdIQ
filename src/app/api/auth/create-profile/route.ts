import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Fallback profile-row creator.
 *
 * Why this exists:
 *   The DB trigger `handle_new_user` is SUPPOSED to create the profile row when
 *   a user signs up. But if the migration hasn't been applied yet, or the trigger
 *   silently fails, the profile is missing — and the user can't log in or use
 *   the app properly.
 *
 *   This route is called from /signup right after `supabase.auth.signUp` succeeds
 *   and acts as a safety net. It uses the SERVICE_ROLE_KEY to bypass RLS so it
 *   works even when the user has not yet confirmed their email (no session).
 *
 * Body: { user_id: string, email: string, full_name?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      user_id?: string;
      email?: string;
      full_name?: string;
    };

    const userId    = String(body.user_id ?? "").trim();
    const email     = String(body.email ?? "").trim();
    const fullName  = String(body.full_name ?? "").trim();

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
    const serviceKey  = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

    if (!supabaseUrl || !serviceKey) {
      console.error("[create-profile] missing SUPABASE env vars");
      return NextResponse.json(
        { error: "Supabase service role key is not configured on the server" },
        { status: 500 },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify the user actually exists in auth.users (so this endpoint can't be
    // abused to create profile rows for arbitrary UUIDs).
    const { data: userResult, error: userErr } = await admin.auth.admin.getUserById(userId);
    if (userErr || !userResult?.user) {
      console.error("[create-profile] user not found:", userId, userErr?.message);
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }

    const authUser = userResult.user;
    const finalEmail = email || authUser.email || "";
    const finalName  =
      fullName ||
      String((authUser.user_metadata as Record<string, unknown> | null)?.full_name ?? "") ||
      String((authUser.user_metadata as Record<string, unknown> | null)?.name ?? "") ||
      "";

    // Upsert — does nothing if row already exists with the same id, otherwise creates it.
    // We always set plan = 'free' / analysis_count = 0 / analysis_limit = 1 on create.
    const { data: existing } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      // Profile already exists — only fill in missing email / full_name.
      const patch: Record<string, string> = {};
      if (!existing.email && finalEmail) patch.email = finalEmail;
      if (!existing.full_name && finalName) patch.full_name = finalName;

      if (Object.keys(patch).length > 0) {
        const { error: updErr } = await admin
          .from("profiles")
          .update(patch)
          .eq("id", userId);
        if (updErr) console.error("[create-profile] patch error:", updErr.message);
      }
      return NextResponse.json({ ok: true, created: false });
    }

    // Row doesn't exist — create it
    const { error: insErr } = await admin.from("profiles").insert({
      id:             userId,
      email:          finalEmail,
      full_name:      finalName,
      plan:           "free",
      analysis_count: 0,
      analysis_limit: 1,
    });

    if (insErr) {
      console.error("[create-profile] insert error:", insErr.message, insErr.details);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    console.log(`[create-profile] created profile for user=${userId}`);
    return NextResponse.json({ ok: true, created: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-profile] exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
