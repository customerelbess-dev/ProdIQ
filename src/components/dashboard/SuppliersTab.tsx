"use client";

import Link from "next/link";

const SUPPLIERS = [
  {
    name: "Snacky",
    phone: "+86 173 7921 1675",
    whatsapp: "8617379211675",
    emoji: "⚡",
    color: "#6c47ff",
    tagline: "Speed & Reliability Specialist",
    description:
      "Snacky has sourced products for brands doing over 7 figures in annual revenue. Known for extremely fast response times, honest pricing, and zero hidden fees. Whether you need 10 units to test or 10,000 to scale — Snacky handles both with the same level of attention.",
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
    description:
      "Tina specializes in working with serious ecom operators who are ready to scale. She manages sourcing for multiple 7-figure DTC brands and brings that same level of service to every client. Known for finding the best quality at the most competitive prices.",
    specialties: ["DTC Brands", "Private Label", "Dropshipping", "Amazon FBA", "TikTok Shop", "Shopify Stores"],
    stats: [
      { label: "Response Time", value: "<4 hours" },
      { label: "Experience", value: "10+ years" },
      { label: "Brands Served", value: "350+" },
      { label: "Avg Rating", value: "5.0/5" },
    ],
  },
] as const;

type Props = {
  isPro?: boolean;
};

