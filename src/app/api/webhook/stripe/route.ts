import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { buildPriceToPlan } from "@/lib/stripe";

// Next.js must NOT parse the body — Stripe needs the raw bytes for signature verification
export const runtime = "nodejs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function getServiceSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !role || url.includes("placeholder")) {
    throw new Error("Supabase service role is not configured (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required)");
  }
  return createClient(url, role, { auth: { persistSession: false } });
}

/**
 * Resolve a Supabase user_id from webhook event data.
 * Strategy (in order):
 *   1. session.metadata.user_id
 *   2. subscription.metadata.user_id
 *   3. Look up profiles by stripe_customer_id
 */
async function resolveUserId(
  supa: ReturnType<typeof getServiceSupabase>,
  customerId: string,
  metadata: Stripe.Metadata,
  context: string,
): Promise<string | null> {
  const fromMeta = String(metadata?.user_id ?? "").trim();
  if (fromMeta) {
    console.log(`[webhook][${context}] user_id from metadata: ${fromMeta}`);
    return fromMeta;
  }

  console.log(`[webhook][${context}] no user_id in metadata, looking up by stripe_customer_id=${customerId}`);
  const { data, error } = await supa
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) console.error(`[webhook][${context}] profiles lookup error:`, error.message);
  if (data?.id) console.log(`[webhook][${context}] found user_id via customer lookup: ${data.id}`);
  else console.warn(`[webhook][${context}] could NOT resolve user_id for customer=${customerId}`);

  return data?.id ?? null;
}

/**
 * Determine the plan name from a Stripe price ID.
 * Uses env-var mapping first; falls back to a human-readable guess.
 */
function resolvePlanFromPriceId(priceId: string, context: string): string {
  const priceToPlan = buildPriceToPlan();
  console.log(`[webhook][${context}] price→plan map:`, JSON.stringify(priceToPlan));
  console.log(`[webhook][${context}] incoming priceId: ${priceId}`);

  if (priceToPlan[priceId]) {
    console.log(`[webhook][${context}] matched plan: ${priceToPlan[priceId]}`);
    return priceToPlan[priceId];
  }

  // Could not map — log a clear error and default to starter so the user at least gets something
  console.error(
    `[webhook][${context}] UNRECOGNISED price ID: ${priceId}. ` +
    `Check STRIPE_PRICE_STARTER / STRIPE_PRICE_PRO / STRIPE_PRICE_AGENCY env vars. ` +
    `Defaulting to "starter".`,
  );
  return "starter";
}

/** Map a plan name to the correct analysis_limit value (null = unlimited). */
function analysisLimitForPlan(plan: string): number | null {
  const limits: Record<string, number | null> = {
    free:       1,
    starter:    15,
    pro:        30,
    agency:     null, // unlimited
    enterprise: null, // legacy alias
  };
  return plan in limits ? limits[plan] : 1; // unknown plan defaults to free
}

/**
 * Write plan + analysis_limit to profiles using the service-role admin client.
 *
 * Strategy:
 *  1. UPDATE profiles SET plan=X, analysis_count=0, analysis_limit=Y WHERE id=Z
 *  2. If 0 rows affected → user has no profile row yet → INSERT it
 *  3. Separately update Stripe IDs (best-effort)
 *  4. Read the row back and log it for Vercel log confirmation
 */
