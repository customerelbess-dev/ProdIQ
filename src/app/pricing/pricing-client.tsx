"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBadge, AnimatedButton } from "@/components/LandingHeroClient";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────
type Billing = "monthly" | "annual";
type PlanKey = "starter" | "pro" | "agency";

// ─── Static plan data (fully hardcoded — zero build-time fetching) ────────────
const PLANS: Record<
  PlanKey,
  { label: string; monthlyPrice: number; annualFactor: number; tagline: string; accent: string; popular?: true }
> = {
  starter: {
    label: "Starter",
    monthlyPrice: 29.9,
    annualFactor: 0.8,
    tagline: "Perfect for solo sellers testing new products",
    accent: "#888888",
  },
  pro: {
    label: "Pro",
    monthlyPrice: 59.9,
    annualFactor: 0.8,
    tagline: "For serious sellers who want the full picture",
    accent: "#6c47ff",
    popular: true,
  },
  agency: {
    label: "Agency",
    monthlyPrice: 89.9,
    annualFactor: 0.8,
    tagline: "For agencies and power sellers at scale",
    accent: "#f59e0b",
  },
};

const FEATURES: Record<PlanKey, { ok: boolean; text: string }[]> = {
  starter: [
    { ok: true,  text: "15 product analyses per day" },
    { ok: true,  text: "Market research & demand score" },
    { ok: true,  text: "Go or No-Go verdict" },
    { ok: true,  text: "Top 3 competitors" },
    { ok: true,  text: "Basic angle suggestions (3 per product)" },
    { ok: true,  text: "Profit calculator" },
    { ok: true,  text: "7-day report history" },
    { ok: false, text: "Ad scripts" },
    { ok: false, text: "Competitor ad library" },
    { ok: false, text: "Viral TikTok extraction" },
    { ok: false, text: "Private supplier network" },
  ],
  pro: [
    { ok: true,  text: "30 product analyses per day" },
    { ok: true,  text: "Everything in Starter" },
    { ok: true,  text: "Full angle discovery (unlimited angles)" },
    { ok: true,  text: "Emotional hooks for each angle" },
    { ok: true,  text: "Ready-to-use ad scripts for Meta & TikTok" },
    { ok: true,  text: "Competitor ad library access" },
    { ok: true,  text: "Viral TikTok extraction" },
    { ok: true,  text: "30-day report history" },
    { ok: true,  text: "Priority support" },
    { ok: true,  text: "Access to private supplier network (7-figure verified)" },
    { ok: false, text: "White label reports" },
    { ok: false, text: "API access" },
  ],
  agency: [
    { ok: true, text: "Unlimited analyses" },
    { ok: true, text: "Everything in Pro" },
    { ok: true, text: "Unlimited ad scripts" },
    { ok: true, text: "White label reports for clients" },
    { ok: true, text: "API access" },
    { ok: true, text: "Team seats (up to 5 users)" },
    { ok: true, text: "Dedicated account manager" },
    { ok: true, text: "Custom integrations" },
    { ok: true, text: "90-day report history" },
    { ok: true, text: "Competitor tracking alerts" },
    { ok: true, text: "Priority access to private supplier network" },
  ],
};

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function FeatureLine({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={`flex gap-2 text-sm ${ok ? "text-[#cccccc]" : "text-[#555555] line-through"}`}>
      <span className={ok ? "text-[#6c47ff]" : "text-[#444444]"}>{ok ? "✓" : "✗"}</span>
      {children}
    </li>
  );
}

