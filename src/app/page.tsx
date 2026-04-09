"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DATA_SOURCE_LOGOS_HERO } from "@/components/data-source-logos";
import { AnimatedBadge, AnimatedButton, AnimatedStats } from "@/components/LandingHeroClient";
import { ProdIqBrandLogo } from "@/components/ProdIqBrandLogo";
import { ProdIqLogoImg } from "@/components/ProdIqLogoImg";
import { EXAMPLE_REPORT } from "@/lib/example-report";

const MASSAGER_IMG_FALLBACK =
  "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&h=400&fit=crop&q=80";

type AdLib = {
  image: string;
  brand: string;
  headline: string;
  platform: string;
  platformColor: string;
  metric: string;
};

function GlowDivider() {
  return (
    <div style={{ position: "relative", width: "100%", height: "2px", margin: "40px 0", overflow: "visible" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "rgba(255,255,255,0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-4px",
          left: 0,
          right: 0,
          height: "9px",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "3px",
            left: 0,
            width: "140px",
            height: "3px",
            background: "linear-gradient(90deg, transparent, #6c47ff, #a78bfa, #6c47ff, transparent)",
            borderRadius: "2px",
            boxShadow: "0 0 20px rgba(108,71,255,0.8), 0 0 40px rgba(108,71,255,0.4)",
            animation: "glowDividerTravel 5.5s linear infinite",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          top: "-1px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "120px",
          height: "3px",
          background: "linear-gradient(90deg, transparent, #6c47ff, #a78bfa, #6c47ff, transparent)",
          borderRadius: "2px",
          boxShadow: "0 0 20px rgba(108,71,255,0.8), 0 0 40px rgba(108,71,255,0.4)",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-3px",
          left: "calc(50% - 80px)",
          width: "6px",
          height: "6px",
          background: "#6c47ff",
          borderRadius: "50%",
          boxShadow: "0 0 8px #6c47ff",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-3px",
          left: "calc(50% + 74px)",
          width: "6px",
          height: "6px",
          background: "#6c47ff",
          borderRadius: "50%",
          boxShadow: "0 0 8px #6c47ff",
        }}
      />
    </div>
  );
}

function PlainBadge({ text }: { text: string }) {
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

function PlainPurpleLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-center transition hover:opacity-90"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 28px",
        background: "#6c47ff",
        borderRadius: "20px",
        color: "white",
        fontSize: "15px",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

const reviewers = [
  {
    name: "Marcus R.",
    role: "Dropshipper",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces&q=80",
    review:
      "ProdIQ saved me $800 on a product I was about to test. The AI spotted market saturation I completely missed. Paid for itself on day one.",
    date: "MAR 12, 2026",
    stars: 5,
  },
  {
    name: "Youssef K.",
    role: "DTC Brand Owner",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces&q=80",
    review:
      "The winning angles feature is unlike anything I have seen. I used the exact emotional hook it suggested and got a 3.2x ROAS on my first creative.",
    date: "FEB 28, 2026",
    stars: 5,
  },
  {
    name: "Adam T.",
    role: "Amazon FBA Seller",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces&q=80",
    review:
      "Analyzed 12 products in one afternoon. Found 2 clear winners and avoided 3 disasters. The competitor weakness analysis alone is worth the subscription.",
    date: "MAR 01, 2026",
    stars: 5,
  },
  {
    name: "Sarah M.",
    role: "Agency Owner",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces&q=80",
    review:
      "I run product validation for 8 clients. ProdIQ cut my research time from 3 hours per product to 10 seconds. My clients think I am a genius.",
    date: "FEB 15, 2026",
    stars: 5,
  },
  {
    name: "James L.",
    role: "Affiliate Marketer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces&q=80",
    review:
      "The psychological angles section is gold. It extracted the real reason people buy from Reddit and turned it into a hook that converted 4.8% on cold traffic.",
    date: "MAR 08, 2026",
    stars: 5,
  },
  {
    name: "Priya S.",
    role: "Ecom Store Owner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces&q=80",
    review:
      "I was about to launch a completely saturated product. ProdIQ gave it a 23/100 score and said NO-GO. Saved me from a $2,000 mistake.",
    date: "JAN 30, 2026",
    stars: 5,
  },
] as const;

function SeeExampleButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("prodiq_report", JSON.stringify(EXAMPLE_REPORT));
        }
        router.push("/report");
      }}
      className="rounded-[20px] border border-[#333333] px-6 py-2.5 text-sm text-[#888888] transition hover:border-[#444444] hover:text-white sm:py-3 sm:text-base"
    >
      See example
    </button>
  );
}

const featureDashShell: CSSProperties = {
  background: "#0c0c14",
  borderRadius: 20,
  border: "1px solid rgba(108,71,255,0.2)",
  overflow: "hidden",
  maxWidth: 1000,
  margin: "0 auto",
};

