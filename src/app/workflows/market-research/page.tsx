"use client";

import { AnimatedButton } from "@/components/LandingHeroClient";

const HERO_ATMOSPHERE = {
  background: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,71,255,0.35) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 20%, rgba(30,27,75,0.5) 0%, transparent 55%),
    radial-gradient(ellipse 45% 35% at 10% 30%, rgba(15,23,42,0.7) 0%, transparent 50%),
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

const STAT_PILLS = [
  { k: "10 sec", v: "Full report generated" },
  { k: "50+", v: "Sources searched" },
  { k: "94%", v: "Accuracy rate" },
  { k: "$2M+", v: "Saved by users" },
] as const;

const STEPS = [
  { title: "Upload", line: "Image, link, or paste", icon: "📤" },
  { title: "Match", line: "AI locks the product", icon: "🎯" },
  { title: "Scan", line: "50+ sources in parallel", icon: "⚡" },
  { title: "Report", line: "Verdict + metrics", icon: "📊" },
] as const;

const FEATURE_CARDS = [
  {
    title: "Demand score",
    line: "See how badly the market wants it.",
    metric: 84,
    color: "#6c47ff",
    cssFace: { bg: "linear-gradient(145deg, #6c47ff 0%, #3b2a8f 100%)", emoji: "📈" },
    sampleLabel: "Report excerpt",
    sampleHint: "Strong purchase intent vs. category avg.",
  },
  {
    title: "Trend pulse",
    line: "Heating up, flat, or cooling off.",
    metric: 72,
    color: "#00d4aa",
    cssFace: { bg: "linear-gradient(145deg, #00d4aa 0%, #006b55 100%)", emoji: "〰️" },
    sampleLabel: "90-day signal",
    sampleHint: "Search volume ↑ 34% · social mentions climbing",
  },
  {
    title: "Geo heatmap",
    line: "Where buyers actually cluster.",
    metric: 68,
    color: "#f5a623",
    cssFace: { bg: "linear-gradient(145deg, #f5a623 0%, #8a5a00 100%)", emoji: "🌍" },
    sampleLabel: "Top regions",
    sampleHint: "🇺🇸 42% · 🇬🇧 19% · 🇩🇪 14%",
  },
  {
    title: "Go / No-Go",
    line: "One clear call with risks flagged.",
    metric: 91,
    color: "#00d4aa",
    cssFace: { bg: "linear-gradient(145deg, #00d4aa 0%, #6c47ff 100%)", emoji: "✓" },
    sampleLabel: "Verdict",
    sampleHint: "GO — margin headroom + low ad saturation",
  },
] as const;

