/* eslint-disable @next/next/no-img-element -- dashboard uses dynamic remote URLs */
"use client";

import type { CSSProperties } from "react";
import { useId } from "react";
import { ProdIqLogoImg } from "@/components/ProdIqLogoImg";
import { getSuccessRate, getVerdictBg, getVerdictBorder, getVerdictColor } from "@/lib/dashboard-helpers";

const sectionCard: CSSProperties = {
  background: "#0c0c14",
  borderRadius: 16,
  border: "1px solid rgba(108,71,255,0.12)",
  padding: "16px 24px",
};

const graphData: Record<string, { points: string; label: string }> = {
  "30": {
    points: "M0 90 C50 85 100 75 150 65 C200 55 250 45 300 35 C350 25 380 18 400 10",
    label: "Last 30 days",
  },
  "90": {
    points: "M0 95 C80 88 160 75 240 58 C320 42 370 25 400 8",
    label: "Last 90 days",
  },
  "365": {
    points: "M0 100 C60 92 120 80 180 68 C240 55 300 38 350 22 C380 14 395 8 400 5",
    label: "Last 365 days",
  },
};

function parseBarWidth(w: string | undefined): number {
  if (!w) return 40;
  const n = parseInt(String(w).replace(/%/g, ""), 10);
  return Number.isFinite(n) ? Math.min(100, Math.max(8, n)) : 40;
}

function fillPathFromLine(lineD: string, bottomY = 100): string {
  return `${lineD} L400 ${bottomY} L0 ${bottomY}Z`;
}

type MarketPremiumProps = {
  report: Record<string, unknown>;
  analysisSource?: { full_report?: Record<string, unknown> | null; potential_success?: unknown } | null;
  revenueFilter: string;
  setRevenueFilter: (d: string) => void;
  elapsedSec?: number;
};

