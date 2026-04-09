"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBadge, AnimatedButton } from "@/components/LandingHeroClient";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Billing = "monthly" | "annual";

const PLANS = {
  starter:    { monthly: 29.9,  annualFactor: 0.8, priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER"    },
  pro:        { monthly: 59.9,  annualFactor: 0.8, priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PRO"        },
  enterprise: { monthly: 89.9,  annualFactor: 0.8, priceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE" },
} as const;

type PlanKey = keyof typeof PLANS;

// Price IDs are passed via NEXT_PUBLIC_ env vars so they're available on the client
const PRICE_IDS: Record<PlanKey, string> = {
  starter:    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER    ?? "",
  pro:        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO        ?? "",
  enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "",
};

function formatPrice(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

const FAQ_ITEMS = [
  {
    q: "What counts as one product analysis?",
    a: "Each time you upload a product image, URL, or description and receive a full report counts as one analysis.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade anytime. Changes take effect immediately.",
  },
  {
    q: "What happens after my free analysis?",
    a: "You will be prompted to choose a plan. Your account and existing report stay active.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. We offer a 7-day money-back guarantee on all plans. No questions asked.",
  },
  {
    q: "Is my product data private?",
    a: "Absolutely. Your uploaded products and reports are completely private and never shared.",
  },
] as const;

function FeatureLine({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={`flex gap-2 text-sm ${ok ? "text-[#cccccc]" : "text-[#555555] line-through"}`}>
      <span className={ok ? "text-[#6c47ff]" : "text-[#444444]"}>{ok ? "✓" : "✗"}</span>
      {children}
    </li>
  );
}

function SuccessBanner({ plan }: { plan: string }) {
  return (
    <div className="mx-auto mb-8 max-w-[640px] rounded-2xl border border-[rgba(0,212,170,0.4)] bg-[rgba(0,212,170,0.08)] p-5 text-center">
      <div className="text-2xl mb-2">🎉</div>
      <p className="font-bold text-[#00d4aa] text-lg">You&apos;re now on the {plan.charAt(0).toUpperCase() + plan.slice(1)} plan!</p>
      <p className="mt-1 text-sm text-[#888]">Your account has been upgraded. Head back to the dashboard to continue.</p>
      <a href="/dashboard" className="mt-4 inline-block rounded-xl bg-[#6c47ff] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3ad4]">
        Go to Dashboard →
      </a>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [billing, setBilling]       = useState<Billing>("monthly");
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const [loading, setLoading]       = useState<PlanKey | null>(null);
  const [user, setUser]             = useState<User | null>(null);
  const [error, setError]           = useState("");

  const upgraded  = params.get("upgraded") === "1";
  const upgradedPlan = params.get("plan") ?? "";
  const showAnnual = billing === "annual";

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubscribe(planKey: PlanKey) {
    setError("");

    // Not logged in → go to signup with plan stored in URL so they come back
    if (!user) {
      router.push(`/signup?redirect=/pricing&plan=${planKey}`);
      return;
    }

    const priceId = PRICE_IDS[planKey];
    if (!priceId) {
      setError(`Payment is not yet configured for the ${planKey} plan. Please contact support.`);
      return;
    }

    setLoading(planKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? "";

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
      });

      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Could not start checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = json.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <AnimatedBadge text="💎 Simple Pricing" />
          <h1 className="mt-8 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-tight">
            Invest in winning products.
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-base text-[#888888] sm:text-lg">
            Stop losing money on products that flop. One good product validated pays for years of ProdIQ.
          </p>

          {/* Billing toggle */}
          <div
            className="mt-10 inline-flex rounded-full border border-[#222222] bg-[#111111] p-1"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                billing === "monthly" ? "bg-[#6c47ff] text-white" : "text-[#888888] hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                billing === "annual" ? "bg-[#6c47ff] text-white" : "text-[#888888] hover:text-white"
              }`}
            >
              Annual <span className="opacity-80">(saves 20%)</span>
            </button>
          </div>
        </div>

        {/* Success banner after payment */}
        {upgraded && upgradedPlan && (
          <div className="mt-10">
            <SuccessBanner plan={upgradedPlan} />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mx-auto mt-6 max-w-[540px] rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Plan cards */}
        <div className="mt-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3 lg:items-center">

          {/* ── Starter ────────────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-[#1a1a1a] bg-[#111111] p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#888888]">STARTER</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                ${formatPrice(PLANS.starter.monthly * (showAnnual ? PLANS.starter.annualFactor : 1))}
              </span>
              <span className="text-base text-[#888888]">/month</span>
            </div>
            {showAnnual && <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>}
            <p className="mt-4 text-sm text-[#888888]">Perfect for solo sellers testing new products</p>
            <div className="my-6 h-px bg-[#1a1a1a]" />
            <ul className="flex-1 space-y-3">
              <FeatureLine ok>15 product analyses per day</FeatureLine>
              <FeatureLine ok>Market research &amp; demand score</FeatureLine>
              <FeatureLine ok>Go or No-Go verdict</FeatureLine>
              <FeatureLine ok>Top 3 competitors</FeatureLine>
              <FeatureLine ok>Basic angle suggestions (3 per product)</FeatureLine>
              <FeatureLine ok>Profit calculator</FeatureLine>
              <FeatureLine ok>7-day report history</FeatureLine>
              <FeatureLine ok={false}>Ad scripts</FeatureLine>
              <FeatureLine ok={false}>Competitor ad library</FeatureLine>
              <FeatureLine ok={false}>Viral TikTok extraction</FeatureLine>
              <FeatureLine ok={false}>Private supplier network</FeatureLine>
            </ul>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void handleSubscribe("starter")}
              className="mt-8 flex w-full items-center justify-center rounded-[22px] border border-[#333333] py-3.5 text-[15px] font-semibold text-white transition hover:border-[#6c47ff] hover:text-[#a78bfa] disabled:opacity-60"
            >
              {loading === "starter" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Redirecting…
                </span>
              ) : "Get Starter"}
            </button>
          </div>

          {/* ── Pro ────────────────────────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-2xl border border-[rgba(108,71,255,0.5)] bg-[#111111] p-8 lg:scale-[1.04] lg:py-10"
            style={{ boxShadow: "0 0 40px rgba(108,71,255,0.3)" }}
          >
            <p className="inline-block w-fit rounded-full bg-[#6c47ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              MOST POPULAR
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                ${formatPrice(PLANS.pro.monthly * (showAnnual ? PLANS.pro.annualFactor : 1))}
              </span>
              <span className="text-base text-[#888888]">/month</span>
            </div>
            {showAnnual && <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>}
            <p className="mt-4 text-sm text-[#888888]">For serious sellers who want the full picture</p>
            <div className="my-6 h-px bg-[#2a2a3a]" />
            <ul className="flex-1 space-y-3">
              <FeatureLine ok>30 product analyses per day</FeatureLine>
              <FeatureLine ok>Everything in Starter</FeatureLine>
              <FeatureLine ok>Full angle discovery (unlimited angles)</FeatureLine>
              <FeatureLine ok>Emotional hooks for each angle</FeatureLine>
              <FeatureLine ok>Ready-to-use ad scripts for Meta &amp; TikTok</FeatureLine>
              <FeatureLine ok>Competitor ad library access</FeatureLine>
              <FeatureLine ok>Viral TikTok extraction</FeatureLine>
              <FeatureLine ok>30-day report history</FeatureLine>
              <FeatureLine ok>Priority support</FeatureLine>
              <FeatureLine ok>Access to private supplier network (7-figure verified)</FeatureLine>
              <FeatureLine ok={false}>White label reports</FeatureLine>
              <FeatureLine ok={false}>API access</FeatureLine>
            </ul>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void handleSubscribe("pro")}
                className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#6c47ff] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#5a3ad4] disabled:opacity-60"
                style={{ boxShadow: "0 8px 24px rgba(108,71,255,0.4)" }}
              >
                {loading === "pro" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Redirecting…
                  </>
                ) : "Get Pro →"}
              </button>
            </div>
          </div>

          {/* ── Enterprise ─────────────────────────────────────────────────── */}
          <div className="flex flex-col rounded-2xl border border-[#1a1a1a] bg-[#111111] p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">ENTERPRISE</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                ${formatPrice(PLANS.enterprise.monthly * (showAnnual ? PLANS.enterprise.annualFactor : 1))}
              </span>
              <span className="text-base text-[#888888]">/month</span>
            </div>
            {showAnnual && <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>}
            <p className="mt-4 text-sm text-[#888888]">For agencies and power sellers at scale</p>
            <div className="my-6 h-px bg-[#1a1a1a]" />
            <ul className="flex-1 space-y-3">
              <FeatureLine ok>Unlimited analyses</FeatureLine>
              <FeatureLine ok>Everything in Pro</FeatureLine>
              <FeatureLine ok>Unlimited ad scripts</FeatureLine>
              <FeatureLine ok>White label reports for clients</FeatureLine>
              <FeatureLine ok>API access</FeatureLine>
              <FeatureLine ok>Team seats (up to 5 users)</FeatureLine>
              <FeatureLine ok>Dedicated account manager</FeatureLine>
              <FeatureLine ok>Custom integrations</FeatureLine>
              <FeatureLine ok>90-day report history</FeatureLine>
              <FeatureLine ok>Competitor tracking alerts</FeatureLine>
              <FeatureLine ok>Priority access to private supplier network</FeatureLine>
            </ul>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void handleSubscribe("enterprise")}
              className="mt-8 flex w-full items-center justify-center rounded-[22px] border-2 border-amber-500/60 py-3.5 text-[15px] font-semibold text-white transition hover:border-amber-400 disabled:opacity-60"
            >
              {loading === "enterprise" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  Redirecting…
                </span>
              ) : "Get Enterprise"}
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-[#888888]">
          7-day money-back guarantee on all plans · No credit card required to sign up
        </p>

        {/* FAQ */}
        <section className="mx-auto mt-20 max-w-[720px]">
          <h2 className="text-center text-2xl font-bold text-white">Common questions</h2>
          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="rounded-xl border border-[#1a1a1a] bg-[#111111] p-5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left text-[15px] font-semibold text-white"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                  >
                    {item.q}
                    <span className="shrink-0 text-xl text-[#6c47ff]" aria-hidden>{open ? "−" : "+"}</span>
                  </button>
                  <div
                    className="overflow-hidden transition-[max-height] duration-300 ease-out"
                    style={{ maxHeight: open ? 320 : 0 }}
                  >
                    <p className="pt-3 text-sm leading-relaxed text-[#888888]">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-20 text-center">
          <p className="text-lg font-bold text-white sm:text-xl">Still not sure? Start with 1 free analysis.</p>
          <div className="mt-6 flex justify-center">
            <AnimatedButton href="/signup" text="Start Free" />
          </div>
        </section>
      </div>
    </main>
  );
}
