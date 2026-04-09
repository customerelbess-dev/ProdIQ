import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { buildPriceToPlan } from "@/lib/stripe";

// Disable Next.js body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2025-03-31.basil" });
}

function getServiceSupabase() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !role || url.includes("placeholder")) {
    throw new Error("Supabase service role not configured");
  }
  return createClient(url, role, { auth: { persistSession: false } });
}

/**
 * Resolve Supabase user_id from event metadata.
 * Falls back to looking up via stripe_customer_id stored in profiles.
 */
async function resolveUserId(
  supa: ReturnType<typeof getServiceSupabase>,
  customerId: string,
  metadata: Stripe.Metadata,
): Promise<string | null> {
  // Try metadata first (fastest)
  const fromMeta = String(metadata.user_id ?? "").trim();
  if (fromMeta) return fromMeta;

  // Fall back to looking up by stripe_customer_id
  const { data } = await supa
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function setUserPlan(
  supa: ReturnType<typeof getServiceSupabase>,
  userId: string,
  plan: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
) {
  const { error } = await supa.from("profiles").upsert(
    {
      id: userId,
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
    },
    { onConflict: "id" },
  );
  if (error) console.error("[webhook] upsert error:", error.message);
  else console.log(`[webhook] set plan=${plan} for user=${userId}`);
}

async function handleCheckoutCompleted(
  supa: ReturnType<typeof getServiceSupabase>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const customerId = String(session.customer ?? "");
  const subscriptionId = String(session.subscription ?? "");
  const meta = session.metadata ?? {};

  const userId = await resolveUserId(supa, customerId, meta);
  if (!userId) {
    console.error("[webhook] checkout.session.completed: could not resolve user_id");
    return;
  }

  // Determine plan from metadata or by fetching subscription price
  let plan = String(meta.plan ?? "").trim();
  let priceId = "";

  if (!plan && subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    priceId = sub.items.data[0]?.price.id ?? "";
    plan = buildPriceToPlan()[priceId] ?? "starter";
  }

  await setUserPlan(supa, userId, plan || "starter", customerId, subscriptionId, priceId);
}

async function handleSubscriptionUpdated(
  supa: ReturnType<typeof getServiceSupabase>,
  subscription: Stripe.Subscription,
) {
  const customerId = String(subscription.customer ?? "");
  const subscriptionId = subscription.id;
  const meta = subscription.metadata ?? {};

  const userId = await resolveUserId(supa, customerId, meta);
  if (!userId) {
    console.error("[webhook] subscription.updated: could not resolve user_id for customer", customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? "";
  const plan = buildPriceToPlan()[priceId] ?? "starter";
  const status = subscription.status;

  // Only keep paid plan if subscription is active or trialing
  const activePlan = ["active", "trialing"].includes(status) ? plan : "free";
  await setUserPlan(supa, userId, activePlan, customerId, subscriptionId, priceId);
}

async function handleSubscriptionDeleted(
  supa: ReturnType<typeof getServiceSupabase>,
  subscription: Stripe.Subscription,
) {
  const customerId = String(subscription.customer ?? "");
  const meta = subscription.metadata ?? {};

  const userId = await resolveUserId(supa, customerId, meta);
  if (!userId) return;

  const { error } = await supa
    .from("profiles")
    .update({ plan: "free", stripe_subscription_id: null, stripe_price_id: null })
    .eq("id", userId);
  if (error) console.error("[webhook] downgrade error:", error.message);
  else console.log(`[webhook] downgraded user=${userId} to free`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[webhook] signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  console.log(`[webhook] received: ${event.type}`);

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

      case "invoice.payment_failed": {
        // Optionally handle failed payments — for now just log
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("[webhook] payment_failed for customer:", invoice.customer);
        break;
      }

      default:
        // Acknowledge unhandled events without error
        break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Handler error";
    console.error("[webhook] handler error:", msg);
    // Return 200 so Stripe doesn't retry — log the error for manual investigation
    return NextResponse.json({ error: msg, received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
