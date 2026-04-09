"use client";

import { useState } from "react";

type Angle = {
  type: "SATURATED" | "EMERGING" | "UNTAPPED";
  name?: string;
  hook?: string;
  script?: string;
  emotion?: string;
  success_rate?: number;
  saturation?: number;
  platform?: string;
};

type Props = {
  analysisReport: Record<string, unknown> | null;
  setActiveTab: (tab: string) => void;
};

export function AnglesTabMindMap({ analysisReport, setActiveTab }: Props) {
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);

  const angles = (analysisReport?.angles ?? []) as Angle[];
  const saturated = angles.filter((a) => a.type === "SATURATED");
  const emerging = angles.filter((a) => a.type === "EMERGING");
  const untapped = angles.filter((a) => a.type === "UNTAPPED");

  if (selectedAngle) {
    const typeColor =
      selectedAngle.type === "UNTAPPED"
        ? "#00d4aa"
        : selectedAngle.type === "EMERGING"
          ? "#a78bfa"
          : "#ff6b6b";
    const typeBg =
      selectedAngle.type === "UNTAPPED"
        ? "#00d4aa22"
        : selectedAngle.type === "EMERGING"
          ? "#6c47ff22"
          : "#ff444422";
    const borderColor =
      selectedAngle.type === "UNTAPPED"
        ? "rgba(0,212,170,0.3)"
        : selectedAngle.type === "EMERGING"
          ? "rgba(108,71,255,0.3)"
          : "rgba(255,68,68,0.3)";

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
          ← Back to Angle Map
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
              display: "inline-block",
              background: typeBg,
              color: typeColor,
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 14px",
              borderRadius: 20,
              marginBottom: 16,
              letterSpacing: 1,
            }}
          >
            {selectedAngle.type}
          </div>
          <h1
            style={{
              color: "white",
              fontSize: 26,
              fontWeight: 900,
              marginBottom: 12,
              lineHeight: 1.3,
              marginTop: 0,
            }}
          >
            {selectedAngle.hook}
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              {
                label: "Success Rate",
                value: `${Math.max(50, selectedAngle.success_rate ?? 50)}%`,
                color: "#00d4aa",
              },
              {
                label: "Saturation",
                value: `${selectedAngle.saturation ?? 0}%`,
                color: "#6c47ff",
              },
              {
                label: "Best Platform",
                value: selectedAngle.platform ?? "Meta",
                color: "#f59e0b",
              },
              {
                label: "Revenue Potential",
                value: `$${Math.floor(Math.max(50, selectedAngle.success_rate ?? 70) * 1200).toLocaleString()}/mo`,
                color: "#00d4aa",
              },
            ].map((m, i) => (
              <div
                key={i}
                style={{ background: "#111", borderRadius: 10, padding: "12px 20px", textAlign: "center" }}
              >
                <div style={{ color: m.color, fontWeight: 800, fontSize: i < 2 ? 22 : 16 }}>
                  {m.value}
                </div>
                <div style={{ color: "#555", fontSize: 11 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}
          className="max-md:grid-cols-1"
        >
          <div
            style={{
              background: "#0c0c14",
              borderRadius: 16,
              border: "1px solid rgba(108,71,255,0.12)",
              padding: 24,
            }}
          >
            <div
              style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}
            >
              🎥 AD SCRIPT
            </div>
            <div style={{ color: "#888", fontSize: 14, lineHeight: 1.8 }}>{selectedAngle.script}</div>
          </div>
          <div
            style={{
              background: "#0c0c14",
              borderRadius: 16,
              border: "1px solid rgba(108,71,255,0.12)",
              padding: 24,
            }}
          >
            <div
              style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}
            >
              🧠 WHY IT WORKS
            </div>
            <div style={{ color: "#888", fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
              {selectedAngle.emotion}
            </div>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
              ESTIMATED POTENTIAL
            </div>
            <div style={{ color: "#00d4aa", fontSize: 24, fontWeight: 800 }}>
              ${Math.floor(Math.max(50, selectedAngle.success_rate ?? 70) * 1200).toLocaleString()}/mo
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#0c0c14",
            borderRadius: 16,
            border: "1px solid rgba(108,71,255,0.12)",
            padding: 24,
            marginBottom: 16,
          }}
        >
          <div
            style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}
          >
            🚀 HOW TO RUN THIS ANGLE
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}
            className="max-md:grid-cols-1"
          >
            {[
              { step: "1", title: "Hook", content: selectedAngle.hook ?? "", color: "#6c47ff" },
              {
                step: "2",
                title: "Platform",
                content: `Launch on ${selectedAngle.platform ?? "Meta"}. Start with $50/day budget. Broad targeting only.`,
                color: "#00d4aa",
              },
              {
                step: "3",
                title: "Creative",
                content:
                  "UGC style. Show the problem in first 3 seconds. Never feature-sell, always emotion-sell.",
                color: "#f59e0b",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#111",
                  borderRadius: 10,
                  padding: 16,
                  borderTop: `3px solid ${s.color}`,
                }}
              >
                <div style={{ color: s.color, fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                  STEP {s.step}: {s.title}
                </div>
                <div style={{ color: "#888", fontSize: 12, lineHeight: 1.6 }}>{s.content}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("launch")}
          style={{
            width: "100%",
            background: "#6c47ff",
            border: "none",
            borderRadius: 12,
            padding: 16,
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🚀 Launch Campaign With This Angle →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>Angle Intelligence Map</div>
        <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
          Click any angle to get the full strategy
        </div>
      </div>

      <div
        style={{
          position: "relative",
          minHeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Center product node */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(108,71,255,0.4)",
              border: "2px solid rgba(167,139,250,0.5)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 4 }}>🎯</div>
            <div
              style={{
                color: "white",
                fontSize: 9,
                fontWeight: 700,
                textAlign: "center",
                padding: "0 8px",
                lineHeight: 1.3,
              }}
            >
              {String(analysisReport?.product_name ?? "").substring(0, 20)}
            </div>
          </div>
        </div>

        {/* SVG connecting lines */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {saturated.map((_: Angle, i: number) => {
            const total = saturated.length;
            const angle = -60 + i * (120 / Math.max(total - 1, 1));
            const rad = ((angle - 90) * Math.PI) / 180;
            const x2 = 50 + Math.cos(rad) * 30;
            const y2 = 50 + Math.sin(rad) * 30;
            return (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="rgba(255,68,68,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            );
          })}
          {untapped.map((_: Angle, i: number) => {
            const total = untapped.length;
            const angle = 60 + i * (120 / Math.max(total - 1, 1));
            const rad = ((angle - 90) * Math.PI) / 180;
            const x2 = 50 + Math.cos(rad) * 30;
            const y2 = 50 + Math.sin(rad) * 30;
            return (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="rgba(0,212,170,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            );
          })}
          {emerging.map((_: Angle, i: number) => {
            const total = emerging.length;
            const angle = 180 + i * (60 / Math.max(total - 1, 1));
            const rad = ((angle - 90) * Math.PI) / 180;
            const x2 = 50 + Math.cos(rad) * 28;
            const y2 = 50 + Math.sin(rad) * 28;
            return (
              <line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="rgba(108,71,255,0.3)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            );
          })}
        </svg>

        {/* SATURATED — left side */}
        <div
          style={{
            position: "absolute",
            left: "2%",
            top: "10%",
            width: "22%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              color: "#ff6b6b",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            SATURATED
          </div>
          {saturated.map((angle, i) => (
            <div
              key={i}
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
                background: "rgba(255,68,68,0.06)",
                border: "1px solid rgba(255,68,68,0.25)",
                borderRadius: 50,
                padding: "10px 14px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,68,68,0.15)";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,68,68,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                {angle.saturation ?? 0}% sat.
              </div>
              <div style={{ color: "#888", fontSize: 10, lineHeight: 1.3 }}>
                {angle.name?.substring(0, 30)}
              </div>
            </div>
          ))}
        </div>

        {/* UNTAPPED — right side */}
        <div
          style={{
            position: "absolute",
            right: "2%",
            top: "10%",
            width: "22%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              color: "#00d4aa",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            UNTAPPED ✓
          </div>
          {untapped.map((angle, i) => (
            <div
              key={i}
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
                background: "rgba(0,212,170,0.06)",
                border: "1px solid rgba(0,212,170,0.3)",
                borderRadius: 50,
                padding: "10px 14px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,212,170,0.15)";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,212,170,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                {Math.max(50, angle.success_rate ?? 50)}% success
              </div>
              <div style={{ color: "#aaa", fontSize: 10, lineHeight: 1.3 }}>
                {angle.name?.substring(0, 30)}
              </div>
            </div>
          ))}
        </div>

        {/* EMERGING — bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            left: "25%",
            right: "25%",
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {emerging.map((angle, i) => (
            <div
              key={i}
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
                background: "rgba(108,71,255,0.06)",
                border: "1px solid rgba(108,71,255,0.3)",
                borderRadius: 50,
                padding: "10px 14px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                flex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(108,71,255,0.15)";
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(108,71,255,0.06)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                EMERGING
              </div>
              <div style={{ color: "#888", fontSize: 10, lineHeight: 1.3 }}>
                {angle.name?.substring(0, 25)}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 0,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            { color: "#ff6b6b", label: "Saturated — avoid" },
            { color: "#a78bfa", label: "Emerging — test" },
            { color: "#00d4aa", label: "Untapped — launch" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }}
              />
              <span style={{ color: "#555", fontSize: 11 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
