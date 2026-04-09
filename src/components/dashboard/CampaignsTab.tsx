/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type Angle = {
  type?: string;
  name?: string;
  hook?: string;
  success_rate?: number;
  platform?: string;
};

type Analysis = {
  product_name?: string | null;
  product_image?: string | null;
  score?: number | null;
  verdict?: string | null;
  full_report?: Record<string, unknown> | null;
};

type CampaignSection = {
  icon: string;
  title: string;
  items: string[];
};

type Props = {
  analyses: Analysis[];
  analysisReport: Record<string, unknown> | null;
  setActiveTab: (tab: string) => void;
  setAnalysisReport: (report: Record<string, unknown> | null) => void;
  preselectedProduct?: Analysis | null;
};

const QUESTIONS = [
  { key: "budget", label: "What is your daily ad budget?", placeholder: "e.g. $50, $100, $300..." },
  {
    key: "experience",
    label: "Have you run Meta ads before?",
    options: ["Never", "A little", "Yes I have experience"],
  },
  {
    key: "goal",
    label: "What is your main goal?",
    options: ["Test the product first", "Scale fast", "Build a brand"],
  },
  {
    key: "timeline",
    label: "When do you want to launch?",
    options: ["Today", "This week", "Next week"],
  },
];

type Step = "home" | "select" | "questions" | "plan";