export default function MarketResearchWorkflowPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <style>{`
        @keyframes workflow-stat-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108, 71, 255, 0.35); }
          50% { box-shadow: 0 0 24px 2px rgba(108, 71, 255, 0.25); }
        }
        @keyframes workflow-arrow-dash {
          0% { opacity: 0.35; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(4px); }
          100% { opacity: 0.35; transform: translateX(0); }
        }
        .workflow-stat-pill { animation: workflow-stat-glow 3s ease-in-out infinite; }
        .workflow-stat-pill:nth-child(2) { animation-delay: 0.4s; }
        .workflow-stat-pill:nth-child(3) { animation-delay: 0.8s; }
        .workflow-stat-pill:nth-child(4) { animation-delay: 1.2s; }
        .workflow-arrow-anim { animation: workflow-arrow-dash 1.8s ease-in-out infinite; }
      `}</style>

      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:pb-28 sm:pt-16" style={HERO_ATMOSPHERE}>
        <div className="relative z-[1] mx-auto max-w-[900px] text-center">
          <div className="mb-6 flex justify-center">
            <WorkflowBadge text="🔍 Market Research & Validation" />
          </div>
          <h1 className="mx-auto max-w-[720px] font-bold leading-[1.12]" style={{ fontSize: 52 }}>
            <span className="block text-white">Upload a product.</span>
            <span className="mt-1 block text-[#6c47ff]">Get the full market picture.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[#888888]" style={{ fontSize: 17, lineHeight: 1.55 }}>
            We search 50+ sources and hand you everything — demand, competitors, countries, winning angles, and a clear
            verdict. You do nothing except upload.
          </p>
          <div className="mx-auto mt-8 flex max-w-[720px] flex-wrap justify-center gap-3 sm:gap-4">
            {STAT_PILLS.map((p) => (
              <div
                key={p.k}
                className="workflow-stat-pill rounded-full border border-[#6c47ff]/35 bg-[#6c47ff]/10 px-4 py-2.5 text-left sm:px-5"
              >
                <p className="text-lg font-black tabular-nums text-white">{p.k}</p>
                <p className="text-[11px] text-[#a78bfa]">{p.v}</p>
              </div>
            ))}
          </div>
          <div
            className="mx-auto mt-8 max-w-[700px] rounded-xl px-5 py-5"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: "#6c47ff",
              borderTop: "1px solid rgba(108,71,255,0.15)",
              borderRight: "1px solid rgba(108,71,255,0.15)",
              borderBottom: "1px solid rgba(108,71,255,0.15)",
              backgroundColor: "#0d0b1a",
              borderRadius: 12,
            }}
          >
            <p className="text-[15px] leading-[1.7] text-[#a78bfa]">
              🎯 Everything a professional researcher would spend 6 hours doing — ProdIQ does in 10 seconds. Demand
              analysis, competitor mapping, angle discovery, country targeting, profit estimation, and a clear go or no-go
              verdict. All from one upload.
            </p>
          </div>
          <div className="mt-10 flex justify-center">
            <AnimatedButton href="/signup" text="Try It Free →" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">How it works</h2>
        <div className="mx-auto mt-12 flex max-w-[1040px] flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-2">
          {STEPS.map((step, i) => (
            <div key={step.title} className="contents lg:contents">
              <div
                className="w-full max-w-[240px] flex-col items-center rounded-2xl bg-[#121212] px-4 py-6 lg:w-[200px] lg:max-w-none"
                style={{ display: "flex" }}
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{
                    background: "linear-gradient(160deg, rgba(108,71,255,0.35), rgba(10,10,10,0.9))",
                    border: "1px solid rgba(108,71,255,0.25)",
                  }}
                >
                  {step.icon}
                </div>
                <p className="mt-4 text-center font-bold text-white">{step.title}</p>
                <p className="mt-1 text-center text-xs text-[#888888]">{step.line}</p>
              </div>
              {i < STEPS.length - 1 ? (
                <div className="workflow-arrow-anim flex text-[#6c47ff] lg:mt-14 lg:px-1" aria-hidden>
                  <svg className="rotate-90 lg:rotate-0" width="28" height="24" viewBox="0 0 28 24" fill="none">
                    <path
                      d="M0 12h20M14 6l8 6-8 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#141414] bg-[#050505] px-4 py-16 sm:px-6 sm:py-24">
        <p className="mx-auto mb-8 text-center text-[22px] font-bold text-white" style={{ marginBottom: 32 }}>
          Here is exactly what lands in your report:
        </p>
        <div className="mx-auto grid max-w-[1100px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map((f) => (
            <div
              key={f.title}
              className="flex min-h-[200px] flex-col items-center rounded-2xl px-5 pb-5 pt-7 text-center"
              style={{ background: "#0d0d0d" }}
            >
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl shadow-lg"
                style={{ background: f.cssFace.bg }}
              >
                {f.cssFace.emoji}
              </div>
              <p className="mt-5 text-[15px] font-bold text-white">{f.title}</p>
              <p className="mt-1 text-xs text-[#888888]">{f.line}</p>
              <div className="mt-auto w-full rounded-xl border border-[#1a1a1a] bg-[#080808] p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#555555]">{f.sampleLabel}</p>
                {f.title === "Demand score" ? (
                  <>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black tabular-nums text-white">{f.metric}</span>
                      <span className="text-sm text-[#666666]">/100</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${f.metric}%`, background: f.color }}
                      />
                    </div>
                  </>
                ) : f.title === "Trend pulse" ? (
                  <>
                    <p className="mt-2 text-lg font-bold text-[#00d4aa]">↑ Growing</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                      <div className="h-full rounded-full" style={{ width: `${f.metric}%`, background: f.color }} />
                    </div>
                  </>
                ) : f.title === "Geo heatmap" ? (
                  <div className="mt-2 space-y-1.5">
                    {[
                      { code: "US", w: 88 },
                      { code: "UK", w: 62 },
                      { code: "DE", w: 54 },
                    ].map((g) => (
                      <div key={g.code} className="flex items-center gap-2">
                        <span className="w-7 text-[11px] font-semibold text-[#888888]">{g.code}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1a1a1a]">
                          <div className="h-full rounded-full bg-[#f5a623]" style={{ width: `${g.w}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[#00d4aa]/45 bg-[#00d4aa]/12 px-2 py-0.5 text-xs font-bold text-[#00d4aa]">
                      GO
                    </span>
                    <span className="text-xl font-black tabular-nums text-white">{f.metric}</span>
                    <span className="text-xs text-[#666666]">confidence</span>
                  </div>
                )}
                <p className="mt-2 text-[11px] leading-snug text-[#666666]">{f.sampleHint}</p>
              </div>
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
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Validate your first product</h2>
          <p className="mt-2 text-xs text-[#888888]">1 free run · no card</p>
          <div className="mt-8 flex justify-center">
            <AnimatedButton href="/signup" text="Start Free →" />
          </div>
        </div>
      </section>
    </main>
  );
}
