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

const COMPETITORS = [
  {
    brand: "NeuroEase Pro",
    initial: "N",
    revenue: "$840k–$1.1M/mo",
    quote: "“Gym recovery without living in the gym.”",
    weakness: "Battery complaints after 60d + weak warranty copy.",
    opportunity: "2yr guarantee + desk-neck creative they ignore.",
  },
  {
    brand: "PulseLite",
    initial: "P",
    revenue: "$310k–$480k/mo",
    quote: "“Cheapest FDA-style buzzwords on the feed.”",
    weakness: "Generic hooks — no emotional story, price-only.",
    opportunity: "Lead with travel / WFH pain they never touch.",
  },
  {
    brand: "ZenBand Co",
    initial: "Z",
    revenue: "$1.2M–$1.6M/mo",
    quote: "“Wellness lifestyle — spa day fantasy.”",
    weakness: "Slow shipping + influencer reliance; ad fatigue.",
    opportunity: "Speed + proof stack; attack delivery promise.",
  },
] as const;

const COMPARE_ROWS = [
  { they: "Discount urgency hooks", miss: "No long-term trust story", you: "Guarantee + proof-first" },
  { they: "Single-channel TikTok", miss: "Weak Amazon PDP match", you: "Omnichannel same angle" },
  { they: "Feature lists in ads", miss: "Zero POV / pain narrative", you: "POV + one outcome" },
  { they: "Race to lowest price", miss: "No premium bundle story", you: "Bundle + bonus perceived value" },
  { they: "Copy viral audio trends", miss: "No unique hook ownership", you: "Own one phrase / meme" },
] as const;

function WarningGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L2 20h20L12 2z"
        stroke="#ff8800"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(255,136,0,0.12)"
      />
      <path d="M12 9v5M12 17h.01" stroke="#ff8800" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function GreenArrowGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h12M14 8l4 4-4 4"
        stroke="#00d4aa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CompetitorIntelWorkflowPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:pb-28 sm:pt-16" style={HERO_ATMOSPHERE}>
        <div className="relative z-[1] mx-auto max-w-[900px] text-center">
          <div className="mb-6 flex justify-center">
            <WorkflowBadge text="🕵️ Competitor Intelligence" />
          </div>
          <h1 className="font-bold text-white" style={{ fontSize: 52, lineHeight: 1.12 }}>
            See everything your competitors are doing. Do it better.
          </h1>
          <p className="mx-auto mt-6 max-w-[420px] text-sm text-[#888888]">Their angles and gaps — mapped same-day.</p>
          <div className="mt-10 flex justify-center">
            <AnimatedButton href="/signup" text="Try It Free →" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Competitor cards</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {COMPETITORS.map((c) => (
            <div key={c.brand} className="rounded-2xl p-6 sm:p-7" style={{ background: "#0c0c0c" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #333, #111)", border: "1px solid #333" }}
                  >
                    {c.initial}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{c.brand}</p>
                    <p className="text-xs text-[#666666]">Portable massager · DTC</p>
                  </div>
                </div>
                <span className="rounded-lg border border-[#00d4aa]/40 bg-[#00d4aa]/10 px-3 py-1.5 text-xs font-bold text-[#00d4aa]">
                  Est. {c.revenue}
                </span>
              </div>
              <p className="mt-6 text-sm italic text-[#a78bfa]">{c.quote}</p>
              <div className="mt-5 flex gap-3 rounded-xl bg-[#ff8800]/10 px-4 py-3">
                <WarningGlyph className="mt-0.5 shrink-0" />
                <p className="text-xs leading-snug text-[#eeccaa]">{c.weakness}</p>
              </div>
              <div className="mt-3 flex gap-3 rounded-xl bg-[#00d4aa]/10 px-4 py-3">
                <GreenArrowGlyph className="mt-0.5 shrink-0" />
                <p className="text-xs leading-snug text-[#aaeedd]">{c.opportunity}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#141414] bg-[#050505] px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">You vs them</h2>
        <div className="mx-auto mt-10 max-w-[800px] overflow-hidden rounded-xl text-xs sm:text-sm">
          <div className="grid grid-cols-3 bg-[#111] py-3 text-center font-bold">
            <div className="text-[#ff6b6b]">What they do</div>
            <div className="text-[#f5a623]">What they miss</div>
            <div className="text-[#00d4aa]">Your edge</div>
          </div>
          {COMPARE_ROWS.map((row) => (
            <div key={row.they} className="grid grid-cols-3 border-t border-[#1a1a1a] bg-[#0a0a0a] py-2.5">
              <div className="px-2 py-1 text-[#aaaaaa]">{row.they}</div>
              <div className="px-2 py-1 text-[#aaaaaa]">{row.miss}</div>
              <div className="px-2 py-1 text-[#cccccc]">{row.you}</div>
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Win the category</h2>
          <p className="mt-2 text-xs text-[#888888]">Map rivals in seconds · 1 free run</p>
          <div className="mt-8 flex justify-center">
            <AnimatedButton href="/signup" text="Start Free →" />
          </div>
        </div>
      </section>
    </main>
  );
}
 