export function SuppliersTab({ isPro = false }: Props) {
  if (!isPro) {
    return (
      <div>
        <style>{`
          @keyframes suppliersGlow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        `}</style>

        {/* Lock screen */}
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(108,71,255,0.1)",
              border: "1px solid rgba(108,71,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              margin: "0 auto 20px",
              animation: "suppliersGlow 2.5s ease-in-out infinite",
            }}
          >
            🔒
          </div>
          <div
            style={{
              background: "rgba(108,71,255,0.1)",
              border: "1px solid rgba(108,71,255,0.3)",
              borderRadius: "20px",
              padding: "4px 16px",
              display: "inline-block",
              color: "#a78bfa",
              fontSize: "11px",
              fontWeight: 700,
              marginBottom: "16px",
              letterSpacing: "1px",
            }}
          >
            PRO & AGENCY EXCLUSIVE
          </div>
          <div style={{ color: "white", fontWeight: 900, fontSize: 24, marginBottom: 10 }}>
            Private Supplier Network
          </div>
          <div style={{ color: "#555", fontSize: 14, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Get direct access to our hand-picked Chinese suppliers who have worked with 7-figure brands.
            Available exclusively for Pro and Agency members.
          </div>

          {/* Blurred preview cards */}
          <div style={{ position: "relative", maxWidth: 600, margin: "0 auto 32px", pointerEvents: "none", userSelect: "none" }}>
            <div style={{ filter: "blur(4px)", opacity: 0.4 }}>
              {SUPPLIERS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: "#0c0c14",
                    borderRadius: 16,
                    border: `1px solid ${s.color}33`,
                    padding: "20px 24px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: `${s.color}22`,
                      border: `1px solid ${s.color}44`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {s.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{s.name}</div>
                    <div style={{ color: s.color, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{s.tagline}</div>
                    <div style={{ color: "#444", fontSize: 12 }}>{s.phone}</div>
                  </div>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>View →</div>
                </div>
              ))}
            </div>
            {/* Overlay lock icon */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle, rgba(4,4,6,0.6) 0%, transparent 80%)",
              }}
            >
              <div style={{ color: "#444", fontSize: 13 }}>Upgrade to unlock</div>
            </div>
          </div>

          <Link
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#6c47ff",
              border: "none",
              borderRadius: 12,
              padding: "14px 32px",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Upgrade to Pro →
          </Link>
          <div style={{ color: "#444", fontSize: 12, marginTop: 10 }}>Starting at $59.90/month</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              background: "rgba(108,71,255,0.1)",
              border: "1px solid rgba(108,71,255,0.3)",
              borderRadius: 20,
              padding: "4px 14px",
              display: "inline-block",
              color: "#a78bfa",
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 12,
              letterSpacing: "1px",
            }}
          >
            ✓ PRO MEMBER ACCESS
          </div>
          <div style={{ color: "white", fontWeight: 900, fontSize: 22, marginBottom: 6 }}>
            Private Supplier Network
          </div>
          <div style={{ color: "#555", fontSize: 14, lineHeight: 1.6 }}>
            Hand-picked suppliers who have worked with 7-figure brands. Mention code{" "}
            <strong style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "1px 7px", borderRadius: 4 }}>
              PRODIQ
            </strong>{" "}
            when reaching out for an exclusive discount.
          </div>
        </div>

        {/* Supplier cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SUPPLIERS.map((supplier, i) => (
            <div
              key={i}
              style={{
                background: "#0c0c14",
                borderRadius: 24,
                border: `1px solid ${supplier.color}33`,
                padding: 28,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Background glow */}
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 200,
                  height: 200,
                  background: `radial-gradient(circle, ${supplier.color}12 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />

              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 22 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    background: `${supplier.color}20`,
                    border: `1px solid ${supplier.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  {supplier.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ color: "white", fontWeight: 900, fontSize: 22 }}>{supplier.name}</span>
                    <span
                      style={{
                        background: `${supplier.color}20`,
                        color: supplier.color,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 20,
                        border: `1px solid ${supplier.color}44`,
                      }}
                    >
                      ✓ VERIFIED PARTNER
                    </span>
                  </div>
                  <div style={{ color: supplier.color, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                    {supplier.tagline}
                  </div>
                  <div style={{ color: "#555", fontSize: 13 }}>{supplier.phone}</div>
                </div>
              </div>

              {/* Stats */}
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}
                className="max-sm:grid-cols-2"
              >
                {supplier.stats.map((stat, si) => (
                  <div
                    key={si}
                    style={{
                      background: "#111",
                      borderRadius: 10,
                      padding: 12,
                      textAlign: "center",
                      border: "1px solid #1a1a1a",
                    }}
                  >
                    <div style={{ color: supplier.color, fontWeight: 800, fontSize: 15, marginBottom: 3 }}>
                      {stat.value}
                    </div>
                    <div style={{ color: "#444", fontSize: 10, fontWeight: 600, textTransform: "uppercase" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p style={{ color: "#888", fontSize: 14, lineHeight: 1.8, marginBottom: 18 }}>
                {supplier.description}
              </p>

              {/* Specialties */}
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{ color: "#444", fontSize: 10, fontWeight: 700, letterSpacing: "1px", marginBottom: 10 }}
                >
                  WORKS WITH
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {supplier.specialties.map((s, si) => (
                    <span
                      key={si}
                      style={{
                        background: "#111",
                        border: `1px solid ${supplier.color}22`,
                        borderRadius: 20,
                        padding: "5px 14px",
                        color: "#666",
                        fontSize: 12,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* How to reach out */}
              <div
                style={{
                  background: `${supplier.color}08`,
                  border: `1px solid ${supplier.color}22`,
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    color: supplier.color,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "1px",
                    marginBottom: 10,
                  }}
                >
                  💬 HOW TO REACH OUT
                </div>
                <div style={{ color: "#888", fontSize: 13, lineHeight: 1.8 }}>
                  1. Open WhatsApp and message {supplier.name} at{" "}
                  <strong style={{ color: "white" }}>{supplier.phone}</strong>
                  <br />
                  2. Say:{" "}
                  <strong style={{ color: supplier.color }}>
                    &ldquo;Hey, I use the code PRODIQ&rdquo;
                  </strong>{" "}
                  — they&apos;ll give you a small discount
                  <br />
                  3. Send a photo of your product, target price, and quantity
                  <br />
                  4. They respond fast and take it from there
                </div>
              </div>

              {/* CTA buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <a
                  href={`https://wa.me/${supplier.whatsapp}?text=Hey%20${supplier.name}%2C%20I%20use%20the%20code%20PRODIQ`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: "#25D366",
                    borderRadius: 12,
                    padding: 14,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 18 }}>💬</span>
                  WhatsApp
                </a>
                <a
                  href={`tel:${supplier.phone}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: `${supplier.color}15`,
                    border: `1px solid ${supplier.color}44`,
                    borderRadius: 12,
                    padding: 14,
                    color: supplier.color,
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: 18 }}>📞</span>
                  Call Direct
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: 12,
            padding: 16,
            marginTop: 20,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>
            These suppliers are personally vetted by the ProdIQ team. Always start with a small test order
            before scaling. ProdIQ is not responsible for any transactions between you and suppliers.
          </div>
        </div>
      </div>
    </div>
  );
}
