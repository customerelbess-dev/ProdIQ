/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { ProdIqLogoImg } from "@/components/ProdIqLogoImg";

const MASSAGER = "/massager.jpg";

type AdCard = {
  img: string;
  brand: string;
  platform: string;
  platformColor: string;
  days: string;
  ctr: string;
  headline: string;
  weakness: string;
};

function buildAdsFromReport(report: Record<string, unknown>, productName: string): AdCard[] {
  const insights = report.ads_insights as { competitor_ads?: Record<string, unknown>[] } | undefined;
  const fromInsights = insights?.competitor_ads;
  if (fromInsights?.length) {
    return fromInsights.slice(0, 8).map((a) => {
      const plat = String(a.platform ?? "Meta");
      const platformColor = plat === "TikTok" ? "#010101" : "#1877f2";
      return {
        img: MASSAGER,
        brand: String(a.brand ?? "Competitor"),
        platform: plat,
        platformColor,
        days: String(a.days_running ?? "—"),
        ctr: String(a.ctr_or_views ?? "—"),
        headline: String(a.headline ?? a.weakness ?? "Sponsored"),
        weakness: String(a.weakness ?? "—"),
      };
    });
  }
  const comps = (report.competitors as Record<string, unknown>[] | undefined) ?? [];
  return comps.slice(0, 8).map((c) => ({
    img: MASSAGER,
    brand: String(c.name ?? "Brand"),
    platform: "Meta",
    platformColor: "#1877f2",
    days: "—",
    ctr: String(c.monthly_revenue ?? c.price ?? "—"),
    headline: String(c.main_angle ?? c.name ?? productName),
    weakness: String(c.weakness ?? "—"),
  }));
}

const SUB_TABS = [
  { label: "Ad Library", icon: "◎" },
  { label: "Their Angles", icon: "🎯" },
  { label: "My Generations", icon: "✦" },
  { label: "Weaknesses", icon: "⚠" },
] as const;

type Props = {
  report: Record<string, unknown>;
  productName: string;
};

export function DashboardAdsPremium({ report, productName }: Props) {
  const [adsSub, setAdsSub] = useState(0);
  const [platFilter, setPlatFilter] = useState(0);

  const cards = useMemo(() => buildAdsFromReport(report, productName), [report, productName]);
  const padded = useMemo(() => {
    const base = [...cards];
    while (base.length < 8) {
      base.push({
        img: MASSAGER,
        brand: "—",
        platform: "Meta",
        platformColor: "#1877f2",
        days: "—",
        ctr: "—",
        headline: "Awaiting more ad signals from research",
        weakness: "—",
      });
    }
    return base.slice(0, 8);
  }, [cards]);

  return (
    <div className="pointer-events-auto w-full select-text">
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
          {SUB_TABS.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setAdsSub(i)}
              style={{
                padding: "12px 18px",
                fontSize: 12,
                color: adsSub === i ? "#ffffff" : "#444",
                borderBottom: adsSub === i ? "2px solid #6c47ff" : "2px solid transparent",
                fontWeight: adsSub === i ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                borderLeft: "none",
                borderRight: "none",
                borderTop: "none",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 11 }}>{tab.icon}</span>
              {tab.label}
              {adsSub === i && (
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
                  {padded.filter((c) => c.brand !== "—").length}
                </span>
              )}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, padding: "8px 0", flexWrap: "wrap" }}>
            {(["Platform ▾", "Engagement ▾", "Newest ▾"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setPlatFilter(i)}
                style={{
                  background: platFilter === i ? "#1a1a24" : "#111",
                  border: "1px solid #1a1a1a",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 10,
                  color: "#444",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 20px 8px", borderBottom: "1px solid #111" }}>
          <span style={{ color: "#444", fontSize: 11, fontWeight: 600 }}>
            Competitor ads — {productName}
            {adsSub === 1 ? " · angle lens" : adsSub === 2 ? " · generations" : adsSub === 3 ? " · weaknesses" : ""}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ padding: "16px 20px", gap: 12 }}>
          {padded.map((ad, i) => (
            <div
              key={i}
              style={{
                background: "#080810",
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #1a1a1a",
              }}
            >
              <div style={{ position: "relative", height: 160 }}>
                <img
                  src={ad.img}
                  alt={ad.brand}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    e.currentTarget.src = MASSAGER;
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
                    {adsSub === 3 ? `⚠ ${ad.weakness}` : ad.headline}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
                    {ad.brand} · Sponsored
                  </div>
                </div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ProdIqLogoImg preset="tab" />
            <span style={{ color: "#555", fontSize: 12 }}>Live competitor feed · {productName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