function FeatureTabMarket() {
  const platformBadges = [
    { letter: "S", bg: "#96BF48" },
    { letter: "f", bg: "#1877f2" },
    { letter: "T", bg: "#000" },
    { letter: "P", bg: "#6c47ff" },
  ] as const;
  const stats = [
    { label: "Market Size", value: "$2.3B", change: "+12%", color: "#00d4aa" },
    { label: "Monthly Searches", value: "847K", change: "+34%", color: "#6c47ff" },
    { label: "Avg Selling Price", value: "$47.90", change: "+8%", color: "#f59e0b" },
    { label: "Profit Margin", value: "68%", change: "+15%", color: "#00d4aa" },
  ] as const;
  const countries = [
    { flag: "🇺🇸", country: "United States", revenue: "$890K", bar: 90, color: "#6c47ff" },
    { flag: "🇬🇧", country: "United Kingdom", revenue: "$340K", bar: 65, color: "#6c47ff" },
    { flag: "🇩🇪", country: "Germany", revenue: "$280K", bar: 52, color: "#6c47ff" },
    { flag: "🇦🇺", country: "Australia", revenue: "$190K", bar: 38, color: "#6c47ff" },
  ] as const;
  return (
    <div className="w-full" style={featureDashShell}>
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ProdIqLogoImg preset="tab" />
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Market Intelligence Report</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              color: "#888",
            }}
          >
            Last 30 days
          </div>
          <div
            style={{
              background: "#6c47ff",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              color: "white",
              fontWeight: 600,
            }}
          >
            ↗ Share
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#888", fontSize: 13, fontWeight: 600 }}>📊 Market Summary</span>
          {platformBadges.map((p) => (
            <div
              key={p.letter}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                background: p.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                color: "white",
                fontWeight: 700,
              }}
            >
              {p.letter}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #1a1a1a" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <span style={{ color: "#666", fontSize: 11, fontWeight: 600 }}>{stat.label}</span>
                <span
                  style={{
                    background: "rgba(0,212,170,0.1)",
                    color: "#00d4aa",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  ↗ {stat.change}
                </span>
              </div>
              <div style={{ color: stat.color, fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-[#1a1a1a] md:grid-cols-2">
        <div className="border-b border-[#1a1a1a] p-4 sm:p-4 md:border-b-0 md:border-r md:border-[#1a1a1a] md:px-6 md:py-4">
          <div style={{ color: "#666", fontSize: 11, fontWeight: 600, marginBottom: 12 }}>TOP MARKETS</div>
          {countries.map((c) => (
            <div key={c.country} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{c.flag}</span>
              <span style={{ color: "#888", fontSize: 12, width: 110, flexShrink: 0 }}>{c.country}</span>
              <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 2, minWidth: 0 }}>
                <div style={{ width: `${c.bar}%`, height: 4, background: c.color, borderRadius: 2 }} />
              </div>
              <span style={{ color: "#00d4aa", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {c.revenue}
              </span>
            </div>
          ))}
        </div>
        <div className="p-4 sm:p-4 md:px-6 md:py-4">
          <div style={{ color: "#666", fontSize: 11, fontWeight: 600, marginBottom: 12 }}>DEMAND TREND</div>
          <div style={{ position: "relative", height: 100 }}>
            <svg width="100%" height={100} viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="marketTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c47ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6c47ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path
                d="M0 80 C50 75 80 60 120 50 C160 40 180 35 220 25 C250 18 280 10 300 5"
                fill="none"
                stroke="#6c47ff"
                strokeWidth={2.5}
              />
              <path
                d="M0 80 C50 75 80 60 120 50 C160 40 180 35 220 25 C250 18 280 10 300 5 L300 100 L0 100Z"
                fill="url(#marketTrendGrad)"
              />
              {(
                [
                  [0, 80],
                  [120, 50],
                  [220, 25],
                  [300, 5],
                ] as const
              ).map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4} fill="#6c47ff" stroke="#0c0c14" strokeWidth={2} />
              ))}
            </svg>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: "rgba(0,212,170,0.1)",
                border: "1px solid #00d4aa",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                color: "#00d4aa",
                fontWeight: 700,
              }}
            >
              ↗ Growing
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {(["Jan", "Mar", "Jun", "Now"] as const).map((m) => (
              <span key={m} style={{ color: "#444", fontSize: 10 }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              background: "rgba(0,212,170,0.15)",
              border: "1px solid #00d4aa",
              borderRadius: 10,
              padding: "8px 20px",
              color: "#00d4aa",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ✓ GO
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>High confidence — Launch this product</div>
            <div style={{ color: "#666", fontSize: 12 }}>Score 84/100 · Generated in 9.2 seconds</div>
          </div>
        </div>
        <Link
          href="/signup"
          className="inline-block shrink-0 rounded-[10px] font-semibold text-white no-underline transition hover:opacity-90"
          style={{ background: "#6c47ff", padding: "10px 20px", fontSize: 13 }}
        >
          Analyze My Product →
        </Link>
      </div>
    </div>
  );
}

const DEMO_ANGLES = {
  saturated: [
    { name: "Best massager 2025", saturation: 82 },
    { name: "Pain relief device", saturation: 74 },
  ],
  untapped: [
    { name: "Neck pain ruined my sleep", success: 94, hook: "I never realised neck pain was destroying my sleep until this.", script: "Hook: Show yourself waking up in pain. Then cut to using the device at night. End with waking up refreshed.", revenue: "$112K/mo", platform: "TikTok" },
    { name: "3 years of pain — gone", success: 91, hook: "3 years of chronic neck pain. Gone in one week. I wish I found this sooner.", script: "Hook: '3 years of doctors, pills, nothing worked.' Cut to unboxing. Show 7-day journey. Emotional close.", revenue: "$98K/mo", platform: "Meta" },
    { name: "My doctor was shocked", success: 88, hook: "My doctor asked what I was doing differently. I showed her this.", script: "Hook: Doctor's face reaction. Then explain the problem. Show product. End with doctor's quote.", revenue: "$84K/mo", platform: "TikTok" },
  ],
  emerging: [
    { name: "Office worker posture fix", success: 76 },
    { name: "Travel neck recovery", success: 72 },
  ],
} as const;

type DemoAngle = { name: string; success: number; hook: string; script: string; revenue: string; platform: string };

function FeatureTabAngles() {
  const [selected, setSelected] = useState<DemoAngle | null>(null);

  if (selected) {
    return (
      <div className="w-full" style={featureDashShell}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 12 }}>
          <ProdIqLogoImg preset="tab" />
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Angle Intelligence Map</span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            style={{ marginLeft: "auto", background: "transparent", border: "1px solid #222", borderRadius: 8, padding: "6px 14px", color: "#666", fontSize: 12, cursor: "pointer" }}
          >
            ← Back to Map
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ display: "inline-block", background: "#00d4aa22", color: "#00d4aa", fontSize: 10, fontWeight: 800, padding: "3px 12px", borderRadius: 20, marginBottom: 12, letterSpacing: 1 }}>UNTAPPED</div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 20, lineHeight: 1.4, marginBottom: 16 }}>
              &ldquo;{selected.hook}&rdquo;
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Success Rate", value: `${selected.success}%`, color: "#00d4aa" },
                { label: "Revenue Potential", value: selected.revenue, color: "#00d4aa" },
                { label: "Best Platform", value: selected.platform, color: "#f59e0b" },
                { label: "Saturation", value: "8%", color: "#6c47ff" },
              ].map((m, i) => (
                <div key={i} style={{ background: "#111", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                  <div style={{ color: m.color, fontWeight: 800, fontSize: i < 2 ? 20 : 15 }}>{m.value}</div>
                  <div style={{ color: "#555", fontSize: 10 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }} className="max-md:grid-cols-1">
            <div style={{ background: "#0c0c14", borderRadius: 14, border: "1px solid rgba(108,71,255,0.12)", padding: 20 }}>
              <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🎥 AD SCRIPT</div>
              <div style={{ color: "#888", fontSize: 13, lineHeight: 1.8 }}>{selected.script}</div>
            </div>
            <div style={{ background: "#0c0c14", borderRadius: 14, border: "1px solid rgba(108,71,255,0.12)", padding: 20 }}>
              <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🚀 HOW TO RUN THIS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { step: "1", title: "Hook", desc: selected.hook, color: "#6c47ff" },
                  { step: "2", title: "Platform", desc: `Launch on ${selected.platform}. $50/day, broad targeting.`, color: "#00d4aa" },
                  { step: "3", title: "Creative", desc: "UGC style. Show the problem in first 3 seconds. Emotion-sell always.", color: "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#111", borderRadius: 8, padding: "10px 12px", borderLeft: `3px solid ${s.color}` }}>
                    <div style={{ color: s.color, fontSize: 9, fontWeight: 700, marginBottom: 3 }}>STEP {s.step}: {s.title}</div>
                    <div style={{ color: "#888", fontSize: 11, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/signup"
            className="block w-full rounded-xl text-center font-bold text-white no-underline transition hover:opacity-90"
            style={{ background: "#6c47ff", padding: "14px 20px", fontSize: 14 }}
          >
            🚀 Launch Campaign With This Angle →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={featureDashShell}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ProdIqLogoImg preset="tab" />
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Angle Intelligence Map</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#00d4aa", fontWeight: 700 }}>
            3 Untapped ✓
          </div>
          <div style={{ background: "rgba(108,71,255,0.1)", border: "1px solid rgba(108,71,255,0.3)", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>
            7 angles found
          </div>
        </div>
      </div>

      {/* Mind map — hidden on very small screens */}
      <div className="hidden sm:block" style={{ padding: "12px 20px 8px", textAlign: "center" }}>
        <div style={{ color: "#555", fontSize: 12 }}>Click any angle to get the full strategy</div>
      </div>
      <div className="hidden sm:block" style={{ position: "relative", minHeight: 480, margin: "0 20px 12px" }}>
        {/* SVG connecting lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {/* Left lines (saturated) */}
          <line x1="50%" y1="50%" x2="15%" y2="30%" stroke="rgba(255,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="50%" y1="50%" x2="15%" y2="65%" stroke="rgba(255,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Right lines (untapped) */}
          <line x1="50%" y1="50%" x2="85%" y2="22%" stroke="rgba(0,212,170,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="50%" y1="50%" x2="85%" y2="50%" stroke="rgba(0,212,170,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="50%" y1="50%" x2="85%" y2="76%" stroke="rgba(0,212,170,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Bottom lines (emerging) */}
          <line x1="50%" y1="50%" x2="32%" y2="88%" stroke="rgba(108,71,255,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
          <line x1="50%" y1="50%" x2="68%" y2="88%" stroke="rgba(108,71,255,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
        </svg>

        {/* Legend */}
        <div style={{ position: "absolute", top: 4, left: 0, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[
            { color: "#ff6b6b", label: "Saturated" },
            { color: "#a78bfa", label: "Emerging" },
            { color: "#00d4aa", label: "Untapped ✓" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
              <span style={{ color: "#555", fontSize: 10 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Center product node */}
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 10 }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", background: "linear-gradient(135deg, #6c47ff, #a78bfa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(108,71,255,0.45)", border: "2px solid rgba(167,139,250,0.5)" }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>🎯</div>
            <div style={{ color: "white", fontSize: 9, fontWeight: 700, textAlign: "center", padding: "0 8px", lineHeight: 1.3 }}>
              Neck Massager
            </div>
          </div>
        </div>

        {/* SATURATED — left */}
        <div style={{ position: "absolute", left: "2%", top: "18%", width: "20%", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#ff6b6b", fontSize: 9, fontWeight: 700, letterSpacing: 1, textAlign: "center", marginBottom: 2 }}>SATURATED</div>
          {DEMO_ANGLES.saturated.map((a, i) => (
            <div key={i} style={{ background: "rgba(255,68,68,0.06)", border: "1px solid rgba(255,68,68,0.25)", borderRadius: 50, padding: "10px 10px", textAlign: "center" }}>
              <div style={{ color: "#ff6b6b", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{a.saturation}% sat.</div>
              <div style={{ color: "#888", fontSize: 9, lineHeight: 1.3 }}>{a.name}</div>
            </div>
          ))}
        </div>

        {/* UNTAPPED — right */}
        <div style={{ position: "absolute", right: "2%", top: "8%", width: "20%", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ color: "#00d4aa", fontSize: 9, fontWeight: 700, letterSpacing: 1, textAlign: "center", marginBottom: 2 }}>UNTAPPED ✓</div>
          {DEMO_ANGLES.untapped.map((a, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(a)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(a); } }}
              style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 50, padding: "10px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.15)"; e.currentTarget.style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.06)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <div style={{ color: "#00d4aa", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>{a.success}% success</div>
              <div style={{ color: "#aaa", fontSize: 9, lineHeight: 1.3 }}>{a.name}</div>
            </div>
          ))}
        </div>

        {/* EMERGING — bottom */}
        <div style={{ position: "absolute", bottom: "4%", left: "20%", right: "20%", display: "flex", gap: 10, justifyContent: "center" }}>
          {DEMO_ANGLES.emerging.map((a, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(108,71,255,0.06)", border: "1px solid rgba(108,71,255,0.3)", borderRadius: 50, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ color: "#a78bfa", fontSize: 10, fontWeight: 700, marginBottom: 2 }}>EMERGING</div>
              <div style={{ color: "#888", fontSize: 9, lineHeight: 1.3 }}>{a.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Untapped angle cards — always visible, extra prominent on mobile */}
      <div className="sm:border-t sm:border-[#1a1a1a]" style={{ padding: "0 20px 16px", paddingTop: 16 }}>
        <div style={{ color: "#555", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>✨ UNTAPPED ANGLES — Click to unlock full strategy</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {DEMO_ANGLES.untapped.map((a, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(a)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(a); } }}
              style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.1)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.05)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.2)"; }}
            >
              <div style={{ color: "#00d4aa", fontSize: 9, fontWeight: 800, marginBottom: 6, letterSpacing: 1 }}>UNTAPPED ANGLE {i + 1}</div>
              <div style={{ color: "white", fontSize: 12, fontStyle: "italic", lineHeight: 1.4, marginBottom: 8 }}>
                &ldquo;{a.hook}&rdquo;
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#555", fontSize: 10 }}>Success potential</span>
                <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 12 }}>{a.success}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: "#555", fontSize: 12 }}>7 angles found · 3 untapped · 2 emerging</span>
        <Link
          href="/signup"
          className="inline-block shrink-0 rounded-[10px] font-semibold text-white no-underline transition hover:opacity-90"
          style={{ background: "#6c47ff", padding: "10px 20px", fontSize: 13 }}
        >
          Find My Winning Angles →
        </Link>
      </div>
    </div>
  );
}

function FeatureTabCompetitor() {
  const competitorMockAds = [
    {
      img: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=300&h=280&fit=crop&q=80",
      brand: "NeckEase Pro",
      platform: "Meta",
      platformColor: "#1877f2",
      days: "21 days",
      ctr: "2.1% CTR",
      headline: "Finally fixed my neck pain after 3 years.",
      weakness: "No UGC",
    },
    {
      img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=280&fit=crop&q=80",
      brand: "CurlPro",
      platform: "TikTok",
      platformColor: "#010101",
      days: "14 days",
      ctr: "5.2M views",
      headline: "My hairdresser asked what brush I use.",
      weakness: "Weak CTA",
    },
    {
      img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=280&fit=crop&q=80",
      brand: "TimePiece Co",
      platform: "Meta",
      platformColor: "#1877f2",
      days: "30 days",
      ctr: "3.6% CTR",
      headline: "People keep asking where I got this.",
      weakness: "Static only",
    },
    {
      img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=280&fit=crop&q=80",
      brand: "ChefGadget",
      platform: "TikTok",
      platformColor: "#010101",
      days: "7 days",
      ctr: "8.1M views",
      headline: "I prep 5 meals in 10 minutes with this.",
      weakness: "No hook",
    },
    {
      img: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=280&fit=crop&q=80",
      brand: "GlowKit",
      platform: "Meta",
      platformColor: "#1877f2",
      days: "18 days",
      ctr: "4.1% CTR",
      headline: "Stopped buying from Sephora after this.",
      weakness: "Too long",
    },
    {
      img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=280&fit=crop&q=80",
      brand: "HydroFlow",
      platform: "TikTok",
      platformColor: "#010101",
      days: "12 days",
      ctr: "3.9M views",
      headline: "I finally drink 3L a day. This bottle did it.",
      weakness: "No proof",
    },
    {
      img: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=300&h=280&fit=crop&q=80",
      brand: "LedGlow",
      platform: "Meta",
      platformColor: "#1877f2",
      days: "9 days",
      ctr: "3.3% CTR",
      headline: "My dermatologist asked what I was doing.",
      weakness: "Weak angle",
    },
    {
      img: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=300&h=280&fit=crop&q=80",
      brand: "BlendGo",
      platform: "TikTok",
      platformColor: "#010101",
      days: "25 days",
      ctr: "11.2M views",
      headline: "Smoothie in 30 seconds anywhere I go.",
      weakness: "No UGC",
    },
  ] as const;

  return (
    <div className="pointer-events-none w-full select-none">
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          background: "#0c0c14",
          borderRadius: 20,
          border: "1px solid rgba(108,71,255,0.2)",
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            background: "#080810",
            padding: "12px 20px",
            borderBottom: "1px solid #1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
            </div>
            <div
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: 6,
                padding: "4px 16px",
                fontSize: 11,
                color: "#444",
              }}
            >
              prodiq.app/dashboard
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div
              style={{
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11,
                color: "#444",
              }}
            >
              ⊕ Import Ads
            </div>
            <div
              style={{
                background: "#6c47ff",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11,
                color: "white",
                fontWeight: 600,
              }}
            >
              ✦ Generate with AI
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#0a0a12",
            borderBottom: "1px solid #1a1a1a",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 0,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { label: "Ad Library", active: true, icon: "◎" },
              { label: "Their Angles", active: false, icon: "🎯" },
              { label: "My Generations", active: false, icon: "✦" },
              { label: "Weaknesses", active: false, icon: "⚠" },
            ] as const
          ).map((tab, i) => (
            <div
              key={i}
              style={{
                padding: "12px 18px",
                fontSize: 12,
                color: tab.active ? "#ffffff" : "#444",
                borderBottom: tab.active ? "2px solid #6c47ff" : "2px solid transparent",
                fontWeight: tab.active ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 6,
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: 11 }}>{tab.icon}</span>
              {tab.label}
              {tab.active && (
                <span
                  style={{
                    background: "#6c47ff22",
                    color: "#6c47ff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  24
                </span>
              )}
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, padding: "8px 0", flexWrap: "wrap" }}>
            <div
              style={{
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 10,
                color: "#444",
              }}
            >
              Platform ▾
            </div>
            <div
              style={{
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 10,
                color: "#444",
              }}
            >
              Engagement ▾
            </div>
            <div
              style={{
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 10,
                color: "#444",
              }}
            >
              Newest ▾
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 20px 8px", borderBottom: "1px solid #111" }}>
          <span style={{ color: "#444", fontSize: 11, fontWeight: 600 }}>
            Competitor ads running now — Neck Massager
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ padding: "16px 20px", gap: 12 }}>
          {competitorMockAds.map((ad, i) => (
            <div
              key={i}
              style={{
                background: "#080810",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #1a1a1a",
                userSelect: "none",
              }}
            >
              <div style={{ position: "relative", height: 160 }}>
                <img
                  src={ad.img}
                  alt={ad.brand}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    e.currentTarget.src = MASSAGER_IMG_FALLBACK;
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.85) 100%)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    background: ad.platformColor,
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 9,
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {ad.platform}
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(0,0,0,0.6)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {ad.days}
                </div>

                <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
                  <div
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      marginBottom: 4,
                    }}
                  >
                    {ad.headline}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
                    {ad.brand} · Sponsored
                  </div>
                </div>
              </div>

              <div style={{ padding: "8px 10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255,68,68,0.12)",
                      color: "#ff6b6b",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 10,
                    }}
                  >
                    ⚠ {ad.weakness}
                  </div>
                  <span style={{ color: "#00d4aa", fontSize: 10, fontWeight: 600 }}>{ad.ctr}</span>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <div
                    style={{
                      flex: 1,
                      background: "#111",
                      border: "1px solid #1a1a1a",
                      borderRadius: 5,
                      padding: "4px 0",
                      fontSize: 9,
                      color: "#555",
                      textAlign: "center",
                    }}
                  >
                    ↓ Download
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "rgba(108,71,255,0.1)",
                      border: "1px solid rgba(108,71,255,0.2)",
                      borderRadius: 5,
                      padding: "4px 0",
                      fontSize: 9,
                      color: "#6c47ff",
                      textAlign: "center",
                    }}
                  >
                    Generate Better
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #1a1a1a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            background: "#080810",
          }}
        >
          <span style={{ color: "#333", fontSize: 11 }}>
            24 competitor ads found · 8 weaknesses identified · Updated 2 hours ago
          </span>
          <div
            style={{
              background: "#6c47ff",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 12,
              color: "white",
              fontWeight: 600,
            }}
          >
            See My Competitor Intel →
          </div>
        </div>
      </div>
    </div>
  );
}

const CREATIVE_EXTRACTOR_ROTATIONS = [
  "-1.5deg",
  "1deg",
  "-0.8deg",
  "1.2deg",
  "-1deg",
  "0.8deg",
  "-0.5deg",
  "1.5deg",
] as const;

/** Top row — six winning creative references */
const topAdCreatives: readonly AdLib[] = [
  {
    image: "/ad-1.jpg",
    brand: "SilkBrush Co",
    headline: "My hairdresser asked what brush I bought.",
    platform: "TikTok",
    platformColor: "#010101",
    metric: "6.8M views",
  },
  {
    image: "/ad-2.jpg",
    brand: "PrepPro",
    headline: "I prep a week of meals in 10 minutes now.",
    platform: "Meta",
    platformColor: "#1877f2",
    metric: "4.1% CTR",
  },
  {
    image: "/ad-3.jpg",
    brand: "PulseWear",
    headline: "Everyone keeps asking where I got this.",
    platform: "Meta",
    platformColor: "#1877f2",
    metric: "3.6% CTR",
  },
  {
    image: "/ad-4.jpg",
    brand: "LumaSkin",
    headline: "My skin cleared in 14 days. No filters.",
    platform: "TikTok",
    platformColor: "#010101",
    metric: "9.2M views",
  },
  {
    image: "/ad-5.jpg",
    brand: "Noir Mist",
    headline: "I got 3 compliments on my first day wearing this.",
    platform: "Meta",
    platformColor: "#1877f2",
    metric: "5.2% CTR",
  },
  {
    image: "/ad-6.jpg",
    brand: "HydroSip",
    headline: "I finally drink 3 liters a day. This bottle changed it.",
    platform: "TikTok",
    platformColor: "#010101",
    metric: "7.4M views",
  },
];

function AdLibraryGrid({
  items,
  gridClassName,
  rotOffset = 0,
  className = "mt-12",
}: {
  items: readonly AdLib[];
  gridClassName: string;
  rotOffset?: number;
  className?: string;
}) {
  return (
    <div className={`mx-auto grid max-w-[1200px] ${gridClassName} ${className}`} style={{ gap: 16 }}>
      {items.map((ad, i) => {
        const rot = CREATIVE_EXTRACTOR_ROTATIONS[(i + rotOffset) % CREATIVE_EXTRACTOR_ROTATIONS.length];
        return (
          <div
            key={`${ad.brand}-${i}`}
            style={{
              width: "100%",
              transform: `rotate(${rot})`,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: "pointer",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "rotate(0deg) scale(1.04)";
              e.currentTarget.style.boxShadow = "0 24px 48px rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${rot})`;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid #1a1a1a",
                background: "#0a0a0a",
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ position: "relative", width: "100%" }}>
                <div style={{ width: "100%", overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
                  <img
                    src={ad.image}
                    alt={ad.brand}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: ad.platformColor,
                    borderRadius: "5px",
                    padding: "3px 9px",
                    fontSize: "10px",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {ad.platform}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    right: "0",
                    padding: "16px 14px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#ffffff",
                      fontWeight: 800,
                      lineHeight: 1.3,
                      marginBottom: "8px",
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {ad.headline}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 600,
                      }}
                    >
                      {ad.brand} · Sponsored
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        fontSize: "10px",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {ad.metric}
                    </div>
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "10px 14px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6c47ff",
                    border: "1px solid rgba(108,71,255,0.4)",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    fontWeight: 500,
                  }}
                >
                  Download ↓
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#333",
                    fontWeight: 500,
                  }}
                >
                  Use as inspiration →
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SAVE_CARDS = [
  { icon: "📊", title: "Demand Forecasting", desc: "Know if demand is growing before you invest a single dollar" },
  { icon: "🚫", title: "Saturation Detection", desc: "Avoid markets that are already dead and oversaturated" },
  { icon: "💰", title: "Profit Calculator", desc: "See your exact margins, break-even ROAS, and recommended price" },
  { icon: "🔮", title: "Trend Prediction", desc: "Spot winning products before they go viral and competition floods in" },
] as const;

const HERO_ATMOSPHERE: CSSProperties = {
  background: `
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,71,255,0.35) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 20%, rgba(30,27,75,0.5) 0%, transparent 55%),
    radial-gradient(ellipse 45% 35% at 10% 30%, rgba(15,23,42,0.7) 0%, transparent 50%),
    #0a0a0a
  `,
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        .ad-creative-mockup {
          transform: rotate(var(--ad-rot));
          transition: transform 0.25s ease;
        }
        .ad-creative-mockup:hover {
          transform: rotate(0deg) scale(1.04);
        }
        .landing-float-up {
          animation: floatUp 0.85s ease forwards;
        }
        .landing-glow-dot {
          animation: glowPulse 2.5s ease-in-out infinite;
        }
        .landing-sweep-line {
          position: relative;
          overflow: hidden;
        }
        .landing-sweep-line::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 24%;
          height: 2px;
          margin-top: -1px;
          background: linear-gradient(90deg, transparent, rgba(108,71,255,0.9), transparent);
          animation: lightSweep 4s ease-in-out infinite;
        }
        @keyframes landingTabFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .landing-tab-fade {
          animation: landingTabFadeIn 0.38s ease forwards;
        }
      `}</style>

      {/* SECTION 2 — HERO */}
      <style>{`
        /* Single purple light — left diamond clockwise (perimeter 1280) */
        @keyframes borderDotLeft {
          from { stroke-dashoffset: 1280; }
          to   { stroke-dashoffset: 0; }
        }
        /* Single purple light — right diamond counter-clockwise (perimeter 1120) */
        @keyframes borderDotRight {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -1120; }
        }
      `}</style>
      <section className="relative overflow-hidden px-4 pb-[60px] pt-[120px] sm:pb-[100px] sm:pt-[160px]" style={HERO_ATMOSPHERE}>
        {/* Left diamond — single purple light */}
        <div
          className="pointer-events-none absolute left-[-15%] top-[20%] h-[320px] w-[320px] rotate-45 opacity-80 sm:left-[-8%]"
          style={{ background: "rgba(108,71,255,0.08)", border: "1px solid rgba(108,71,255,0.18)", position: "absolute" }}
          aria-hidden
        >
          <svg viewBox="0 0 320 320" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} aria-hidden>
            <rect x="0" y="0" width="320" height="320" fill="none"
              stroke="rgba(108,71,255,0.35)" strokeWidth="6" strokeDasharray="40 1240" strokeLinecap="round"
              style={{ animation: "borderDotLeft 8s linear infinite" }} />
            <rect x="0" y="0" width="320" height="320" fill="none"
              stroke="rgba(140,100,255,0.95)" strokeWidth="2" strokeDasharray="18 1262" strokeLinecap="round"
              style={{ animation: "borderDotLeft 8s linear infinite" }} />
          </svg>
        </div>
        {/* Right diamond — single purple light (counter-clockwise, slightly slower) */}
        <div
          className="pointer-events-none absolute right-[-18%] top-[35%] h-[280px] w-[280px] rotate-45 opacity-80 sm:right-[-10%]"
          style={{ background: "rgba(108,71,255,0.08)", border: "1px solid rgba(108,71,255,0.18)", position: "absolute" }}
          aria-hidden
        >
          <svg viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} aria-hidden>
            <rect x="0" y="0" width="280" height="280" fill="none"
              stroke="rgba(108,71,255,0.35)" strokeWidth="6" strokeDasharray="36 1084" strokeLinecap="round"
              style={{ animation: "borderDotRight 11s linear infinite" }} />
            <rect x="0" y="0" width="280" height="280" fill="none"
              stroke="rgba(140,100,255,0.95)" strokeWidth="2" strokeDasharray="16 1104" strokeLinecap="round"
              style={{ animation: "borderDotRight 11s linear infinite" }} />
          </svg>
        </div>
        <div className="relative z-[1] mx-auto flex max-w-[900px] flex-col items-center text-center">
          <div className="landing-float-up flex w-full justify-center">
            <ProdIqBrandLogo variant="hero" />
          </div>
          <div className="landing-float-up mb-6 flex justify-center">
            <AnimatedBadge text="✦ AI-Powered Product Intelligence" />
          </div>
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 76px)",
              fontWeight: 900,
              lineHeight: 1.15,
              textAlign: "center",
              maxWidth: "900px",
              margin: "0 auto",
            }}
          >
            <span style={{ color: "#ffffff", display: "block" }}>Stop guessing.</span>
            <span style={{ color: "#ffffff", display: "block" }}>Start winning.</span>
            <span style={{ color: "#6c47ff", display: "block" }}>Before you lose money.</span>
          </h1>
          <p
            className="landing-float-up mx-auto text-[#888888] sm:mt-5"
            style={{
              fontSize: 18,
              maxWidth: 580,
              marginTop: 20,
            }}
          >
            Upload any product. We search the entire market, find untapped angles, analyze competitors, and hand you a
            complete launch plan — in seconds.
          </p>
          <div className="landing-float-up mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <PlainPurpleLink href="/signup">Analyze My First Product →</PlainPurpleLink>
            <SeeExampleButton />
          </div>
          <p className="mt-3 text-center text-xs text-[#888888] sm:mt-3" style={{ marginTop: 12 }}>
            1 free analysis · No credit card needed
          </p>
          <div className="w-full max-w-[1000px]">
            <AnimatedStats />
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURE TABS */}
      <section
        id="features"
        className="relative overflow-hidden px-4 py-16 sm:py-24"
        style={HERO_ATMOSPHERE}
      >
        <div className="mx-auto max-w-[1100px]">
          <div
            className="mx-auto mb-10 flex max-w-full gap-1 overflow-x-auto rounded-[50px] border border-[#222222] bg-[#111111] p-1 sm:justify-center"
            style={{ padding: 4 }}
          >
            {(["Market Research", "Angle Discovery", "Competitor Takedown"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(i)}
                className="shrink-0 rounded-[50px] px-4 py-2.5 text-sm transition sm:px-5"
                style={{
                  background: activeTab === i ? "#6c47ff" : "transparent",
                  color: activeTab === i ? "#fff" : "#666666",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div key={activeTab} className="landing-tab-fade">
            {activeTab === 0 ? <FeatureTabMarket /> : activeTab === 1 ? <FeatureTabAngles /> : <FeatureTabCompetitor />}
          </div>
        </div>
      </section>

      {/* SECTION 4 — DATA SOURCES (Madgicx-style) */}
      <section className="bg-[#050505]" style={{ background: "#050505" }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <svg width="80" height="52" viewBox="0 0 80 52" fill="none" aria-hidden className="mx-auto">
              <text
                x="40"
                y="40"
                textAnchor="middle"
                fill="white"
                style={{ fontSize: 44, fontWeight: 300, fontFamily: "system-ui, sans-serif" }}
              >
                ∞
              </text>
            </svg>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>Meta</div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 4,
                color: "#ffffff",
                fontWeight: 600,
                textTransform: "uppercase",
                marginTop: 10,
              }}
            >
              BUSINESS PARTNER
            </div>
          </div>

          <GlowDivider />

          <div
            className="mx-auto flex max-w-[1200px] flex-wrap justify-center"
            style={{ justifyContent: "center", gap: 56 }}
          >
            {DATA_SOURCE_LOGOS_HERO.map((src) => (
              <div
                key={src.name}
                className="flex flex-col items-center"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {src.svg}
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 500,
                    opacity: 0.7,
                  }}
                >
                  {src.name}
                </span>
              </div>
            ))}
          </div>

          <GlowDivider />
        </div>
      </section>

      {/* SECTION 5 — MASTER AI */}
      <section
        id="master-intel"
        className="relative px-4 py-20 sm:py-28"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(108,71,255,0.2) 0%, transparent 70%), #0a0a0a",
        }}
      >
        <div className="mx-auto max-w-[900px] text-center">
          <div className="mb-6 flex justify-center">
            <PlainBadge text="⚡ AI Platform" />
          </div>
          <h2 className="text-[clamp(1.75rem,4vw,3.25rem)] font-bold leading-tight">Master AI Market Intelligence</h2>
          <p className="mx-auto mt-4 max-w-[600px] text-[#888888]" style={{ fontSize: "clamp(0.9rem,2.5vw,1rem)" }}>
            We do not just validate your product. We find the exact angles your competitors are missing, extract real
            customer psychology, and hand you a ready-to-launch plan — in seconds.
          </p>
        </div>
        <div className="relative mx-auto mt-16 flex max-w-[520px] flex-col items-center">
          <svg viewBox="0 0 280 200" className="w-full max-w-[320px]" aria-hidden>
            <path
              d="M 40 160 A 100 100 0 0 1 240 160"
              fill="none"
              stroke="url(#gradPurp)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 55 150 A 85 85 0 0 1 225 150"
              fill="none"
              stroke="url(#gradCyan)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 70 142 A 70 70 0 0 1 210 142"
              fill="none"
              stroke="url(#gradPink)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradPurp" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6c47ff" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <linearGradient id="gradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="gradPink" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="absolute left-1/2 top-[52%] flex h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0d0d0d]"
            style={{ boxShadow: "0 0 40px rgba(108,71,255,0.15)" }}
          >
            <ProdIqLogoImg />
          </div>
          <div className="absolute left-0 top-[28%] hidden text-left text-xs text-[#a78bfa] sm:block">
            <span className="text-[#6c47ff]">●</span> Market Analysis
          </div>
          <div className="absolute right-0 top-[32%] hidden text-right text-xs text-[#67e8f9] sm:block">
            <span className="text-cyan-400">●</span> Angle Detection
          </div>
          <div className="absolute bottom-[8%] left-1/2 hidden -translate-x-1/2 text-xs text-pink-300 sm:block">
            <span className="text-pink-400">●</span> Creative Intel
          </div>
        </div>
        <div className="mx-auto mt-10 flex flex-wrap justify-center gap-3">
          {[
            { t: "Demand 84", c: "#6c47ff" },
            { t: "Saturation Low", c: "#00d4aa" },
            { t: "Trend ↑ Growing", c: "#a78bfa" },
          ].map((p) => (
            <span
              key={p.t}
              className="rounded-full border border-[#222222] bg-[#111111] px-4 py-2 text-sm font-medium text-white"
              style={{ borderColor: `${p.c}44` }}
            >
              {p.t}
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 6 — VERDICT */}
      <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-4 inline-flex justify-start">
              <PlainBadge text="🎯 Personalized Analysis" />
            </div>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.5rem)] font-bold leading-tight">
              Get your complete product launch plan
            </h2>
            <p className="mt-4 text-base leading-[1.7] text-[#888888] sm:text-[16px]">
              Upload any product. Our AI searches Amazon reviews, Reddit discussions, TikTok trends, and competitor ads
              to give you a full launch strategy — not just a score.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#cccccc] sm:text-base">
              {[
                "Go or No-Go verdict with reasoning",
                "Untapped angles your competitors haven't found",
                "Emotional hooks that make customers buy",
                "Competitor weaknesses you can exploit immediately",
                "Ready-to-use ad scripts for Meta and TikTok",
                "Profit calculator with break-even ROAS",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-[#6c47ff]">✓</span>
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <AnimatedButton href="/signup" text="Get My Verdict →" />
            </div>
          </div>
          <div
            className="mx-auto w-full lg:mx-0"
            style={{
              background: "#0d0d0d",
              border: "1px solid #1a1a1a",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "420px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: "16px" }}>Portable Neck Massager</div>
                <div style={{ color: "#888", fontSize: "12px", marginTop: "2px" }}>Analyzed in 8.3 seconds</div>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  background: "#00d4aa22",
                  border: "1px solid #00d4aa",
                  borderRadius: "8px",
                  padding: "4px 12px",
                  color: "#00d4aa",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                GO
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div style={{ background: "#111", borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>DEMAND SCORE</div>
                <div style={{ color: "#6c47ff", fontWeight: 800, fontSize: "22px" }}>84/100</div>
              </div>
              <div style={{ background: "#111", borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>MARKET SIZE</div>
                <div style={{ color: "#00d4aa", fontWeight: 800, fontSize: "22px" }}>$2.3B</div>
              </div>
              <div style={{ background: "#111", borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>COMPETITORS</div>
                <div style={{ color: "white", fontWeight: 800, fontSize: "22px" }}>24</div>
              </div>
              <div style={{ background: "#111", borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: "#888", fontSize: "10px", marginBottom: "4px" }}>TREND</div>
                <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: "18px" }}>↑ Growing</div>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: "10px", padding: "14px", marginBottom: "10px" }}>
              <div style={{ color: "#888", fontSize: "10px", marginBottom: "10px", fontWeight: 600 }}>WINNING ANGLES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: "#00d4aa22",
                      color: "#00d4aa",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    UNTAPPED
                  </span>
                  <span style={{ color: "white", fontSize: "12px", fontStyle: "italic" }}>
                    I never knew neck pain was ruining my sleep.
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: "#f59e0b22",
                      color: "#f59e0b",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    EMERGING
                  </span>
                  <span style={{ color: "white", fontSize: "12px", fontStyle: "italic" }}>
                    Fixed my pain after 3 years of trying everything.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: "#111", borderRadius: "10px", padding: "14px" }}>
              <div style={{ color: "#888", fontSize: "10px", marginBottom: "8px", fontWeight: 600 }}>TOP COUNTRIES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { flag: "🇺🇸", country: "United States", width: "90%", color: "#6c47ff" },
                  { flag: "🇬🇧", country: "United Kingdom", width: "70%", color: "#6c47ff" },
                  { flag: "🇩🇪", country: "Germany", width: "55%", color: "#6c47ff" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px" }}>{c.flag}</span>
                    <span style={{ color: "#888", fontSize: "11px", width: "100px" }}>{c.country}</span>
                    <div style={{ flex: 1, height: "4px", background: "#222", borderRadius: "2px" }}>
                      <div
                        style={{
                          width: c.width,
                          height: "4px",
                          background: c.color,
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CREATIVE EXTRACTOR */}
      <section id="creative-extractor" className="bg-[#050505] px-4 py-16 sm:py-24">
        <h2 className="text-center text-[clamp(1.75rem,4vw,3rem)] font-bold">
          See what is working. Copy what converts.
        </h2>
        <p className="mx-auto mt-4 max-w-[640px] text-center text-[#888888]">
          Extract every ad your competitors are running. Download their creatives. Launch yours with AI in one click.
        </p>
        <AdLibraryGrid
          items={topAdCreatives}
          gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
          rotOffset={0}
        />
      </section>

      {/* SECTION 8 — SAVE */}
      <section
        className="px-4 py-16 sm:py-24"
        style={{
          background: "radial-gradient(ellipse 70% 40% at 50% 50%, rgba(108,71,255,0.15) 0%, transparent 60%), #0a0a0a",
        }}
      >
        <h2 className="text-center text-[clamp(1.75rem,4vw,3rem)] font-bold">AI Product Intelligence</h2>
        <p className="text-center text-[clamp(1.75rem,4vw,3rem)] font-bold">That Will Save Your A$$</p>
        <p className="mx-auto mt-4 max-w-[500px] text-center text-[#888888]">
          Stop burning money on products that flop. Start launching with data, psychology, and a plan.
        </p>
        <div className="mx-auto mt-12 grid max-w-[900px] gap-4 sm:grid-cols-2">
          {SAVE_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-7 transition-colors duration-200 hover:border-[#6c47ff]"
              style={{ borderRadius: 16, padding: 28 }}
            >
              <div className="mb-3 text-[28px]">{card.icon}</div>
              <h3 className="text-base font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#888888]">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9 — REVIEWS */}
      <section className="bg-[#050505] px-4 py-16 sm:py-24">
        <div className="mb-6 flex justify-center">
          <PlainBadge text="👥 Our customers" />
        </div>
        <h2 className="text-center text-[clamp(1.5rem,3.5vw,2.625rem)] font-bold">
          But you don&apos;t have to take our word for it
        </h2>
        <p style={{ color: "#555", fontSize: "16px", textAlign: "center", marginBottom: "20px" }}>
          Trusted by 120,000+ active sellers worldwide
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: "36px", letterSpacing: "-1px" }}>120,000+</div>
            <div style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>Active Sellers</div>
          </div>
          <div style={{ width: "1px", height: "40px", background: "#1a1a1a" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: "36px", letterSpacing: "-1px" }}>$2M+</div>
            <div style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>Saved on Bad Products</div>
          </div>
          <div style={{ width: "1px", height: "40px", background: "#1a1a1a" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: "36px", letterSpacing: "-1px" }}>4.9/5</div>
            <div style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>Average Rating</div>
          </div>
          <div style={{ width: "1px", height: "40px", background: "#1a1a1a" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: "36px", letterSpacing: "-1px" }}>50+</div>
            <div style={{ color: "#555", fontSize: "13px", marginTop: "4px" }}>Countries Reached</div>
          </div>
        </div>
        <div className="mx-auto grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" style={{ maxWidth: "1100px" }}>
          {reviewers.map((reviewer) => (
            <div
              key={reviewer.name + reviewer.date}
              className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6"
              style={{ borderRadius: 16, padding: 24 }}
            >
              <div
                className="flex flex-row items-center"
                style={{ gap: 12, width: "100%" }}
              >
                <img
                  src={reviewer.avatar}
                  alt={reviewer.name}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    border: "2px solid rgba(108,71,255,0.3)",
                    flexShrink: 0,
                    display: "block",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{reviewer.name}</p>
                  <p style={{ fontSize: 12, color: "#888888" }}>{reviewer.role}</p>
                </div>
                <span style={{ color: "#FFD700", flexShrink: 0, fontSize: 14, letterSpacing: 1 }}>
                  {"★".repeat(reviewer.stars)}
                </span>
              </div>
              <p className="mt-4 text-[14px] italic leading-[1.7] text-white">&ldquo;{reviewer.review}&rdquo;</p>
              <p className="mt-4 text-xs text-[#888888]">{reviewer.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA */}
      <section className="relative overflow-hidden px-4 py-[80px] sm:py-[120px]" style={HERO_ATMOSPHERE}>
        <div
          className="pointer-events-none absolute left-[-10%] top-[30%] h-[240px] w-[240px] rotate-45 opacity-70"
          style={{ background: "rgba(108,71,255,0.08)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[-12%] bottom-[20%] h-[220px] w-[220px] rotate-45 opacity-70"
          style={{ background: "rgba(108,71,255,0.08)" }}
          aria-hidden
        />
        <div id="final-cta" className="relative z-[1] mx-auto max-w-[720px] text-center">
          <p className="mb-4 text-base text-[#888888]">You scrolled this far.</p>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight">You already know you need this.</h2>
          <p className="mt-4 text-lg text-[#888888]">Stop losing money on products that flop.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <AnimatedButton href="/signup" text="Start For Free →" />
            <Link
              href="/pricing"
              className="rounded-[20px] border border-[#333333] px-6 py-2.5 text-sm text-[#888888] transition hover:border-[#444444] hover:text-white sm:py-3 sm:text-base"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#888888]">1 free analysis · No credit card · Cancel anytime</p>
        </div>
      </section>
    </main>
  );
}