export function DashboardMarketPremium({
  report,
  analysisSource,
  revenueFilter,
  setRevenueFilter,
  elapsedSec,
}: MarketPremiumProps) {
  const trendGradId = useId().replace(/:/g, "");
  const searchGradId = useId().replace(/:/g, "");
  const market = (report.market ?? {}) as Record<string, unknown>;
  const profit = (report.profit_estimate ?? {}) as Record<string, unknown>;
  const verdict = String(report.verdict ?? "—");
  const score = typeof report.score === "number" ? report.score : 0;
  const potentialSuccess = getSuccessRate(analysisSource ?? null, report);
  const verdictReason = String(report.verdict_reason ?? market.trend_reason ?? "Market read from live research");
  const sb = (report.score_breakdown ?? {}) as Record<string, number>;
  const legacySb =
    sb.pain_point == null &&
    sb.wow_factor == null &&
    sb.emotion == null &&
    sb.angle_opportunity == null;
  const painScore = legacySb ? (sb.profit ?? 0) : (sb.pain_point ?? 0);
  const marginScore = sb.profit_potential ?? sb.profit ?? 0;
  const wowScore = sb.wow_factor ?? sb.angle_potential ?? 0;
  const emotionScore = sb.emotion ?? sb.trend ?? 0;
  const compScore = sb.competition_angle ?? sb.angle_opportunity ?? sb.competition ?? 0;
  const breakdownRows = [
    { label: "Demand", max: 100, icon: "🔥", val: sb.demand ?? 0 },
    { label: "Pain Point", max: 100, icon: "💊", val: painScore },
    { label: "Wow Factor", max: 100, icon: "⚡", val: wowScore },
    { label: "Emotion", max: 100, icon: "❤️", val: emotionScore },
    { label: "Competition", max: 100, icon: "⚔️", val: compScore },
    { label: "Profit", max: 100, icon: "💰", val: marginScore },
  ];
  const platforms = (market.best_platforms as string[] | undefined) ?? [];
  const topCountries =
    (market.top_countries as { flag?: string; country?: string; width?: string; demand?: string }[]) ?? [];
  const trend = String(market.trend ?? "Stable");
  const trendColor = trend === "Growing" ? "#00d4aa" : trend === "Declining" ? "#ff4444" : "#f59e0b";
  const productName = String(report.product_name ?? "");
  const trendDataRaw = market.trend_data as unknown;
  const trendData = Array.isArray(trendDataRaw)
    ? trendDataRaw.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    : [];
  const amazonData = report.amazon_data as
    | { rating?: string; reviews_count?: number; price?: string; bsr_rank?: string }
    | undefined;

  const platformBadges = [
    { letter: "S", bg: "#96BF48" },
    { letter: "f", bg: "#1877f2" },
    { letter: "T", bg: "#000" },
    { letter: "P", bg: "#6c47ff" },
  ] as const;

  // Compute average unit price from price_range like "$10-$30"
  const priceRangeRaw = String(market.price_range ?? "");
  const priceNums = priceRangeRaw.match(/[\d.]+/g)?.map(Number).filter((n) => Number.isFinite(n) && n > 0) ?? [];
  const avgNum =
    priceNums.length >= 2
      ? (priceNums[0]! + priceNums[priceNums.length - 1]!) / 2
      : priceNums.length === 1
        ? priceNums[0]!
        : 0;
  const avgUnitPrice =
    avgNum > 0 ? `$${Math.round(avgNum)}` : priceRangeRaw || "—";

  // Smart sell price: 12-20% above avg, rounded up to nearest X9 (psychological pricing)
  const smartSellPrice = (() => {
    if (avgNum <= 0) {
      // Fall back to first price from AI suggestion
      const sellRaw = String(profit.sell_price ?? "");
      const m = sellRaw.match(/\$[\d.,]+/);
      return m ? m[0] : sellRaw || "—";
    }
    const bumpRate = avgNum < 20 ? 0.20 : avgNum < 50 ? 0.15 : avgNum < 100 ? 0.12 : 0.15;
    const raw = avgNum * (1 + bumpRate);
    const rounded = Math.round(raw);
    // Round up to nearest X9 (e.g. 34 → 39, 45 → 49, 148 → 149)
    const nearestNine = Math.ceil((rounded + 1) / 10) * 10 - 1;
    return `$${nearestNine}`;
  })();

  const stats = [
    { label: "Market Size", value: String(market.size ?? "—"), change: trend === "Growing" ? "+12%" : "—", color: "#00d4aa" },
    { label: "Avg Unit Price", value: avgUnitPrice, change: "market avg", color: "#6c47ff" },
    { label: "You should sell for", value: smartSellPrice, change: "per unit", color: "#f59e0b" },
    { label: "Margin", value: String(profit.margin ?? "—"), change: "Est.", color: "#00d4aa" },
  ];

  const countries = topCountries.length
    ? topCountries.map((c) => ({
        flag: c.flag ?? "🌐",
        country: c.country ?? "—",
        revenue: String(c.demand ?? ""),
        bar: parseBarWidth(c.width),
        color: "#6c47ff",
      }))
    : [{ flag: "🌐", country: "No geo split in data", revenue: "—", bar: 20, color: "#333" }];

  const periodKey = graphData[revenueFilter] ? revenueFilter : "90";
  const linePath = graphData[periodKey].points;
  const fillD = fillPathFromLine(linePath);

  const platformList =
    platforms.length > 0 ? platforms : ["TikTok Shop", "Shopify", "Amazon", "Meta Ads"];
  const barWidths = ["88%", "75%", "62%", "48%"];
  const barColors = ["#6c47ff", "#00d4aa", "#f59e0b", "#ff6b6b"];

  return (
    <div className="flex w-full flex-col gap-4">
      <style>{`
        @keyframes marketGraphPathIn {
          from { opacity: 0.35; }
          to { opacity: 1; }
        }
        .dash-market-trend-path {
          animation: marketGraphPathIn 0.45s ease forwards;
        }
      `}</style>

      <div style={sectionCard}>
        <div
          style={{
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

      <div style={sectionCard}>
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
          {platforms.slice(0, 4).map((pl) => (
            <span key={pl} style={{ color: "#555", fontSize: 11 }}>
              {pl}
            </span>
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
                  {stat.change}
                </span>
              </div>
              <div style={{ color: stat.color, fontSize: 22, fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
        className="max-md:flex-col"
      >
        <div
          style={{
            background: "#0c0c14",
            borderRadius: 16,
            border: "1px solid rgba(108,71,255,0.12)",
            padding: 24,
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: "#555",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            PRODUCT SCORE
          </div>
          <div style={{ color: "#6c47ff", fontWeight: 900, fontSize: 56, lineHeight: 1 }}>{score}</div>
          <div style={{ color: "#333", fontSize: 14, marginBottom: 12 }}>/100</div>
          <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2 }}>
            <div
              style={{
                width: `${Math.min(100, score)}%`,
                height: 4,
                background: "linear-gradient(90deg, #6c47ff, #a78bfa)",
                borderRadius: 2,
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: "#0c0c14",
            borderRadius: 16,
            border: "1px solid rgba(0,212,170,0.2)",
            padding: 24,
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: "#555",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            SUCCESS POTENTIAL
          </div>
          <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 56, lineHeight: 1 }}>
            {potentialSuccess != null ? potentialSuccess : "--"}
          </div>
          <div style={{ color: "#333", fontSize: 14, marginBottom: 12 }}>%</div>
          <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2 }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, potentialSuccess ?? 0))}%`,
                height: 4,
                background: "linear-gradient(90deg, #00d4aa, #00ff88)",
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ color: "#555", fontSize: 11, marginTop: 8 }}>If launched with best angle</div>
        </div>

        <div
          style={{
            background: getVerdictBg(verdict),
            borderRadius: 16,
            border: `1px solid ${getVerdictBorder(verdict)}`,
            padding: 24,
            textAlign: "center",
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {verdict === "GO" ? "✅" : verdict === "NO-GO" ? "❌" : "⚠️"}
          </div>
          <div
            style={{
              color: getVerdictColor(verdict),
              fontWeight: 900,
              fontSize: 22,
              marginBottom: 6,
            }}
          >
            {verdict}
          </div>
          <div style={{ color: "#555", fontSize: 12, lineHeight: 1.5 }}>
            {verdictReason.length > 110 ? verdictReason.substring(0, 110).trimEnd() + "…" : verdictReason}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}
        className="max-lg:grid-cols-2 max-sm:grid-cols-1"
      >
        {breakdownRows.map((item, i) => {
          const val = item.val;
          const barPct = item.max > 0 ? Math.min(100, (val / item.max) * 100) : 0;
          return (
            <div
              key={i}
              style={{
                background: "#0c0c14",
                borderRadius: 12,
                border: "1px solid rgba(108,71,255,0.12)",
                padding: 14,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
              <div
                style={{
                  color: "#555",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                {item.label.toUpperCase()}
              </div>
              <div style={{ color: "#6c47ff", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{val}</div>
              <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2 }}>
                <div style={{ width: `${barPct}%`, height: 3, background: "#6c47ff", borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div style={{ ...sectionCard, margin: 0 }}>
          <div style={{ color: "#666", fontSize: 11, fontWeight: 600, marginBottom: 12 }}>TOP MARKETS</div>
          {countries.map((c) => (
            <div key={c.country} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{c.flag}</span>
              <span style={{ color: "#888", fontSize: 12, width: 110, flexShrink: 0 }}>{c.country}</span>
              <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 2, minWidth: 0 }}>
                <div style={{ width: `${c.bar}%`, height: 4, background: c.color, borderRadius: 2 }} />
              </div>
              <span style={{ color: "#00d4aa", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{c.revenue}</span>
            </div>
          ))}
        </div>

        <div style={{ ...sectionCard, margin: 0 }}>
          <div style={{ color: "#666", fontSize: 11, fontWeight: 600, marginBottom: 12 }}>DEMAND TREND</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "#555", fontSize: 11 }}>{graphData[periodKey].label}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {(["30", "90", "365"] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRevenueFilter(days)}
                  style={{
                    background: revenueFilter === days ? "#6c47ff" : "#111",
                    border: `1px solid ${revenueFilter === days ? "#6c47ff" : "#222"}`,
                    borderRadius: 8,
                    padding: "6px 16px",
                    color: revenueFilter === days ? "white" : "#555",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Last {days} days
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", height: 100 }}>
            <svg
              key={periodKey}
              width="100%"
              height={100}
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
              aria-hidden
              className="dash-market-trend-path"
            >
              <defs>
                <linearGradient id={trendGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c47ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6c47ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={linePath} fill="none" stroke="#6c47ff" strokeWidth={2.5} style={{ transition: "stroke 0.35s ease" }} />
              <path d={fillD} fill={`url(#${trendGradId})`} style={{ transition: "opacity 0.35s ease" }} />
            </svg>
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                background: `${trendColor}22`,
                border: `1px solid ${trendColor}`,
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 11,
                color: trendColor,
                fontWeight: 700,
              }}
            >
              {trend === "Growing" ? "↗" : trend === "Declining" ? "↘" : "→"} {trend}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {(["Jan", "Mar", "Jun", "Now"] as const).map((m) => (
              <span key={m} style={{ color: "#444", fontSize: 10 }}>
                {m}
              </span>
            ))}
          </div>
          {trendData.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "#555", fontSize: 10, fontWeight: 600, marginBottom: 6 }}>
                SERIES FROM RESEARCH (LAST {Math.min(12, trendData.length)} POINTS)
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 4,
                  alignItems: "flex-end",
                  height: 40,
                }}
              >
                {trendData.slice(-12).map((val, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: "#6c47ff",
                      borderRadius: 2,
                      opacity: 0.4 + (val / 100) * 0.6,
                      height: Math.max(4, (val / 100) * 40),
                      transition: "height 0.5s ease",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {amazonData && typeof amazonData.reviews_count === "number" && amazonData.reviews_count > 0 ? (
        <div
          style={{
            background: "#0c0c14",
            borderRadius: 12,
            border: "1px solid rgba(108,71,255,0.12)",
            padding: 16,
            marginTop: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>📦</span>
            <span style={{ color: "#888", fontSize: 12, fontWeight: 600 }}>AMAZON DATA</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="max-sm:grid-cols-2">
            {[
              { label: "Rating", value: `${amazonData.rating ?? "—"}★` },
              { label: "Reviews", value: amazonData.reviews_count.toLocaleString() },
              { label: "Price", value: amazonData.price ?? "—" },
              { label: "BSR", value: amazonData.bsr_rank ?? "—" },
            ].map((item, i) => (
              <div key={i} style={{ background: "#111", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ color: "#444", fontSize: 9, fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{item.value || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={sectionCard}>
        <div style={{ color: "#666", fontSize: 12 }}>
          Score {score}/100
          {potentialSuccess != null ? ` · Success potential ${potentialSuccess}%` : ""}
          {elapsedSec != null ? ` · Generated in ${elapsedSec.toFixed(1)}s` : ""}
        </div>
      </div>

      <div style={{ ...sectionCard, marginTop: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ color: "#555", fontSize: 11, fontWeight: 600, letterSpacing: "1px" }}>GOOGLE SEARCH TRENDS</div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginTop: 4 }}>Search interest over time</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6c47ff" }} />
            <span style={{ color: "#555", fontSize: 11 }}>{productName || "Product"}</span>
          </div>
        </div>
        <svg width="100%" height={80} viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={searchGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c47ff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6c47ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d="M0 70 C40 65 80 55 120 48 C160 40 180 50 220 42 C260 34 300 20 340 18 C380 16 420 25 460 15 C500 8 550 5 600 3"
            fill="none"
            stroke="#6c47ff"
            strokeWidth={2}
          />
          <path
            d="M0 70 C40 65 80 55 120 48 C160 40 180 50 220 42 C260 34 300 20 340 18 C380 16 420 25 460 15 C500 8 550 5 600 3 L600 80 L0 80Z"
            fill={`url(#${searchGradId})`}
          />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 4 }}>
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Now"].map((m) => (
            <span key={m} style={{ color: "#333", fontSize: 9 }}>
              {m}
            </span>
          ))}
        </div>
        <a
          href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(productName)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", marginTop: 12, color: "#6c47ff", fontSize: 12, textDecoration: "none" }}
        >
          View on Google Trends ↗
        </a>
      </div>

      <div style={sectionCard}>
        <div style={{ color: "#555", fontSize: 11, fontWeight: 600, letterSpacing: "1px", marginBottom: 16 }}>
          SEASONALITY & BEST MONTHS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6 }}>
          {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((month, i) => {
            const heights = [40, 35, 55, 65, 80, 90, 95, 85, 70, 60, 75, 85];
            const h = heights[i] ?? 40;
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      background: h > 70 ? "#6c47ff" : "#1a1a2e",
                      borderRadius: "3px 3px 0 0",
                      height: `${h}%`,
                      transition: "height 0.5s ease",
                    }}
                  />
                </div>
                <div style={{ color: h > 70 ? "#6c47ff" : "#333", fontSize: 9, fontWeight: h > 70 ? 700 : 400 }}>{month}</div>
              </div>
            );
          })}
        </div>
        <div style={{ color: "#555", fontSize: 12, marginTop: 12 }}>{String(market.seasonal ?? "—")}</div>
      </div>

      <div style={sectionCard}>
        <div style={{ color: "#555", fontSize: 11, fontWeight: 600, letterSpacing: "1px", marginBottom: 16 }}>BEST SELLING PLATFORMS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {platformList.map((platform, i) => (
            <div key={`${platform}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 90, color: "#888", fontSize: 12, textAlign: "right" }}>{platform}</div>
              <div style={{ flex: 1, height: 6, background: "#1a1a1a", borderRadius: 3 }}>
                <div
                  style={{
                    width: barWidths[i] || "40%",
                    height: 6,
                    background: barColors[i] || "#6c47ff",
                    borderRadius: 3,
                  }}
                />
              </div>
              <div style={{ color: "#555", fontSize: 11, width: 30 }}>{barWidths[i] || "40%"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
