/* eslint-disable @next/next/no-img-element */
"use client";

import { getSuccessRate } from "@/lib/dashboard-helpers";

type Angle = { name: string; hook: string; success_rate: number };
type AnalysisRowLike = { full_report?: Record<string, unknown> | null; product_image?: string | null } | null;

function sellPriceNumeric(sell: string | undefined): number {
  const m = String(sell ?? "").match(/[\d.]+/);
  if (!m) return 47;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : 47;
}

type Props = {
  report: Record<string, unknown>;
  angle: Angle;
  productImage: string;
  analysisSource: AnalysisRowLike;
  onClose: () => void;
};

export function DashboardLandingPreviewModal({ report, angle, productImage, analysisSource, onClose }: Props) {
  const psych = (report.psychology ?? {}) as { pain_points?: string[] };
  const profit = (report.profit_estimate ?? {}) as Record<string, string | undefined>;
  const market = (report.market ?? {}) as { size?: string };
  const productName = String(report.product_name ?? "");
  const brandFirst = productName.trim().split(/\s+/)[0] || "Brand";
  const sellStr = profit.sell_price || "$47";
  const sellNum = sellPriceNumeric(sellStr);
  const strike1 = Math.round(sellNum * 1.8) || 84;
  const strikeBundle = Math.round(sellNum * 2.4) || 112;
  const bundlePrice = Math.round(sellNum * 1.6) || 75;
  const successRate = getSuccessRate(analysisSource, report) ?? 73;
  const pain0 = psych.pain_points?.[0] ?? "Solve the problem your customers feel every day";

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 2000, overflowY: "auto" }}
      role="dialog"
      aria-modal="true"
      aria-label="Landing page preview"
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "#0c0c14",
          borderBottom: "1px solid #1a1a1a",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ color: "#6c47ff", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>
            AI GENERATED LANDING PAGE
          </span>
          <span style={{ color: "#333", fontSize: "11px" }}>·</span>
          <span style={{ color: "#555", fontSize: "11px" }}>Angle: &quot;{angle.name}&quot;</span>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(0,212,170,0.1)",
              border: "1px solid rgba(0,212,170,0.3)",
              borderRadius: "8px",
              padding: "6px 14px",
              color: "#00d4aa",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {successRate}% estimated success with this angle
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: "8px",
              padding: "8px 14px",
              color: "#888",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ background: "#f5d800", padding: "10px", textAlign: "center" }}>
          <div style={{ color: "#1a1a1a", fontSize: "13px", fontWeight: 700 }}>🔥 Limited Time Sale:</div>
          <div style={{ color: "#1a1a1a", fontSize: "12px" }}>50% Off First Order + Free Shipping</div>
        </div>

        <div
          style={{
            background: "white",
            padding: "16px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: "14px", color: "#333", cursor: "pointer" }}>Menu</div>
          <div style={{ fontWeight: 900, fontSize: "22px", color: "#1a1a1a", letterSpacing: "-0.5px" }}>{brandFirst}</div>
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: "20px", cursor: "pointer" }}>🛒</span>
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#1a1a1a",
                color: "white",
                fontSize: "9px",
                fontWeight: 800,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              0
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#fefce8",
            padding: "40px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "start",
            minHeight: "600px",
          }}
          className="max-lg:grid-cols-1 max-lg:gap-8"
        >
          <div>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "-10px",
                  top: "20px",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
                className="max-md:hidden"
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#1a3a5c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                  }}
                >
                  <div style={{ color: "white", fontSize: "8px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    CLEAN LABEL CERTIFIED
                  </div>
                </div>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "#1a3a5c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                  }}
                >
                  <div style={{ color: "white", fontSize: "8px", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    AWARD WINNER 2025
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  marginBottom: "12px",
                  marginLeft: "30px",
                  background: "#f5f0d8",
                  position: "relative",
                }}
                className="max-md:ml-0"
              >
                <img
                  src={productImage}
                  alt={productName}
                  style={{
                    width: "100%",
                    height: "420px",
                    objectFit: "contain",
                    display: "block",
                    padding: "20px",
                    boxSizing: "border-box",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/massager.jpg";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "white",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  🔍
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", marginLeft: "30px", flexWrap: "wrap" }} className="max-md:ml-0">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "8px",
                      background: "#f5f0d8",
                      border: i === 1 ? "2px solid #1a1a1a" : "2px solid transparent",
                      overflow: "hidden",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={productImage}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px", boxSizing: "border-box" }}
                      onError={(e) => {
                        e.currentTarget.src = "/massager.jpg";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ color: "#f59e0b", fontSize: "18px", letterSpacing: "2px" }}>★★★★★</div>
              <span
                style={{
                  color: "#6c47ff",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                4,847 Reviews
              </span>
            </div>

            <h1
              style={{
                color: "#1a1a1a",
                fontSize: "32px",
                fontWeight: 900,
                lineHeight: 1.15,
                margin: "0 0 20px 0",
              }}
            >
              {angle.hook || productName}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <span style={{ color: "#1a1a1a", fontWeight: 900, fontSize: "26px" }}>{sellStr}</span>
              <span style={{ color: "#999", fontSize: "20px", textDecoration: "line-through" }}>${strike1}</span>
              <span
                style={{
                  background: "#ff6b35",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                50% OFF FIRST ORDER
              </span>
            </div>

            <p style={{ color: "#555", fontSize: "15px", lineHeight: 1.7, margin: "0 0 20px 0" }}>
              {pain0}. Trusted by thousands of customers who finally found a solution that actually works.
            </p>

            <button
              type="button"
              style={{
                background: "transparent",
                border: "1px solid #ccc",
                borderRadius: "20px",
                padding: "8px 18px",
                color: "#555",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "24px",
              }}
            >
              View Product Details
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
                marginBottom: "24px",
                padding: "16px",
                background: "rgba(255,255,255,0.7)",
                borderRadius: "12px",
              }}
            >
              {[
                { icon: "📦", label1: "30-Day", label2: "Supply" },
                { icon: "🔄", label1: "Refillable", label2: "Package" },
                { icon: "⭐", label1: "Premium", label2: "Quality" },
              ].map((f, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "22px", marginBottom: "4px" }}>{f.icon}</div>
                  <div style={{ color: "#333", fontSize: "11px", fontWeight: 600, lineHeight: 1.3 }}>
                    {f.label1}
                    <br />
                    {f.label2}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "15px", marginBottom: "10px" }}>Select Your Pack</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["1 Unit", "2 Units", "3 Units", "Bundle"].map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    style={{
                      background: i === 0 ? "#1a1a1a" : "transparent",
                      border: `1px solid ${i === 0 ? "#1a1a1a" : "#ccc"}`,
                      borderRadius: "8px",
                      padding: "8px 14px",
                      color: i === 0 ? "white" : "#333",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ border: "2px solid #1a1a1a", borderRadius: "12px", padding: "14px", cursor: "pointer" }}>
                <div style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>
                  {productName.trim().split(/\s+/).slice(0, 2).join(" ") || "Standard"}
                </div>
                <div style={{ color: "#1a1a1a", fontWeight: 900 }}>
                  {sellStr}{" "}
                  <span style={{ textDecoration: "line-through", color: "#999", fontWeight: 400, fontSize: "13px" }}>
                    ${strike1}
                  </span>
                </div>
              </div>
              <div
                style={{
                  border: "2px solid #e8e8e8",
                  borderRadius: "12px",
                  padding: "14px",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#f5d800",
                    color: "#1a1a1a",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 10px",
                    borderRadius: "10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  BETTER TOGETHER
                </div>
                <div style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>
                  {productName.trim().split(/\s+/).slice(0, 2).join(" ") || "Bundle"} + Bonus
                </div>
                <div style={{ color: "#1a1a1a", fontWeight: 900 }}>
                  ${bundlePrice}{" "}
                  <span style={{ textDecoration: "line-through", color: "#999", fontWeight: 400, fontSize: "13px" }}>
                    ${strikeBundle}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              style={{
                width: "100%",
                background: "#ff6b35",
                border: "none",
                borderRadius: "12px",
                padding: "18px",
                color: "white",
                fontSize: "18px",
                fontWeight: 800,
                cursor: "pointer",
                marginBottom: "10px",
                letterSpacing: "-0.3px",
              }}
            >
              Try Now
            </button>
            <div style={{ textAlign: "center", color: "#888", fontSize: "13px", marginBottom: "24px" }}>
              Delivered Fresh · Cancel Anytime
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }} className="max-sm:grid-cols-2">
              {[
                { emoji: "😋", label: "Great Results" },
                { emoji: "🚫🍬", label: "Zero Fillers" },
                { emoji: "🌿", label: "Clean Formula" },
                { emoji: "🔬", label: "Lab Tested" },
                { emoji: "🦷", label: "Safe to Use" },
                { emoji: "🌾", label: "Gluten-Free" },
                { emoji: "🥛", label: "Dairy-Free" },
                { emoji: "✅", label: "Third Party Tested" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#f5d800",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      margin: "0 auto 6px",
                    }}
                  >
                    {item.emoji}
                  </div>
                  <div style={{ color: "#555", fontSize: "11px", fontWeight: 500 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: "#0c0c14", padding: "32px", textAlign: "center", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ color: "#555", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", marginBottom: "16px" }}>
            PRODIQ LAUNCH ANALYSIS
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap", marginBottom: "20px" }}>
            {[
              { value: `${successRate}%`, label: "Launch Success Chance", color: "#00d4aa" },
              { value: profit.margin || "65%", label: "Estimated Margin", color: "#6c47ff" },
              { value: `${angle.success_rate}%`, label: "Angle Success Rate", color: "#f59e0b" },
              { value: market.size || "$2.3B", label: "Market Size", color: "#a78bfa" },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ color: stat.color, fontWeight: 900, fontSize: "28px" }}>{stat.value}</div>
                <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={{ color: "#444", fontSize: "13px", maxWidth: "600px", margin: "0 auto", lineHeight: 1.7 }}>
            Following this landing page structure with the <strong style={{ color: "#a78bfa" }}>{angle.name}</strong> angle gives
            you an estimated{" "}
            <strong style={{ color: "#00d4aa" }}>{successRate}% chance of profitable launch</strong> within 60 days based on
            current market data, competition gaps, and angle saturation analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
