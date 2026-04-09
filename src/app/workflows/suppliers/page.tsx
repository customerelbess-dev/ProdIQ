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

const TRUST_STATS = [
  { k: "500+", v: "Vetted suppliers" },
  { k: "48h", v: "Average sample time" },
  { k: "95%", v: "On-time delivery rate" },
  { k: "$0", v: "Hidden fees" },
] as const;

const SUPPLIER_PERKS = [
  {
    icon: "🏭",
    title: "Factory-Direct Pricing",
    desc: "Skip the middlemen. Every supplier in our network is a verified manufacturer, not a reseller. You pay factory price, every time.",
  },
  {
    icon: "⚡",
    title: "Blazing Fast Samples",
    desc: "Most of our partners dispatch samples within 48 hours. You test the product before you commit to a single unit of inventory.",
  },
  {
    icon: "🔒",
    title: "Pre-Vetted & Verified",
    desc: "Every supplier has passed our 14-point audit — factory visit, certifications, payment terms, and production capacity.",
  },
  {
    icon: "🌍",
    title: "Global Shipping Ready",
    desc: "All suppliers ship worldwide with DDP and DHL Express options. Full tracking from factory door to your customer.",
  },
  {
    icon: "💬",
    title: "English-Speaking Contacts",
    desc: "No language barriers. Every supplier has a dedicated English-speaking account manager assigned to your order.",
  },
  {
    icon: "📦",
    title: "Low MOQ Friendly",
    desc: "Start small, scale fast. We only work with suppliers who accept low minimum order quantities so you can test risk-free.",
  },
] as const;

const HOW_IT_WORKS = [
  { step: "01", title: "Upload your product", desc: "Image, link, or description — ProdIQ identifies what you want to source." },
  { step: "02", title: "We match you instantly", desc: "Our system finds the top 3–5 manufacturers already producing this exact product." },
  { step: "03", title: "Get introduced", desc: "You receive direct contact details, pricing sheets, and MOQ terms — no waiting." },
  { step: "04", title: "Order with confidence", desc: "Request samples, negotiate, and place your order backed by our supplier guarantee." },
] as const;

export default function SuppliersWorkflowPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:pb-28 sm:pt-16" style={HERO_ATMOSPHERE}>
        <div className="relative z-[1] mx-auto max-w-[900px] text-center">
          <div className="mb-6 flex justify-center">
            <WorkflowBadge text="🤝 World-Class Suppliers" />
          </div>
          <h1 className="mx-auto max-w-[750px] font-bold leading-[1.12] text-white" style={{ fontSize: 52 }}>
            The best suppliers in the world.{" "}
            <span className="text-[#6c47ff]">Ready for your product.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-[580px] text-[#888888]"
            style={{ fontSize: 17, lineHeight: 1.55 }}
          >
            We spent years building relationships with the most reliable manufacturers on the planet so
            you don&apos;t have to. The best prices, the fastest turnaround, and zero headaches.
          </p>
          {/* Trust stats */}
          <div className="mx-auto mt-8 flex max-w-[720px] flex-wrap justify-center gap-3 sm:gap-4">
            {TRUST_STATS.map((p) => (
              <div
                key={p.k}
                className="rounded-full border border-[#6c47ff]/35 bg-[#6c47ff]/10 px-4 py-2.5 text-left sm:px-5"
              >
                <p className="text-lg font-black tabular-nums text-white">{p.k}</p>
                <p className="text-[11px] text-[#a78bfa]">{p.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <AnimatedButton href="/signup" text="Find My Supplier →" />
          </div>
        </div>
      </section>

      {/* Why our suppliers */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Why our supplier network is different
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] text-center text-sm text-[#888888]">
          We don&apos;t list anyone. Every supplier earns their place.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPLIER_PERKS.map((perk) => (
            <div
              key={perk.title}
              className="rounded-2xl p-6 sm:p-7"
              style={{
                background: "#0c0c14",
                border: "1px solid #1a1a1a",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(108,71,255,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a";
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{
                  background: "linear-gradient(160deg, rgba(108,71,255,0.3), rgba(10,10,10,0.9))",
                  border: "1px solid rgba(108,71,255,0.2)",
                }}
              >
                {perk.icon}
              </div>
              <p className="mt-4 text-[15px] font-bold text-white">{perk.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#888888]">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#141414] bg-[#050505] px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">From product idea to supplier in minutes</h2>
        <div className="mx-auto mt-12 grid max-w-[900px] gap-0">
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={item.step}
              className="flex gap-6 pb-10"
              style={{ borderLeft: i < HOW_IT_WORKS.length - 1 ? "2px solid #1a1a1a" : "2px solid transparent", marginLeft: 20, paddingLeft: 28, position: "relative" }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -18,
                  top: 0,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div style={{ paddingTop: 4 }}>
                <p className="text-[15px] font-bold text-white">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#888888]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust banner */}
      <section className="mx-auto max-w-[1100px] px-4 py-16 sm:px-6 sm:py-20">
        <div
          className="rounded-2xl p-8 sm:p-12"
          style={{
            background: "linear-gradient(135deg, rgba(108,71,255,0.12) 0%, rgba(0,212,170,0.06) 100%)",
            border: "1px solid rgba(108,71,255,0.2)",
          }}
        >
          <div className="mx-auto max-w-[700px] text-center">
            <div className="mb-4 text-3xl">🔒</div>
            <h3 className="text-xl font-bold text-white sm:text-2xl">Your sourcing is protected</h3>
            <p className="mt-4 text-sm leading-relaxed text-[#888888]">
              Every supplier comes with a ProdIQ sourcing guarantee. If a manufacturer fails to deliver on
              quality, timeline, or terms — we step in. We have handled thousands of introductions and
              our network has a 98.4% satisfaction rate.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {[
                { label: "Quality guarantee", color: "#00d4aa" },
                { label: "On-time commitment", color: "#6c47ff" },
                { label: "Dedicated support", color: "#f59e0b" },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="rounded-full px-4 py-2 text-xs font-semibold"
                  style={{
                    background: `${tag.color}18`,
                    border: `1px solid ${tag.color}44`,
                    color: tag.color,
                  }}
                >
                  ✓ {tag.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:py-28"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(108,71,255,0.18) 0%, transparent 70%), #0a0a0a",
        }}
      >
        <div className="relative z-[1] mx-auto max-w-[640px] text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Source smarter, not harder</h2>
          <p className="mt-2 text-sm text-[#888888]">
            Upload your product and we will match you with the right supplier today.
          </p>
          <div className="mt-8 flex justify-center">
            <AnimatedButton href="/signup" text="Find My Supplier →" />
          </div>
          <p className="mt-3 text-xs text-[#888888]">1 free analysis · No credit card needed</p>
        </div>
      </section>
    </main>
  );
}
