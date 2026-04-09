"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AnimatedBadge, AnimatedButton } from "@/components/LandingHeroClient";

type Billing = "monthly" | "annual";

const PLANS = {
  starter: { monthly: 29.9, annualFactor: 0.8 },
  pro: { monthly: 59.9, annualFactor: 0.8 },
  agency: { monthly: 89.9, annualFactor: 0.8 },
} as const;

function formatPrice(n: number) {
  return n.toFixed(2);
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
    q: "What happens after my free trial?",
    a: "You will be asked to choose a plan. If you do not subscribe your account stays active but analyses are paused.",
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

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const showAnnual = billing === "annual";

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          <AnimatedBadge text="💎 Simple Pricing" />
          <h1 className="mt-8 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-tight">Invest in winning products.</h1>
          <p className="mx-auto mt-4 max-w-[560px] text-base text-[#888888] sm:text-lg">
            Stop losing money on products that flop. One good product validated pays for years of ProdIQ.
          </p>

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

        <div className="mt-16 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3 lg:items-center">
          {/* Starter */}
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#111111] p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#888888]">STARTER</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                ${formatPrice(PLANS.starter.monthly * (showAnnual ? PLANS.starter.annualFactor : 1))}
              </span>
              <span className="text-base text-[#888888]">/month</span>
            </div>
            {showAnnual ? (
              <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>
            ) : null}
            <p className="mt-4 text-sm text-[#888888]">Perfect for solo sellers testing new products</p>
            <div className="my-6 h-px bg-[#1a1a1a]" />
            <ul className="space-y-3">
              <FeatureLine ok>15 product analyses per day</FeatureLine>
              <FeatureLine ok>Market research & demand score</FeatureLine>
              <FeatureLine ok>Go or No-Go verdict</FeatureLine>
              <FeatureLine ok>Top 3 competitors</FeatureLine>
              <FeatureLine ok>Basic angle suggestions (3 per product)</FeatureLine>
              <FeatureLine ok>Profit calculator</FeatureLine>
              <FeatureLine ok>7-day report history</FeatureLine>
              <FeatureLine ok={false}>Ad scripts</FeatureLine>
              <FeatureLine ok={false}>Competitor ad library</FeatureLine>
              <FeatureLine ok={false}>AI image ad generation</FeatureLine>
              <FeatureLine ok={false}>Viral TikTok extraction</FeatureLine>
              <FeatureLine ok={false}>Private supplier network (Pro &amp; Agency only)</FeatureLine>
            </ul>
            <Link
              href="/signup"
              className="mt-8 flex w-full items-center justify-center rounded-[22px] border border-[#333333] py-3.5 text-[15px] font-semibold text-white transition hover:border-[#444444]"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div
            className="rounded-2xl border border-[rgba(108,71,255,0.5)] bg-[#111111] p-8 lg:scale-[1.04] lg:py-10"
            style={{ boxShadow: "0 0 40px rgba(108,71,255,0.3)" }}
          >
            <p className="inline-block rounded-full bg-[#6c47ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              MOST POPULAR
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                ${formatPrice(PLANS.pro.monthly * (showAnnual ? PLANS.pro.annualFactor : 1))}
              </span>
              <span className="text-base text-[#888888]">/month</span>
            </div>
            {showAnnual ? (
              <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>
            ) : null}
            <p className="mt-4 text-sm text-[#888888]">For serious sellers who want the full picture</p>
            <div className="my-6 h-px bg-[#2a2a3a]" />
            <ul className="space-y-3">
              <FeatureLine ok>30 product analyses per day</FeatureLine>
              <FeatureLine ok>Everything in Starter</FeatureLine>
              <FeatureLine ok>Full angle discovery (unlimited angles)</FeatureLine>
              <FeatureLine ok>Emotional hooks for each angle</FeatureLine>
              <FeatureLine ok>Ready-to-use ad scripts for Meta & TikTok</FeatureLine>
              <FeatureLine ok>Competitor ad library access</FeatureLine>
              <FeatureLine ok>AI image ad generation (5 per product)</FeatureLine>
              <FeatureLine ok>Viral TikTok extraction</FeatureLine>
              <FeatureLine ok>30-day report history</FeatureLine>
              <FeatureLine ok>Priority support</FeatureLine>
              <FeatureLine ok>Access to private supplier network (7-figure verified)</FeatureLine>
              <FeatureLine ok={false}>White label reports</FeatureLine>
              <FeatureLine ok={false}>API access</FeatureLine>
            </ul>
            <div className="mt-8 flex justify-center">
              <AnimatedButton href="/signup" text="Start Free Trial" />
            </div>
          </div>

          {/* Agency */}
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#111111] p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">AGENCY</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                ${formatPrice(PLANS.agency.monthly * (showAnnual ? PLANS.agency.annualFactor : 1))}
              </span>
              <span className="text-base text-[#888888]">/month</span>
            </div>
            {showAnnual ? (
              <p className="mt-1 text-xs text-[#666666]">Billed annually (20% off)</p>
            ) : null}
            <p className="mt-4 text-sm text-[#888888]">For agencies and power sellers at scale</p>
            <div className="my-6 h-px bg-[#1a1a1a]" />
            <ul className="space-y-3">
              <FeatureLine ok>50+ product analyses per day</FeatureLine>
              <FeatureLine ok>Everything in Pro</FeatureLine>
              <FeatureLine ok>Unlimited ad scripts</FeatureLine>
              <FeatureLine ok>Unlimited AI image generation</FeatureLine>
              <FeatureLine ok>White label reports for clients</FeatureLine>
              <FeatureLine ok>API access</FeatureLine>
              <FeatureLine ok>Team seats (up to 5 users)</FeatureLine>
              <FeatureLine ok>Dedicated account manager</FeatureLine>
              <FeatureLine ok>Custom integrations</FeatureLine>
              <FeatureLine ok>90-day report history</FeatureLine>
              <FeatureLine ok>Competitor tracking alerts</FeatureLine>
              <FeatureLine ok>Priority access to private supplier network</FeatureLine>
            </ul>
            <Link
              href="/signup"
              className="mt-8 flex w-full items-center justify-center rounded-[22px] border-2 border-amber-500/60 bg-transparent py-3.5 text-[15px] font-semibold text-white transition hover:border-amber-400"
            >
              Start Free Trial
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-[#888888]">
          All plans include a 1-day free trial. No credit card required.
        </p>

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
                    <span className="shrink-0 text-xl text-[#6c47ff]" aria-hidden>
                      {open ? "−" : "+"}
                    </span>
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