// ─── Component that uses useSearchParams (must be inside Suspense) ────────────
function PricingInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const [billing, setBilling]   = useState<Billing>("monthly");
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [loading, setLoading]   = useState<PlanKey | null>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [error, setError]       = useState("");

  // These are safe — useSearchParams() is inside Suspense so Next.js won't
  // try to statically evaluate them at build time.
  const upgraded     = params.get("upgraded") === "1";
  const upgradedPlan = params.get("plan") ?? "";
  const showAnnual   = billing === "annual";

  useEffect(() => {
    try {
      supabase.auth.getUser()
        .then(({ data }) => setUser(data.user ?? null))
        .catch(() => {});
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
        setUser(s?.user ?? null);
      });
      return () => subscription.unsubscribe();
    } catch {
      // Supabase not configured — silently ignore during prerender / build
    }
  }, []);

  // ── Subscribe handler — sends planKey to the server; server resolves priceId ─
  async function handleSubscribe(planKey: PlanKey) {
    setError("");

    if (!user) {
      router.push(`/signup?redirect=/pricing&plan=${planKey}`);
      return;
    }

    setLoading(planKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? "";

      // Send the plan key — the API route looks up the Stripe price ID server-side
      // using STRIPE_PRICE_STARTER / STRIPE_PRICE_PRO / STRIPE_PRICE_AGENCY
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planKey }),
      });

      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Could not start checkout");

      window.location.href = json.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <AnimatedBadge text="💎 Simple Pricing" />
          <h1 className="mt-8 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-tight">
            Invest in winning products.
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-base text-[#888888] sm:text-lg">
            Stop losing money on products that flop. One good product validated pays for years of ProdIQ.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 inline-flex rounded-full border border-[#222222] bg-[#111111] p-1" role="group" aria-label="Billing period">
            {(["monthly", "annual"] as Billing[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  billing === b ? "bg-[#6c47ff] text-white" : "text-[#888888] hover:text-white"
                }`}
              >
                {b === "monthly" ? "Monthly" : <>Annual <span className="opacity-80">(saves 20%)</span></>}
              </button>
            ))}
          </div>
        </div>

        {/* Success banner */}
        {upgraded && upgradedPlan && (
          <div className="mt-10 mx-auto max-w-[640px] rounded-2xl border border-[rgba(0,212,170,0.4)] bg-[rgba(0,212,170,0.08)] p-5 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="font-bold text-[#00d4aa] text-lg">
              You&apos;re now on the {upgradedPlan.charAt(0).toUpperCase() + upgradedPlan.slice(1)} plan!
            </p>
            <p className="mt-1 text-sm text-[#888]">Your account has been upgraded. Head back to the dashboard to continue.</p>
            <a href="/dashboard" className="mt-4 inline-block rounded-xl bg-[#6c47ff] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3ad4]">
              Go to Dashboard →
            </a>
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
          {(["starter", "pro", "agency"] as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const price = plan.monthlyPrice * (showAnnual ? plan.annualFactor : 1);
            const isPro = !!plan.popular;

            return (
              <div
                key={key}
                className={`flex flex-col rounded-2xl bg-[#111111] p-8 ${isPro ? "border border-[rgba(108,71,255,0.5)] lg:scale-[1.04] lg:py-10" : "border border-[#1a1a1a]"}`}
                style={isPro ? { boxShadow: "0 0 40px rgba(108,71,255,0.3)" } : undefined}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${isPro ? "inline-block w-fit rounded-full bg-[#6c47ff] px-3 py-1 text-white" : ""}`}
                  style={isPro ? undefined : { color: plan.accent }}
                >
                  {plan.label.toUpperCase()}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">${fmt(price)}</span>
                  <span className="text-base text-[#888888]">/month</span>
                </div>
                {showAnnual && <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>}
                <p className="mt-4 text-sm text-[#888888]">{plan.tagline}</p>
                <div className={`my-6 h-px ${isPro ? "bg-[#2a2a3a]" : "bg-[#1a1a1a]"}`} />

                <ul className="flex-1 space-y-3">
                  {FEATURES[key].map(({ ok, text }) => (
                    <FeatureLine key={text} ok={ok}>{text}</FeatureLine>
                  ))}
                </ul>

                {isPro ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      disabled={loading !== null}
                      onClick={() => void handleSubscribe(key)}
                      className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#6c47ff] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#5a3ad4] disabled:opacity-60"
                      style={{ boxShadow: "0 8px 24px rgba(108,71,255,0.4)" }}
                    >
                      {loading === key ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Redirecting…</>
                      ) : `Get ${plan.label} →`}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => void handleSubscribe(key)}
                    className={`mt-8 flex w-full items-center justify-center rounded-[22px] py-3.5 text-[15px] font-semibold text-white transition disabled:opacity-60 ${
                      key === "agency"
                        ? "border-2 border-amber-500/60 hover:border-amber-400"
                        : "border border-[#333333] hover:border-[#6c47ff] hover:text-[#a78bfa]"
                    }`}
                  >
                    {loading === key ? (
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${key === "agency" ? "border-amber-400" : "border-white"}`} />
                        Redirecting…
                      </span>
                    ) : `Get ${plan.label}`}
                  </button>
                )}
              </div>
            );
          })}
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

// ─── Exported component: Suspense wraps the useSearchParams consumer ──────────
export function PricingClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0a0a0a] pt-[88px] text-white">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6c47ff] border-t-transparent" />
              <p className="text-sm text-[#555]">Loading pricing…</p>
            </div>
          </div>
        </main>
      }
    >
      <PricingInner />
    </Suspense>
  );
}
