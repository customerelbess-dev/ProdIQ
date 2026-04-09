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

/**
 * Write plan + Stripe IDs to profiles and reset analysis_count to 0.
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
  console.log(`[webhook][${context}] ── setUserPlan START ──`);
  console.log(`[webhook][${context}]   userId=${userId}`);
  console.log(`[webhook][${context}]   plan=${plan}`);
  console.log(`[webhook][${context}]   customerId=${customerId}`);
  console.log(`[webhook][${context}]   subscriptionId=${subscriptionId}`);
  console.log(`[webhook][${context}]   priceId=${priceId}`);

  const payload = {
    id: userId,
    plan,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    analysis_count: 0,
  };
  console.log(`[webhook][${context}]   upsert payload:`, JSON.stringify(payload));

  const { data, error } = await supa
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error(`[webhook][${context}] ❌ upsert FAILED`);
    console.error(`[webhook][${context}]   code:    ${error.code}`);
    console.error(`[webhook][${context}]   message: ${error.message}`);
    console.error(`[webhook][${context}]   details: ${error.details}`);
    console.error(`[webhook][${context}]   hint:    ${error.hint}`);
    // Re-throw so the outer handler sees the real error and logs it clearly
    throw new Error(`profiles upsert failed for user=${userId}: ${error.message}`);
  }

  console.log(`[webhook][${context}] ✅ upsert SUCCESS`);
  console.log(`[webhook][${context}]   returned row:`, JSON.stringify(data));

  // Confirm by reading the row back
  const { data: verify, error: verifyErr } = await supa
    .from("profiles")
    .select("id, plan, analysis_count, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (verifyErr) {
    console.warn(`[webhook][${context}]   verify read failed: ${verifyErr.message}`);
  } else {
    console.log(`[webhook][${context}]   verified row in DB:`, JSON.stringify(verify));
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