export function CampaignsTab({ analyses, analysisReport, setActiveTab, setAnalysisReport, preselectedProduct }: Props) {
  const [campaignStep, setCampaignStep] = useState<Step>(() => preselectedProduct ? "select" : "home");
  const [selectedCampaignProduct, setSelectedCampaignProduct] = useState<Analysis | null>(() => preselectedProduct ?? null);
  const [selectedCampaignAngle, setSelectedCampaignAngle] = useState<Angle | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [campaignPlan, setCampaignPlan] = useState<{ sections: CampaignSection[] } | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateCampaignPlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedCampaignProduct,
          angle: selectedCampaignAngle,
          answers,
          report: analysisReport,
        }),
      });
      const data = (await res.json()) as { plan?: { sections: CampaignSection[] } };
      setCampaignPlan(data.plan ?? null);
      setCampaignStep("plan");
    } catch {
      /* ignore */
    }
    setGenerating(false);
  };

  // Color palette for campaign sections
  const SECTION_COLORS = [
    { bg: "rgba(108,71,255,0.08)", border: "rgba(108,71,255,0.22)", accent: "#a78bfa", dot: "#6c47ff" },
    { bg: "rgba(24,119,242,0.08)", border: "rgba(24,119,242,0.22)", accent: "#60a5fa", dot: "#1877f2" },
    { bg: "rgba(0,212,170,0.07)", border: "rgba(0,212,170,0.22)", accent: "#34d399", dot: "#00d4aa" },
    { bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.22)", accent: "#fbbf24", dot: "#f59e0b" },
    { bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.18)", accent: "#f87171", dot: "#ef4444" },
    { bg: "rgba(168,85,247,0.07)", border: "rgba(168,85,247,0.22)", accent: "#c084fc", dot: "#a855f7" },
  ];

  if (campaignStep === "plan" && campaignPlan)
    return (
      <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
        <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <button
          type="button"
          onClick={() => setCampaignStep("home")}
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
          ← Back
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
              Your Campaign Plan
            </div>
            <div style={{ color: "#555", fontSize: 13 }}>
              Angle: <span style={{ color: "#a78bfa" }}>{selectedCampaignAngle?.name ?? "—"}</span>
              &nbsp;·&nbsp;Budget: <span style={{ color: "#00d4aa" }}>{answers.budget}/day</span>
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(24,119,242,0.08)",
              border: "1px solid rgba(24,119,242,0.2)",
              borderRadius: 10,
              padding: "8px 14px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877f2">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            <span style={{ color: "#1877f2", fontWeight: 600, fontSize: 12 }}>Meta Partner</span>
          </div>
        </div>

        {/* Sections grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {(campaignPlan.sections ?? []).map((section, i) => {
            const c = SECTION_COLORS[i % SECTION_COLORS.length]!;
            return (
              <div
                key={i}
                style={{
                  background: c.bg,
                  borderRadius: 14,
                  border: `1px solid ${c.border}`,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 16 }}>{section.icon}</span>
                  <span style={{ color: c.accent, fontWeight: 700, fontSize: 13 }}>{section.title}</span>
                </div>
                {/* Items as compact chips */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(section.items ?? []).map((item, j) => {
                    // Split on ":" to show key:value style when possible
                    const colonIdx = item.indexOf(":");
                    const hasColon = colonIdx > 0 && colonIdx < 30;
                    const key = hasColon ? item.substring(0, colonIdx).trim() : null;
                    const val = hasColon ? item.substring(colonIdx + 1).trim() : item;
                    return (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          background: "rgba(0,0,0,0.25)",
                          borderRadius: 8,
                          padding: "8px 10px",
                        }}
                      >
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: c.dot, flexShrink: 0, marginTop: 6 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {key && (
                            <span style={{ color: c.accent, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 1 }}>
                              {key}
                            </span>
                          )}
                          <span style={{ color: "#bbb", fontSize: 12, lineHeight: 1.5 }}>{val}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setActiveTab("angles")}
            style={{
              background: "rgba(108,71,255,0.1)",
              border: "1px solid rgba(108,71,255,0.3)",
              borderRadius: 12,
              padding: 14,
              color: "#a78bfa",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            📢 View Competitor Ads
          </button>
          <button
            type="button"
            style={{
              background: "#6c47ff",
              border: "none",
              borderRadius: 12,
              padding: 14,
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✦ Generate My Ad Creatives
          </button>
        </div>

        <div
          style={{
            background: "rgba(0,212,170,0.05)",
            border: "1px solid rgba(0,212,170,0.2)",
            borderRadius: 12,
            padding: 14,
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ color: "#00d4aa", fontWeight: 600, fontSize: 13 }}>Already running ads?</div>
            <div style={{ color: "#555", fontSize: 12 }}>Upload your results and we'll tell you what to do next</div>
          </div>
          <button
            type="button"
            onClick={() => setCampaignStep("home")}
            style={{
              background: "#00d4aa",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#003322",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Upload Results →
          </button>
        </div>
      </div>
    );

  if (campaignStep === "questions")
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", animation: "fadeSlideUp 0.3s ease" }}>
        <button
          type="button"
          onClick={() => setCampaignStep("select")}
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
          ← Back
        </button>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{ color: "white", fontWeight: 800, fontSize: 22, marginBottom: 8 }}
          >
            A few quick questions
          </div>
          <div style={{ color: "#555", fontSize: 14 }}>
            So we can build your exact campaign structure
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {QUESTIONS.map((q, i) => (
            <div
              key={i}
              style={{
                background: "#0c0c14",
                borderRadius: 14,
                border: "1px solid rgba(108,71,255,0.12)",
                padding: 20,
              }}
            >
              <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
                {q.label}
              </div>
              {"options" in q && q.options ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt }))}
                      style={{
                        background: answers[q.key] === opt ? "#6c47ff" : "#111",
                        border: `1px solid ${answers[q.key] === opt ? "#6c47ff" : "#222"}`,
                        borderRadius: 8,
                        padding: "8px 16px",
                        color: answers[q.key] === opt ? "white" : "#666",
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={q.placeholder}
                  value={answers[q.key] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                  style={{
                    width: "100%",
                    background: "#111",
                    border: "1px solid #222",
                    borderRadius: 8,
                    padding: "12px 14px",
                    color: "white",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#6c47ff")}
                  onBlur={(e) => (e.target.style.borderColor = "#222")}
                />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => void generateCampaignPlan()}
            disabled={generating || !answers.budget}
            style={{
              background: answers.budget ? "#6c47ff" : "#333",
              border: "none",
              borderRadius: 12,
              padding: 16,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: answers.budget ? "pointer" : "not-allowed",
              marginTop: 8,
            }}
          >
            {generating ? "Building your campaign plan..." : "Generate My Campaign Plan →"}
          </button>
        </div>
      </div>
    );

  if (campaignStep === "select")
    return (
      <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
        <button
          type="button"
          onClick={() => setCampaignStep("home")}
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
          ← Back
        </button>
        <div
          style={{ color: "white", fontWeight: 700, fontSize: 20, marginBottom: 6 }}
        >
          Choose an angle for {selectedCampaignProduct?.product_name}
        </div>
        <div style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>
          Pick the angle you want to launch with. We recommend the untapped ones.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {((analysisReport?.angles ?? []) as Angle[])
            .filter((a) => a.type !== "SATURATED")
            .map((angle, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedCampaignAngle(angle);
                  setCampaignStep("questions");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCampaignAngle(angle);
                    setCampaignStep("questions");
                  }
                }}
                style={{
                  background: "#0c0c14",
                  borderRadius: 14,
                  border: `1px solid ${angle.type === "UNTAPPED" ? "rgba(0,212,170,0.2)" : "rgba(108,71,255,0.2)"}`,
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div
                  style={{
                    background: angle.type === "UNTAPPED" ? "#00d4aa22" : "#a78bfa22",
                    color: angle.type === "UNTAPPED" ? "#00d4aa" : "#a78bfa",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: 20,
                    flexShrink: 0,
                  }}
                >
                  {angle.type}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {angle.name}
                  </div>
                  <div style={{ color: "#888", fontSize: 12, fontStyle: "italic" }}>
                    &quot;{angle.hook}&quot;
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14 }}>
                    {angle.success_rate}%
                  </div>
                  <div style={{ color: "#444", fontSize: 10 }}>success rate</div>
                </div>
                <div style={{ color: "#333", fontSize: 18 }}>→</div>
              </div>
            ))}
        </div>
      </div>
    );

  // Home
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(24,119,242,0.08)",
            border: "1px solid rgba(24,119,242,0.2)",
            borderRadius: 12,
            padding: "10px 20px",
            marginBottom: 20,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          <span style={{ color: "#1877f2", fontWeight: 700, fontSize: 13 }}>
            Official Meta Business Partner
          </span>
        </div>
        <h2
          style={{ color: "white", fontWeight: 900, fontSize: 32, marginBottom: 10, marginTop: 0 }}
        >
          Launch Your First Campaign
        </h2>
        <p
          style={{
            color: "#555",
            fontSize: 15,
            maxWidth: 500,
            margin: "0 auto 12px",
          }}
        >
          We will guide you step by step to launch and structure your Meta ads campaign. No experience
          needed.
        </p>
        <button
          type="button"
          style={{
            background: "rgba(0,212,170,0.1)",
            border: "1px solid rgba(0,212,170,0.3)",
            borderRadius: 10,
            padding: "10px 20px",
            color: "#00d4aa",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          📊 Upload My Ad Results
        </button>
      </div>

      <div style={{ color: "#888", fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
        Choose a product to launch:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {analyses.map((analysis, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedCampaignProduct(analysis);
              setAnalysisReport(analysis.full_report ?? null);
              setCampaignStep("select");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedCampaignProduct(analysis);
                setAnalysisReport(analysis.full_report ?? null);
                setCampaignStep("select");
              }
            }}
            style={{
              background: "#0c0c14",
              borderRadius: 14,
              border: "1px solid rgba(108,71,255,0.12)",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#6c47ff";
              e.currentTarget.style.background = "#0e0e1a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(108,71,255,0.12)";
              e.currentTarget.style.background = "#0c0c14";
            }}
          >
            <img
              src={analysis.product_image ?? "/massager.jpg"}
              style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
              alt=""
              onError={(e) => {
                e.currentTarget.src = "/massager.jpg";
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>
                {analysis.product_name}
              </div>
              <div style={{ color: "#555", fontSize: 12 }}>
                Score: {analysis.score}/100 · {analysis.verdict}
              </div>
            </div>
            <div style={{ color: "#6c47ff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
              Launch →
            </div>
          </div>
        ))}
        {analyses.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              background: "#0c0c14",
              borderRadius: 16,
              border: "1px solid rgba(108,71,255,0.12)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ color: "white", fontWeight: 600, marginBottom: 8 }}>
              No products analyzed yet
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              style={{
                background: "#6c47ff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                color: "white",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Analyze First Product →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