async function setUserPlan(
  supa: ReturnType<typeof getServiceSupabase>,
  userId: string,
  plan: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
  context: string,
) {
  const analysisLimit = analysisLimitForPlan(plan);

  console.log(`[webhook][${context}] ── setUserPlan START ──`);
  console.log(`[webhook][${context}]   userId         = ${userId}`);
  console.log(`[webhook][${context}]   plan           = ${plan}`);
  console.log(`[webhook][${context}]   analysis_limit = ${analysisLimit ?? "unlimited"}`);
  console.log(`[webhook][${context}]   customer       = ${customerId}`);
  console.log(`[webhook][${context}]   sub            = ${subscriptionId}`);
  console.log(`[webhook][${context}]   priceId        = ${priceId}`);

  // ── STEP 1: UPDATE plan + analysis_count + analysis_limit atomically ─────────
  //   Service-role client bypasses RLS so this always works regardless of policies.
  //   Requires the migration (20260406000000_ensure_analysis_count.sql) to be run.
  console.log(
    `[webhook][${context}]   STEP 1: UPDATE profiles SET ` +
    `plan='${plan}', analysis_count=0, analysis_limit=${analysisLimit ?? "NULL"} ` +
    `WHERE id='${userId}'`,
  );

  const { error: updateErr, count: updatedRows } = await supa
    .from("profiles")
    .update({ plan, analysis_count: 0, analysis_limit: analysisLimit })
    .eq("id", userId)
    .select("id");

  if (updateErr) {
    console.error(`[webhook][${context}]   ❌ UPDATE failed: ${updateErr.message} (code=${updateErr.code})`);
    console.error(`[webhook][${context}]   details: ${updateErr.details}`);
    console.error(`[webhook][${context}]   hint:    ${updateErr.hint}`);
    console.error(`[webhook][${context}]   ⚠ Did you run supabase/migrations/20260406000000_ensure_analysis_count.sql?`);
    throw new Error(`UPDATE profiles failed for user=${userId}: ${updateErr.message}`);
  }

  const rowsAffected = updatedRows ?? 0;
  console.log(`[webhook][${context}]   UPDATE rowsAffected=${rowsAffected}`);

  // ── STEP 2: If 0 rows updated → no profile row exists yet → INSERT one ───────
  if (rowsAffected === 0) {
    console.log(`[webhook][${context}]   STEP 2: profile row not found — inserting new row`);
    const { error: insertErr } = await supa
      .from("profiles")
      .insert({ id: userId, plan, analysis_count: 0, analysis_limit: analysisLimit });

    if (insertErr) {
      console.error(`[webhook][${context}]   ❌ INSERT failed: ${insertErr.message} (code=${insertErr.code})`);
      throw new Error(`INSERT profiles failed for user=${userId}: ${insertErr.message}`);
    }
    console.log(`[webhook][${context}]   INSERT success — new profile row created with plan=${plan}, analysis_limit=${analysisLimit ?? "null"}`);
  } else {
    console.log(`[webhook][${context}]   STEP 2: skipped (row updated in step 1)`);
  }

  // ── STEP 3: Update Stripe IDs (best-effort, separate query) ──────────────────
  if (customerId || subscriptionId || priceId) {
    console.log(`[webhook][${context}]   STEP 3: writing Stripe IDs`);
    const stripeFields: Record<string, string | null> = {};
    if (customerId)     stripeFields.stripe_customer_id     = customerId;
    if (subscriptionId) stripeFields.stripe_subscription_id = subscriptionId;
    if (priceId)        stripeFields.stripe_price_id        = priceId;

    const { error: stripeErr } = await supa
      .from("profiles")
      .update(stripeFields)
      .eq("id", userId);

    if (stripeErr) console.warn(`[webhook][${context}]   Stripe IDs write failed: ${stripeErr.message}`);
    else console.log(`[webhook][${context}]   Stripe IDs written`);
  }

  // ── STEP 4: Read back and verify ─────────────────────────────────────────────
  console.log(`[webhook][${context}]   STEP 4: reading row back to verify…`);
  const { data: verify, error: verifyErr } = await supa
    .from("profiles")
    .select("id, plan, analysis_count, analysis_limit, stripe_customer_id, stripe_price_id")
    .eq("id", userId)
    .maybeSingle();

  if (verifyErr) {
    console.warn(`[webhook][${context}]   verify read failed: ${verifyErr.message}`);
  } else if (!verify) {
    console.error(`[webhook][${context}]   ❌ VERIFY: row still NOT found after write!`);
  } else {
    console.log(`[webhook][${context}]   ✅ VERIFY row in DB:`, JSON.stringify(verify));
    if (verify.plan !== plan) {
      console.error(`[webhook][${context}]   ❌ plan mismatch! DB has "${verify.plan}" but expected "${plan}"`);
    } else {
      console.log(`[webhook][${context}]   ✅ plan confirmed as "${verify.plan}"`);
    }
  }
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  supa: ReturnType<typeof getServiceSupabase>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const ctx = "checkout.session.completed";
  console.log(`[webhook][${ctx}] session.id=${session.id}`);
  console.log(`[webhook][${ctx}] session.customer=${session.customer}`);
  console.log(`[webhook][${ctx}] session.subscription=${session.subscription}`);
  console.log(`[webhook][${ctx}] session.metadata=`, JSON.stringify(session.metadata));
  console.log(`[webhook][${ctx}] session.payment_status=${session.payment_status}`);

  const customerId    = String(session.customer ?? "").trim();
  const subscriptionId = String(session.subscription ?? "").trim();
  const meta          = session.metadata ?? {};

  if (!customerId) {
    console.error(`[webhook][${ctx}] no customer ID — cannot proceed`);
    return;
  }

  const userId = await resolveUserId(supa, customerId, meta, ctx);
  if (!userId) {
    console.error(`[webhook][${ctx}] could not resolve user_id — plan NOT updated`);
    return;
  }

  // ── Determine plan ──────────────────────────────────────────────────────────
  // Priority: metadata.plan → subscription price ID → session line_items price ID
  let plan    = String(meta.plan ?? "").trim();
  let priceId = String(meta.price_id ?? "").trim();

  console.log(`[webhook][${ctx}] plan from metadata: "${plan}", priceId from metadata: "${priceId}"`);

  if (!priceId && subscriptionId) {
    console.log(`[webhook][${ctx}] fetching subscription to get price ID…`);
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      priceId = sub.items.data[0]?.price.id ?? "";
      console.log(`[webhook][${ctx}] priceId from subscription: ${priceId}`);
    } catch (err) {
      console.error(`[webhook][${ctx}] failed to retrieve subscription:`, err);
    }
  }

  // If still no priceId, try expanding line_items on the session
  if (!priceId) {
    console.log(`[webhook][${ctx}] trying to get priceId from session line_items…`);
    try {
      const expanded = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      });
      priceId = expanded.line_items?.data[0]?.price?.id ?? "";
      console.log(`[webhook][${ctx}] priceId from line_items: ${priceId}`);
    } catch (err) {
      console.error(`[webhook][${ctx}] failed to expand line_items:`, err);
    }
  }

  // Resolve plan name from price ID if not already in metadata
  if (!plan && priceId) {
    plan = resolvePlanFromPriceId(priceId, ctx);
  }

  if (!plan) {
    console.error(`[webhook][${ctx}] could NOT determine plan — defaulting to "starter"`);
    plan = "starter";
  }

  await setUserPlan(supa, userId, plan, customerId, subscriptionId, priceId, ctx);
}

