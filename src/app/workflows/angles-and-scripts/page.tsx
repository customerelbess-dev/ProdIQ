"use client";

import { AnimatedButton } from "@/components/LandingHeroClient";

const HERO_ATMOSPHERE = {
  background: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,71,255,0.35) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 20%, rgba(30,27,75,0.5) 0%, transparent 55%),
    #0a0a0a
  `,
} as const;

function WorkflowBadge({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "rgba(108, 71, 255, 0.15)",
        border: "1px solid rgba(108, 71, 255, 0.3)",
        borderRadius: "9999px",
        padding: "6px 16px",
        fontSize: "13px",
        color: "#a78bfa",
        fontWeight: 500,
        letterSpacing: "0.02em",
        backdropFilter: "blur(8px)",
        display: "inline-block",
      }}
    >
      {text}
    </div>
  );
}

const HERO_PILLS = ["Untapped Angles", "Emotional Hooks", "Ready Scripts"] as const;

const SCRIPT_BLOCKS = [
  {
    label: "HOOK",
    border: "#6c47ff",
    text: "“POV: You have had neck pain for 3 years and nothing worked”",
  },
  {
    label: "PROBLEM",
    border: "#3b82f6",
    text: "Most massagers are bulky, expensive, and useless after week 1",
  },
  {
    label: "SOLUTION",
    border: "#00d4aa",
    text: "This portable massager fits in your pocket and works in 60 seconds",
  },
  {
    label: "PROOF",
    border: "#f5a623",
    text: "47,000 five star reviews. Ships in 2 days.",
  },
  {
    label: "CTA",
    border: "#ffffff",
    text: "Tap the link. Free shipping today only.",
  },
] as const;

export default function AnglesAndScriptsWorkflowPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:pb-28 sm:pt-16" style={HERO_ATMOSPHERE}>
        <div className="relative z-[1] mx-auto max-w-[900px] text-center">
          <div className="mb-6 flex justify-center">
            <WorkflowBadge text="🎯 Winning Angles & Ad Scripts" />
          </div>
          <h1 className="font-bold text-white" style={{ fontSize: 52, lineHeight: 1.12 }}>
            Find the exact angles your competitors are sleeping on.
          </h1>
          <p className="mx-auto mt-6 max-w-[480px] text-sm text-[#888888]">
            Real discussions → hooks and scripts you can shoot today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {HERO_PILLS.map((p) => (
              <span
                key={p}
                className="rounded-full border border-[#6c47ff]/40 bg-[#6c47ff]/10 px-4 py-2 text-xs font-semibold text-[#c4b5fd]"
              >
                {p}
              </span>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <AnimatedButton href="/signup" text="Try It Free →" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Angle signals</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(255,68,68,0.1)",
            }}
          >
            <p className="text-xs font-black tracking-wide text-[#ff6666]">SATURATED ✗</p>
            <p className="mt-4 text-lg font-bold text-white">Best neck massager 2025</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#1a0a0a]">
              <div className="h-full rounded-full bg-[#ff4444]" style={{ width: "95%" }} />
            </div>
            <p className="mt-3 text-sm text-[#cccccc]">Everyone is using this. Avoid.</p>
          </div>
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(245,166,35,0.1)",
            }}
          >
            <p className="text-xs font-black tracking-wide text-[#ffc14d]">EMERGING ⚡</p>
            <p className="mt-4 text-lg font-bold text-white">Work from home pain relief</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#1a1408]">
              <div className="h-full rounded-full bg-[#f5a623]" style={{ width: "45%" }} />
            </div>
            <p className="mt-3 text-sm text-[#cccccc]">Growing fast. Test now.</p>
          </div>
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(0,212,170,0.1)",
            }}
          >
            <p className="text-xs font-black tracking-wide text-[#4dffc9]">UNTAPPED ✓</p>
            <p className="mt-4 text-lg font-bold text-white">I never knew neck pain was destroying my sleep</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#0a1a16]">
              <div className="h-full rounded-full bg-[#00d4aa]" style={{ width: "8%" }} />
            </div>
            <p className="mt-3 text-sm text-[#cccccc]">Nobody is running this yet.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#141414] bg-[#050505] px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Ad script mockup</h2>
        <div
          className="mx-auto mt-10 max-w-[640px] space-y-0 overflow-hidden rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.45)]"
          style={{ background: "#080808" }}
        >
          {SCRIPT_BLOCKS.map((b) => (
            <div
              key={b.label}
              className="border-b border-[#141414] px-5 py-4 pl-3 sm:px-6 sm:py-5"
              style={{ borderLeft: `4px solid ${b.border}` }}
            >
              <p className="text-[10px] font-bold tracking-widest text-[#888888]">{b.label}</p>
              <p className="mt-2 text-sm leading-snug text-[#e8e8e8]">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="relative overflow-hidden px-4 py-20 sm:py-28"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(108,71,255,0.18) 0%, transparent 70%), #0a0a0a",
        }}
      >
        <div className="relative z-[1] mx-auto max-w-[640px] text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ship creatives that convert</h2>
          <p className="mt-2 text-xs text-[#888888]">1 free analysis · hooks included</p>
          <div className="mt-8 flex justify-center">
            <AnimatedButton href="/signup" text="Start Free →" />
          </div>
        </div>
      </section>
    </main>
  );
}
