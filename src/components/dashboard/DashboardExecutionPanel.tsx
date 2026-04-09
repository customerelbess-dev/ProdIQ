/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type AngleRow = Record<string, unknown>;

function normalizeExecAngle(a: AngleRow) {
  const type = String(a.type ?? "EMERGING");
  const success = Number(a.success_rate ?? a.success_score ?? 65);
  return {
    type,
    name: String(a.name ?? "Angle"),
    hook: String(a.hook ?? ""),
    script: String(a.script ?? a.message ?? ""),
    platform: String(a.platform ?? "TikTok"),
    success_rate: Math.max(50, Number.isFinite(success) ? success : 65),
  };
}

type Props = {
  report: Record<string, unknown>;
  /** Product hero image for landing preview modal */
  productImage?: string | null;
  analysisSource?: { full_report?: Record<string, unknown> | null; potential_success?: unknown } | null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DashboardExecutionPanel({ report, productImage: _pi, analysisSource: _as }: Props) {
  const [selectedExecutionAngle, setSelectedExecutionAngle] = useState<ReturnType<typeof normalizeExecAngle> | null>(
    null,
  );

  const rawAngles = (report.angles as AngleRow[]) ?? [];
  const launchAngles = rawAngles.map(normalizeExecAngle).filter((a) => a.type !== "SATURATED");

  const psych = (report.psychology ?? {}) as {
    real_reason?: string;
    pain_points?: string[];
    emotional_triggers?: string[];
  };
  const profit = (report.profit_estimate ?? {}) as Record<string, string | undefined>;

  if (!selectedExecutionAngle) {
    if (launchAngles.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "#666" }}>
          <p style={{ margin: 0 }}>No non-saturated angles in this report yet. Run a fuller analysis or check the Angles tab.</p>
        </div>
      );
    }
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Choose Your Angle</div>
          <div style={{ color: "#555", fontSize: 14 }}>
            Pick the angle you want to launch with. We will build your complete execution plan around it.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {launchAngles.map((angle, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedExecutionAngle(angle)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedExecutionAngle(angle);
                }
              }}
              style={{
                background: "#0c0c14",
                borderRadius: 16,
                border: `1px solid ${angle.type === "UNTAPPED" ? "rgba(0,212,170,0.3)" : "rgba(167,139,250,0.35)"}`,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div
                  style={{
                    background: angle.type === "UNTAPPED" ? "#00d4aa22" : "#a78bfa22",
                    color: angle.type === "UNTAPPED" ? "#00d4aa" : "#a78bfa",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  {angle.type}
                </div>
                <div style={{ color: "#00d4aa", fontWeight: 800 }}>{angle.success_rate}%</div>
              </div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{angle.name}</div>
              <div style={{ color: "#888", fontSize: 13, fontStyle: "italic", marginBottom: 12 }}>&quot;{angle.hook}&quot;</div>
              <div
                style={{
                  background: angle.type === "UNTAPPED" ? "#00d4aa" : "#a78bfa",
                  borderRadius: 8,
                  padding: 10,
                  textAlign: "center",
                  color: angle.type === "UNTAPPED" ? "#003322" : "#1a1028",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Launch With This Angle →
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const angle = selectedExecutionAngle;
  const pain0 = psych.pain_points?.[0] ?? "—";
  const scriptSnippet = angle.script ? angle.script.substring(0, 80) : "—";

  return (
    <>
      <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "rgba(108,71,255,0.08)",
              border: "1px solid rgba(108,71,255,0.25)",
              borderRadius: 16,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 28 }}>🚀</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                style={{
                  color: "#6c47ff",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                LAUNCHING WITH ANGLE
              </div>
              <div style={{ color: "white", fontSize: 18, fontWeight: 800 }}>{angle.name}</div>
              <div style={{ color: "#888", fontSize: 13, fontStyle: "italic" }}>&quot;{angle.hook}&quot;</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedExecutionAngle(null)}
              style={{
                background: "transparent",
                border: "1px solid #333",
                borderRadius: 8,
                padding: "8px 14px",
                color: "#555",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Change Angle
            </button>
          </div>

          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>🎯</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Target Audience</span>
            </div>
            <div style={{ color: "white", fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>
              {psych.real_reason ?? "—"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(psych.pain_points ?? []).map((p, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 10, background: "#111", borderRadius: 8, padding: "10px 14px" }}
                >
                  <span style={{ color: "#6c47ff", flexShrink: 0 }}>•</span>
                  <span style={{ color: "#888", fontSize: 13 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>💸</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Pricing Strategy</span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: "Source Price", value: profit.buy_price, color: "#888" },
                { label: "Sell Price", value: profit.sell_price, color: "#00d4aa" },
                { label: "Your Margin", value: profit.margin, color: "#6c47ff" },
                { label: "Break-even ROAS", value: profit.break_even_roas, color: "#f59e0b" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#111", borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ color: "#444", fontSize: 10, fontWeight: 600, marginBottom: 8 }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{ color: item.color, fontWeight: 900, fontSize: 22 }}>{item.value || "--"}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>🎥</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>30-Second Ad Structure</span>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  {
                    time: "0-3s",
                    label: "HOOK",
                    content: angle.hook,
                    color: "#6c47ff",
                    bg: "rgba(108,71,255,0.08)",
                  },
                  {
                    time: "3-8s",
                    label: "PROBLEM",
                    content: pain0,
                    color: "#ff6b6b",
                    bg: "rgba(255,68,68,0.08)",
                  },
                  {
                    time: "8-16s",
                    label: "SOLUTION",
                    content: scriptSnippet,
                    color: "#00d4aa",
                    bg: "rgba(0,212,170,0.08)",
                  },
                  {
                    time: "16-23s",
                    label: "PROOF",
                    content: "Show reviews + results",
                    color: "#f59e0b",
                    bg: "rgba(245,158,11,0.08)",
                  },
                  {
                    time: "23-30s",
                    label: "CTA",
                    content: "Get yours — free shipping",
                    color: "#a78bfa",
                    bg: "rgba(167,139,250,0.08)",
                  },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", paddingLeft: 16 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: s.bg,
                        border: `2px solid ${s.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          color: s.color,
                          fontSize: 9,
                          fontWeight: 800,
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {s.time}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: s.bg,
                        border: `1px solid ${s.color}22`,
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          color: s.color,
                          fontSize: 10,
                          fontWeight: 800,
                          marginBottom: 4,
                          letterSpacing: 0.5,
                        }}
                      >
                        {s.label}
                      </div>
                      <div style={{ color: "#888", fontSize: 13, lineHeight: 1.5 }}>{s.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>📅</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>7-Day Launch Plan</span>
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}
              className="max-lg:grid-cols-4 max-sm:grid-cols-2"
            >
              {[
                { day: "D1", action: "Build store", icon: "🏗️", color: "#6c47ff" },
                { day: "D2", action: "Source product", icon: "📦", color: "#a78bfa" },
                { day: "D3", action: "Film 3 videos", icon: "🎥", color: "#00d4aa" },
                { day: "D4", action: "Launch ads $50", icon: "🚀", color: "#f59e0b" },
                { day: "D5", action: "Monitor CTR", icon: "📊", color: "#ff6b6b" },
                { day: "D6", action: "Kill losers", icon: "❌", color: "#ff4444" },
                { day: "D7", action: "Scale winners", icon: "📈", color: "#00d4aa" },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#111",
                    borderRadius: 10,
                    padding: "12px 8px",
                    textAlign: "center",
                    border: `1px solid ${item.color}22`,
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ color: item.color, fontSize: 11, fontWeight: 800, marginBottom: 4 }}>{item.day}</div>
                  <div style={{ color: "#555", fontSize: 10, lineHeight: 1.3 }}>{item.action}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>🛍️</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Landing Page Examples</span>
              <span style={{ background: "#6c47ff22", color: "#a78bfa", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>2 real-style examples</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="max-md:grid-cols-1">
              {/* Landing Page Example 1 — Emotional / Pain Relief angle */}
              <div style={{ background: "#111", borderRadius: 14, overflow: "hidden", border: "1px solid #1a1a1a" }}>
                {/* Hero */}
                <div style={{ background: "linear-gradient(135deg, #0a0a14, #0e0e20)", padding: "20px 18px", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ color: "#a78bfa", fontSize: 9, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>EXAMPLE 1 — PAIN ANGLE</div>
                  <div style={{ color: "white", fontWeight: 900, fontSize: 16, lineHeight: 1.3, marginBottom: 6 }}>&ldquo;{angle.hook}&rdquo;</div>
                  <div style={{ color: "#888", fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{pain0}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ color: "#555", fontSize: 12, textDecoration: "line-through" }}>{profit.sell_price ? `$${(parseFloat(String(profit.sell_price).replace(/[^0-9.]/g, "")) * 1.4 || 49).toFixed(2)}` : "$49.99"}</div>
                    <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 18 }}>{profit.sell_price || "$29.99"}</div>
                    <div style={{ background: "#ff4444", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>SAVE 30%</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    {(psych.pain_points ?? ["Clinically tested", "Fast results", "Money-back guarantee"]).slice(0, 3).map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "#00d4aa", fontSize: 12, marginTop: 1 }}>✓</span>
                        <span style={{ color: "#ccc", fontSize: 12 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "#6c47ff", borderRadius: 8, padding: "12px", textAlign: "center", color: "white", fontWeight: 700, fontSize: 13 }}>
                    Get Yours — Free Shipping Today →
                  </div>
                  <div style={{ color: "#ff6b6b", fontSize: 10, textAlign: "center", marginTop: 6 }}>⚡ Only 43 left in stock</div>
                </div>
                {/* Trust badges */}
                <div style={{ padding: "10px 18px", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", borderBottom: "1px solid #1a1a1a" }}>
                  {["🔒 Secure Checkout", "🔄 30-Day Returns", "⭐ 4.8/5 Stars"].map((b, i) => (
                    <span key={i} style={{ color: "#555", fontSize: 10 }}>{b}</span>
                  ))}
                </div>
                {/* FAQ */}
                <div style={{ padding: "10px 18px" }}>
                  <div style={{ color: "#555", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>FAQ</div>
                  {["How fast does it work?", "Is it safe to use daily?"].map((q, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 0" }}>
                      <div style={{ color: "#888", fontSize: 11 }}>Q: {q}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Landing Page Example 2 — Social Proof / Results angle */}
              <div style={{ background: "#111", borderRadius: 14, overflow: "hidden", border: "1px solid #1a1a1a" }}>
                {/* Hero */}
                <div style={{ background: "linear-gradient(135deg, #030310, #080818)", padding: "20px 18px", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ color: "#00d4aa", fontSize: 9, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>EXAMPLE 2 — RESULTS ANGLE</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    {"★★★★★".split("").map((s, i) => <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>{s}</span>)}
                    <span style={{ color: "#555", fontSize: 11, marginLeft: 4 }}>4,200+ happy customers</span>
                  </div>
                  <div style={{ color: "white", fontWeight: 900, fontSize: 15, lineHeight: 1.3, marginBottom: 6 }}>
                    Finally — {angle.name} That Actually Works
                  </div>
                  <div style={{ background: "#0c0c14", borderRadius: 8, padding: "10px 12px", marginBottom: 12, borderLeft: "3px solid #00d4aa" }}>
                    <div style={{ color: "#ccc", fontSize: 11, fontStyle: "italic" }}>&ldquo;I tried everything. This changed my life in 2 weeks.&rdquo;</div>
                    <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>— Sarah M., verified buyer</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    {["Visible results in 7–14 days", "No side effects, 100% natural", "As seen on TikTok & Instagram"].map((pt, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: "#00d4aa", fontSize: 12, marginTop: 1 }}>✓</span>
                        <span style={{ color: "#ccc", fontSize: 12 }}>{pt}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ color: "#555", fontSize: 12, textDecoration: "line-through" }}>{profit.sell_price ? `$${(parseFloat(String(profit.sell_price).replace(/[^0-9.]/g, "")) * 1.5 || 59).toFixed(2)}` : "$59.99"}</div>
                    <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 18 }}>{profit.sell_price || "$29.99"}</div>
                  </div>
                  <div style={{ background: "#00d4aa", borderRadius: 8, padding: "12px", textAlign: "center", color: "#002", fontWeight: 700, fontSize: 13 }}>
                    Add to Cart — Free Shipping →
                  </div>
                  <div style={{ color: "#f59e0b", fontSize: 10, textAlign: "center", marginTop: 6 }}>🔒 100% Money-Back Guarantee</div>
                </div>
                {/* Trust badges */}
                <div style={{ padding: "10px 18px", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", borderBottom: "1px solid #1a1a1a" }}>
                  {["🏆 #1 Best Seller", "📦 Ships in 24h", "💳 Secure Payment"].map((b, i) => (
                    <span key={i} style={{ color: "#555", fontSize: 10 }}>{b}</span>
                  ))}
                </div>
                {/* FAQ */}
                <div style={{ padding: "10px 18px" }}>
                  <div style={{ color: "#555", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>FAQ</div>
                  {["What if it doesn't work for me?", "How long until I see results?"].map((q, i) => (
                    <div key={i} style={{ borderBottom: "1px solid #1a1a1a", padding: "6px 0" }}>
                      <div style={{ color: "#888", fontSize: 11 }}>Q: {q}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </div>

    </>
  );
}