async function handleSubscriptionUpdated(
  supa: ReturnType<typeof getServiceSupabase>,
  subscription: Stripe.Subscription,
) {
  const ctx = "customer.subscription.updated";
  console.log(`[webhook][${ctx}] subscription.id=${subscription.id} status=${subscription.status}`);

  const customerId     = String(subscription.customer ?? "").trim();
  const subscriptionId = subscription.id;
  const meta           = subscription.metadata ?? {};

  const userId = await resolveUserId(supa, customerId, meta, ctx);
  if (!userId) {
    console.error(`[webhook][${ctx}] could not resolve user_id — skipping`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? "";
  console.log(`[webhook][${ctx}] priceId=${priceId} status=${subscription.status}`);

  const mappedPlan = priceId ? resolvePlanFromPriceId(priceId, ctx) : "free";
  const activePlan = ["active", "trialing"].includes(subscription.status) ? mappedPlan : "free";

  console.log(`[webhook][${ctx}] resolved plan=${activePlan} for user=${userId}`);
  await setUserPlan(supa, userId, activePlan, customerId, subscriptionId, priceId, ctx);
}

async function handleSubscriptionDeleted(
  supa: ReturnType<typeof getServiceSupabase>,
  subscription: Stripe.Subscription,
) {
  const ctx = "customer.subscription.deleted";
  console.log(`[webhook][${ctx}] subscription.id=${subscription.id}`);

  const customerId = String(subscription.customer ?? "").trim();
  const meta       = subscription.metadata ?? {};

  const userId = await resolveUserId(supa, customerId, meta, ctx);
  if (!userId) {
    console.error(`[webhook][${ctx}] could not resolve user_id — skipping`);
    return;
  }

  const { error } = await supa
    .from("profiles")
    .update({ plan: "free", stripe_subscription_id: null, stripe_price_id: null })
    .eq("id", userId);

  if (error) console.error(`[webhook][${ctx}] downgrade error:`, error.message);
  else console.log(`[webhook][${ctx}] ✅ downgraded user=${userId} to free`);
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  // Log env var presence (not values) so we can debug without exposing secrets
  console.log("[webhook] env check:", {
    STRIPE_SECRET_KEY:      !!process.env.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET:  !!process.env.STRIPE_WEBHOOK_SECRET?.trim(),
    SUPABASE_SERVICE_ROLE:  !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    SUPABASE_URL:           !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    STRIPE_PRICE_STARTER:   !!process.env.STRIPE_PRICE_STARTER?.trim(),
    STRIPE_PRICE_PRO:       !!process.env.STRIPE_PRICE_PRO?.trim(),
    STRIPE_PRICE_AGENCY:    !!process.env.STRIPE_PRICE_AGENCY?.trim(),
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set — cannot verify events");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // ── Verify Stripe signature ──────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log(`[webhook] ✅ signature verified — event.type=${event.type} event.id=${event.id}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[webhook] ❌ signature error:", msg);
    console.error("[webhook] sig header present:", !!sig);
    console.error("[webhook] body length:", body.length);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── Handle event ─────────────────────────────────────────────────────────────
  try {
    const stripe = getStripe();
    const supa   = getServiceSupabase();

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supa, stripe, event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supa, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supa, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[webhook] invoice.payment_succeeded for customer=${invoice.customer} amount=${invoice.amount_paid}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[webhook] ⚠️ invoice.payment_failed for customer=${invoice.customer}`);
        break;
      }

      default:
        console.log(`[webhook] unhandled event type: ${event.type} — acknowledged`);
        break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Handler error";
    console.error("[webhook] ❌ handler threw:", msg);
    // Always return 200 so Stripe doesn't retry — the error is logged for investigation
    return NextResponse.json({ error: msg, received: true }, { status: 200 });
  }

  console.log(`[webhook] ✅ event processed: ${event.type}`);
  return NextResponse.json({ received: true });
}
