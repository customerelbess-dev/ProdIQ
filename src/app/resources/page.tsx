import Link from "next/link";
import { DATA_SOURCE_BLURBS, DATA_SOURCE_LOGOS_RESOURCES } from "@/components/data-source-logos";
import { ProdIqLogoImg } from "@/components/ProdIqLogoImg";

const CAPABILITIES = [
  "Real-time market scanning",
  "Customer psychology extraction",
  "Angle saturation detection",
  "Competitor weakness analysis",
  "Profit potential scoring",
] as const;

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <style>{`
        .resources-source-icon svg {
          width: 40px;
          height: 40px;
          display: block;
        }
      `}</style>
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <header className="mx-auto max-w-[700px] text-center">
          <h1 className="text-[clamp(1.5rem,5vw,48px)] font-bold leading-tight text-white">
            Powered by the most powerful data sources on the internet.
          </h1>
          <p className="mx-auto mt-5 max-w-[560px] text-base text-[#888888] sm:text-lg">
            50+ live sources in one scan — market intelligence in seconds, not weeks.
          </p>
        </header>

        <section className="mx-auto mt-16 max-w-[900px]">
          <div
            className="rounded-[20px] p-[1px]"
            style={{
              background: "linear-gradient(135deg, rgba(108,71,255,0.85), rgba(108,71,255,0.15), rgba(167,139,250,0.4))",
              boxShadow: "0 0 60px rgba(108,71,255,0.2)",
            }}
          >
            <div className="rounded-[19px] bg-[#0d0d0d] px-6 py-8 sm:px-10 sm:py-10">
              <h2 className="text-xl font-bold text-white sm:text-2xl">ProdIQ AI — The Brain Behind Everything</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[#aaaaaa] sm:text-base">
                Our proprietary AI model is trained on millions of product launches, ad campaigns, and market trends. It
                does not just show you data — it interprets it, finds patterns humans miss, and tells you exactly what
                to do.
              </p>
              <ul className="mt-8 space-y-3">
                {CAPABILITIES.map((c) => (
                  <li key={c} className="flex gap-3 text-[15px] text-[#cccccc]">
                    <span className="text-[#6c47ff]">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="mb-10 text-center text-2xl font-bold text-white">Data sources</h2>
          <div
            className="resources-data-grid mx-auto grid max-w-[1040px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            style={{ gap: 40 }}
          >
            {DATA_SOURCE_LOGOS_RESOURCES.map((src) => (
              <div key={src.name} className="flex flex-col items-center text-center">
                <div className="resources-source-icon flex items-center justify-center text-white">{src.svg}</div>
                <p className="mt-4 text-white" style={{ fontSize: 14, fontWeight: 600 }}>
                  {src.name}
                </p>
                <p className="mt-1 max-w-[200px] text-[#888888]" style={{ fontSize: 12, lineHeight: 1.35 }}>
                  {DATA_SOURCE_BLURBS[src.name] ?? ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Our partnerships</h2>
          <div className="mx-auto mt-10 grid max-w-[800px] grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-16">
            <div className="flex flex-col items-center text-center">
              <svg width="80" height="56" viewBox="0 0 100 72" fill="none" aria-hidden className="text-white">
                <text
                  x="50"
                  y="52"
                  textAnchor="middle"
                  fill="currentColor"
                  style={{ fontSize: 52, fontWeight: 300, fontFamily: "system-ui, sans-serif" }}
                >
                  ∞
                </text>
              </svg>
              <h3 className="mt-3 text-lg font-bold text-white">Meta Business Partner</h3>
              <p className="mt-2 text-sm text-[#888888]">Official Ads Library access for competitor creatives.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <ProdIqLogoImg />
              <h3 className="mt-3 text-lg font-bold text-white">ProdIQ proprietary AI</h3>
              <p className="mt-2 text-sm text-[#888888]">Every source fused into one report in under 10 seconds.</p>
            </div>
          </div>
        </section>

        <section id="trusted-suppliers" className="mt-24">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ background: "rgba(108,71,255,0.1)", border: "1px solid rgba(108,71,255,0.3)", borderRadius: "20px", padding: "4px 16px", display: "inline-block", color: "#a78bfa", fontSize: "12px", fontWeight: 700, marginBottom: "16px", letterSpacing: "1px" }}>
              🔒 PRO &amp; AGENCY EXCLUSIVE
            </div>
            <h2 style={{ color: "white", fontWeight: 900, fontSize: "36px", marginBottom: "10px" }}>
              Private Supplier Network
            </h2>
            <p style={{ color: "#555", fontSize: "15px", maxWidth: "520px", margin: "0 auto", lineHeight: 1.7 }}>
              Hand-picked suppliers who have worked with 7-figure brands. Not available anywhere else.
            </p>
          </div>

          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {[
              {
                name: "Snacky",
                phone: "+86 173 7921 1675",
                whatsapp: "8617379211675",
                emoji: "⚡",
                color: "#6c47ff",
                tagline: "Speed & Reliability Specialist",
                description: "Snacky has sourced products for brands doing over 7 figures in annual revenue. Known for extremely fast response times, honest pricing, and zero hidden fees. Whether you need 10 units to test or 10,000 to scale — Snacky handles both with the same level of attention.",
                specialties: ["Electronics & Gadgets", "Health & Wellness", "Home & Kitchen", "Beauty & Skincare", "Pet Products", "Sports & Fitness"],
                stats: [
                  { label: "Response Time", value: "<2 hours" },
                  { label: "Experience", value: "8+ years" },
                  { label: "Brands Served", value: "200+" },
                  { label: "Avg Rating", value: "4.9/5" },
                ],
              },
              {
                name: "Tina",
                phone: "+86 150 1290 3848",
                whatsapp: "8615012903848",
                emoji: "💎",
                color: "#00d4aa",
                tagline: "Premium Quality & Scaling Expert",
                description: "Tina specializes in working with serious ecom operators who are ready to scale. She manages sourcing for multiple 7-figure DTC brands and brings that same level of service to every client. Known for finding the best quality at the most competitive prices.",
                specialties: ["DTC Brands", "Private Label", "Dropshipping", "Amazon FBA", "TikTok Shop", "Shopify Stores"],
                stats: [
                  { label: "Response Time", value: "<4 hours" },
                  { label: "Experience", value: "10+ years" },
                  { label: "Brands Served", value: "350+" },
                  { label: "Avg Rating", value: "5.0/5" },
                ],
              },
            ].map((supplier, i) => (
              <div
                key={i}
                style={{
                  background: "#0c0c14",
                  borderRadius: "24px",
                  border: `1px solid ${supplier.color}33`,
                  padding: "32px",
                  marginBottom: "20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Background glow */}
                <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", background: `radial-gradient(circle, ${supplier.color}15 0%, transparent 70%)`, pointerEvents: "none" }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "24px" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: `${supplier.color}22`, border: `1px solid ${supplier.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                    {supplier.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ color: "white", fontWeight: 900, fontSize: "24px" }}>{supplier.name}</span>
                      <span style={{ background: `${supplier.color}22`, color: supplier.color, fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", border: `1px solid ${supplier.color}44` }}>✓ VERIFIED PARTNER</span>
                    </div>
                    <div style={{ color: supplier.color, fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>{supplier.tagline}</div>
                    <div style={{ color: "#555", fontSize: "13px" }}>{supplier.phone}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
                  {supplier.stats.map((stat, si) => (
                    <div key={si} style={{ background: "#111", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid #1a1a1a" }}>
                      <div style={{ color: supplier.color, fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>{stat.value}</div>
                      <div style={{ color: "#444", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.8, marginBottom: "20px" }}>{supplier.description}</p>

                {/* Specialties */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ color: "#444", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "10px" }}>WORKS WITH</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {supplier.specialties.map((s, si) => (
                      <span key={si} style={{ background: "#111", border: `1px solid ${supplier.color}22`, borderRadius: "20px", padding: "5px 14px", color: "#666", fontSize: "12px" }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* How to reach out */}
                <div style={{ background: `${supplier.color}08`, border: `1px solid ${supplier.color}22`, borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
                  <div style={{ color: supplier.color, fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "10px" }}>💬 HOW TO REACH OUT</div>
                  <div style={{ color: "#888", fontSize: "13px", lineHeight: 1.8 }}>
                    1. Open WhatsApp and message {supplier.name} at <strong style={{ color: "white" }}>{supplier.phone}</strong><br />
                    2. Send a photo of your product and say: <strong style={{ color: supplier.color }}>&ldquo;Hey, I use the code PRODIQ&rdquo;</strong> — they&apos;ll give you a small discount<br />
                    3. They typically respond within 24 hours, then communication becomes very fast<br />
                    4. Share your target price, quantity, and any quality requirements
                  </div>
                </div>

                {/* CTA buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <a
                    href={`https://wa.me/${supplier.whatsapp}?text=Hey%20${supplier.name}%2C%20I%20use%20the%20code%20PRODIQ`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: "#25D366", borderRadius: "12px", padding: "14px", color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
                  >
                    <span style={{ fontSize: "18px" }}>💬</span>
                    Message on WhatsApp
                  </a>
                  <a
                    href={`tel:${supplier.phone}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", background: `${supplier.color}15`, border: `1px solid ${supplier.color}44`, borderRadius: "12px", padding: "14px", color: supplier.color, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
                  >
                    <span style={{ fontSize: "18px" }}>📞</span>
                    Call Direct
                  </a>
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "12px", padding: "16px", marginTop: "16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
              <div style={{ color: "#666", fontSize: "13px", lineHeight: 1.6 }}>
                These suppliers are personally vetted by the ProdIQ team. Always start with a small test order before scaling. ProdIQ is not responsible for transactions between you and suppliers. Use code <strong style={{ color: "#f59e0b" }}>PRODIQ</strong> when reaching out for an exclusive discount.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 text-center">
          <p className="text-base font-bold text-white sm:text-lg">Run your next product on this stack.</p>
          <Link
            href="/signup"
            className="mt-6 inline-flex items-center justify-center rounded-[20px] bg-[#6c47ff] px-8 py-3 text-[15px] font-semibold text-white transition hover:opacity-90"
          >
            Start For Free →
          </Link>
        </section>
      </div>
    </main>
  );
}
