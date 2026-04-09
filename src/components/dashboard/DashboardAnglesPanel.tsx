/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type AngleRow = Record<string, unknown>;

function normalizeAngle(a: AngleRow) {
  const type = String(a.type ?? "EMERGING");
  const script = String(a.script ?? a.message ?? "");
  const emotion = String(a.emotion ?? a.why_it_works ?? a.target_emotion ?? "");
  const success = Number(a.success_rate ?? a.success_score ?? 65);
  const saturation = Number(a.saturation ?? 50);
  return {
    ...a,
    type,
    name: String(a.name ?? "Angle"),
    hook: String(a.hook ?? ""),
    script,
    emotion,
    success_rate: Number.isFinite(success) ? success : 65,
    saturation: Number.isFinite(saturation) ? saturation : 50,
    platform: String(a.platform ?? "TikTok"),
  };
}

type Props = {
  report: Record<string, unknown>;
};

export function DashboardAnglesPanel({ report }: Props) {
  const [selectedAngle, setSelectedAngle] = useState<ReturnType<typeof normalizeAngle> | null>(null);

  const productLabel =
    report.product_name != null && String(report.product_name).trim() !== ""
      ? String(report.product_name)
      : "your product";

  const rawAngles = (report.angles as AngleRow[]) ?? [];
  const angles = rawAngles.map(normalizeAngle);

  if (selectedAngle) {
    const sa = selectedAngle;
    const borderColor =
      sa.type === "UNTAPPED" ? "#00d4aa44" : sa.type === "EMERGING" ? "#a78bfa44" : "#ff444444";
    return (
      <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
        <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <button
          type="button"
          onClick={() => setSelectedAngle(null)}
          style={{
            background: "transparent",
            border: "1px solid #222",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#666",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          ← Back to Angles
        </button>

        <div
          style={{
            background: "#0c0c14",
            borderRadius: 20,
            border: `1px solid ${borderColor}`,
            padding: 32,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              background: sa.type === "UNTAPPED" ? "#00d4aa22" : sa.type === "EMERGING" ? "#a78bfa22" : "#ff444422",
              color: sa.type === "UNTAPPED" ? "#00d4aa" : sa.type === "EMERGING" ? "#a78bfa" : "#ff6b6b",
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 12px",
              borderRadius: 20,
              display: "inline-block",
              marginBottom: 16,
              letterSpacing: 1,
            }}
          >
            {sa.type}
          </div>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 900, marginBottom: 12, lineHeight: 1.3 }}>{sa.hook}</h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", background: "#111", borderRadius: 10, padding: "12px 20px" }}>
              <div style={{ color: "#00d4aa", fontWeight: 800, fontSize: 22 }}>{sa.success_rate}%</div>
              <div style={{ color: "#555", fontSize: 11 }}>Success Rate</div>
            </div>
            <div style={{ textAlign: "center", background: "#111", borderRadius: 10, padding: "12px 20px" }}>
              <div style={{ color: "#6c47ff", fontWeight: 800, fontSize: 22 }}>{sa.saturation}%</div>
              <div style={{ color: "#555", fontSize: 11 }}>Saturation</div>
            </div>
            <div style={{ textAlign: "center", background: "#111", borderRadius: 10, padding: "12px 20px" }}>
              <div
                style={{
                  color: sa.type === "EMERGING" ? "#a78bfa" : sa.type === "UNTAPPED" ? "#00d4aa" : "#ff6b6b",
                  fontWeight: 800,
                  fontSize: 22,
                }}
              >
                {sa.platform}
              </div>
              <div style={{ color: "#555", fontSize: 11 }}>Best Platform</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="max-md:grid-cols-1">
          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>🎥 AD SCRIPT</div>
            <div style={{ color: "white", fontSize: 14, lineHeight: 1.8 }}>{sa.script || "—"}</div>
          </div>
          <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
            <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>🧠 WHY IT WORKS</div>
            <div style={{ color: "#888", fontSize: 13, lineHeight: 1.8 }}>{sa.emotion || "—"}</div>
            <div style={{ marginTop: 16 }}>
              <div style={{ color: "#555", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>ESTIMATED REVENUE POTENTIAL</div>
              <div style={{ color: "#00d4aa", fontSize: 24, fontWeight: 800 }}>
                ${Math.floor(sa.success_rate * 1200).toLocaleString()}/mo
              </div>
              <div style={{ color: "#444", fontSize: 11 }}>
                Based on {sa.success_rate}% success rate for {productLabel} in similar markets
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
          <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>🚀 HOW TO RUN THIS ANGLE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { step: "1", title: "Hook", content: sa.hook },
              {
                step: "2",
                title: "Platform",
                content: `Run on ${sa.platform} first. Test with $50/day budget.`,
              },
              {
                step: "3",
                title: "Creative",
                content: "UGC style video. First 3 seconds must show the problem.",
              },
            ].map((s, i) => (
              <div key={i} style={{ background: "#111", borderRadius: 10, padding: 16 }}>
                <div style={{ color: "#6c47ff", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
                  STEP {s.step}: {s.title.toUpperCase()}
                </div>
                <div style={{ color: "#888", fontSize: 12, lineHeight: 1.6 }}>{s.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const saturated = angles.filter((a) => a.type === "SATURATED");
  const emerging = angles.filter((a) => a.type === "EMERGING");
  const untapped = angles.filter((a) => a.type === "UNTAPPED");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            padding: "12px 16px",
            background: "rgba(255,68,68,0.06)",
            border: "1px solid rgba(255,68,68,0.15)",
            borderRadius: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff4444", flexShrink: 0 }} />
          <span style={{ color: "#ff6b6b", fontWeight: 700, fontSize: 14 }}>
            SATURATED ANGLES — Everyone is using these. Avoid.
          </span>
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(255,68,68,0.15)",
              color: "#ff6b6b",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: 10,
            }}
          >
            {saturated.length} angles
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {saturated.map((angle, i) => (
            <div
              key={`sat-${angle.name}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedAngle(angle)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAngle(angle);
                }
              }}
              style={{
                background: "rgba(255,68,68,0.04)",
                border: "1px solid rgba(255,68,68,0.15)",
                borderRadius: 14,
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,68,68,0.08)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,68,68,0.04)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{angle.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#ff6b6b", fontWeight: 800, fontSize: 14 }}>{angle.saturation}% saturated</span>
                  <span style={{ color: "#444", fontSize: 11 }}>Tap to explore →</span>
                </div>
              </div>
              <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, marginBottom: 10 }}>
                <div
                  style={{
                    width: `${Math.min(100, angle.saturation)}%`,
                    height: 4,
                    background: "#ff4444",
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ color: "#555", fontSize: 13, fontStyle: "italic" }}>&quot;{angle.hook}&quot;</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            padding: "12px 16px",
            background: "rgba(167,139,250,0.06)",
            border: "1px solid rgba(167,139,250,0.2)",
            borderRadius: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#a78bfa", flexShrink: 0 }} />
          <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>
            EMERGING ANGLES — Growing fast. Test these now.
          </span>
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(167,139,250,0.15)",
              color: "#a78bfa",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: 10,
            }}
          >
            {emerging.length} angles
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {emerging.map((angle, i) => (
            <div
              key={`em-${angle.name}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedAngle(angle)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAngle(angle);
                }
              }}
              style={{
                background: "rgba(167,139,250,0.04)",
                border: "1px solid rgba(167,139,250,0.15)",
                borderRadius: 14,
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(167,139,250,0.08)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(167,139,250,0.04)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{angle.name}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>{angle.success_rate}% success</span>
                  <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13 }}>
                    ~${Math.floor(angle.success_rate * 1200).toLocaleString()}/mo potential
                  </span>
                </div>
              </div>
              <div style={{ color: "white", fontSize: 13, fontStyle: "italic", marginBottom: 10 }}>&quot;{angle.hook}&quot;</div>
              <div style={{ background: "#111", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ color: "#444", fontSize: 10, fontWeight: 600, marginBottom: 3 }}>SCRIPT PREVIEW</div>
                <div style={{ color: "#666", fontSize: 12 }}>
                  {angle.script ? `${angle.script.substring(0, 100)}...` : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
            padding: "12px 16px",
            background: "rgba(0,212,170,0.06)",
            border: "1px solid rgba(0,212,170,0.2)",
            borderRadius: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00d4aa", flexShrink: 0 }} />
          <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14 }}>
            UNTAPPED ANGLES — Nobody is using these yet. Your biggest opportunity.
          </span>
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(0,212,170,0.15)",
              color: "#00d4aa",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 10px",
              borderRadius: 10,
            }}
          >
            {untapped.length} angles
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {untapped.map((angle, i) => (
            <div
              key={`un-${angle.name}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedAngle(angle)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedAngle(angle);
                }
              }}
              style={{
                background: "rgba(0,212,170,0.04)",
                border: "1px solid rgba(0,212,170,0.2)",
                borderRadius: 14,
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,212,170,0.08)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,212,170,0.04)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{angle.name}</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      background: "#00d4aa22",
                      color: "#00d4aa",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    UNTAPPED ✓
                  </div>
                  <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>{angle.success_rate}% success</span>
                </div>
              </div>
              <div
                style={{
                  color: "#00d4aa",
                  fontSize: 14,
                  fontStyle: "italic",
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                &quot;{angle.hook}&quot;
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ background: "#111", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#555" }}>
                  🎯 {angle.platform}
                </div>
                <div
                  style={{
                    background: "#111",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 11,
                    color: "#00d4aa",
                    fontWeight: 600,
                  }}
                >
                  ~${Math.floor(angle.success_rate * 1200).toLocaleString()}/mo potential
                </div>
              </div>
              <div style={{ background: "#111", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ color: "#444", fontSize: 10, fontWeight: 600, marginBottom: 3 }}>SCRIPT PREVIEW</div>
                <div style={{ color: "#888", fontSize: 12, lineHeight: 1.5 }}>
                  {angle.script ? `${angle.script.substring(0, 120)}...` : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right", marginTop: 8 }}>
                <span style={{ color: "#6c47ff", fontSize: 11, fontWeight: 600 }}>Tap for full plan →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
