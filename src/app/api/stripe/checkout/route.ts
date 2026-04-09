import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getPriceId, PLAN_NAMES, type PlanKey } from "@/lib/stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function getServiceSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !role || url.includes("placeholder")) return null;
  return createClient(url, role, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { planKey?: string };
    const planKey = String(body.planKey ?? "").trim().toLowerCase() as PlanKey;

    // ── Validate plan key ─────────────────────────────────────────────────────
    if (!planKey || !(planKey in PLAN_NAMES)) {
      console.error("[stripe/checkout] Invalid or missing planKey:", planKey);
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${Object.keys(PLAN_NAMES).join(", ")}` },
        { status: 400 },
      );
    }

    // ── Resolve price ID from server-side env var ─────────────────────────────
    let priceId: string;
    try {
      priceId = getPriceId(planKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Price ID lookup failed";
      console.error("[stripe/checkout] Price ID error:", msg);
      return NextResponse.json({ error: msg }, { status: 503 });
    }

    const planName = PLAN_NAMES[planKey];
    console.log(`[stripe/checkout] plan=${planKey} priceId=${priceId} planName=${planName}`);

    // ── Stripe client ─────────────────────────────────────────────────────────
    const stripe = getStripe();
    if (!stripe) {
      console.error("[stripe/checkout] STRIPE_SECRET_KEY is not set");
      return NextResponse.json({ error: "Stripe is not configured on the server" }, { status: 503 });
    }

    // ── Identify the logged-in user ───────────────────────────────────────────
    const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
    let userId = "";
    let userEmail = "";
    let existingCustomerId = "";

    if (token) {
      const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
      const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
      if (supabaseUrl && supabaseAnon && !supabaseUrl.includes("placeholder")) {
        try {
          const userClient = createClient(supabaseUrl, supabaseAnon, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false },
          });
          const { data: { user } } = await userClient.auth.getUser();
          if (user) {
            userId    = user.id;
            userEmail = user.email ?? "";
            const { data: profile } = await userClient
              .from("profiles")
              .select("stripe_customer_id")
              .eq("id", user.id)
              .maybeSingle();
            existingCustomerId = String(profile?.stripe_customer_id ?? "").trim();
            console.log(`[stripe/checkout] user=${userId} existingCustomer=${existingCustomerId || "none"}`);
          }
        } catch (err) {
          console.warn("[stripe/checkout] Could not identify user:", err);
        }
      }
    }

    // ── Create or reuse Stripe customer ──────────────────────────────────────
    let customerId = existingCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        ...(userEmail ? { email: userEmail } : {}),
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      console.log(`[stripe/checkout] created new Stripe customer=${customerId}`);

      if (userId) {
        const supa = getServiceSupabase();
        if (supa) {
          await supa
            .from("profiles")
            .upsert({ id: userId, stripe_customer_id: customerId }, { onConflict: "id" });
        }
      }
    }

    // ── App origin for redirect URLs ──────────────────────────────────────────
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://prodiq.app";

    console.log(`[stripe/checkout] creating session origin=${origin} plan=${planName} price=${priceId}`);

    // ── Create Checkout Session ───────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?upgraded=1&plan=${planName}`,
      cancel_url:  `${origin}/pricing?cancelled=1`,
      metadata: { user_id: userId, plan: planName },
      subscription_data: {
        metadata: { user_id: userId, plan: planName },
      },
    });

    console.log(`[stripe/checkout] session created id=${session.id} url=${session.url?.slice(0, 60)}…`);
    return NextResponse.json({ url: session.url });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Checkout error";
    console.error("[stripe/checkout] Unhandled error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
