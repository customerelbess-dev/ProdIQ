/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";

function adsLibraryDomain(website: string): string {
  const s = String(website ?? "").trim();
  if (!s) return "";
  try {
    const u = /^https?:\/\//i.test(s) ? new URL(s) : new URL(`https://${s}`);
    return u.hostname.replace(/^www\./, "") || "";
  } catch {
    return "";
  }
}

/** Image-style cards vs thumbnail + play (TikTok / YouTube / Meta video) */
function isVideoSlot(ad: Record<string, unknown>): boolean {
  if (ad.is_video === true) return true;
  if (String(ad.video ?? "").trim().length > 0) return true;
  const p = String(ad.platform ?? "");
  return p === "TikTok" || p === "YouTube";
}

type Props = {
  report: Record<string, unknown>;
  realAds: Record<string, unknown>[];
  adsLoading: boolean;
  adsMarketInsight: string;
};

export function DashboardAdsIntelligence({ report, realAds, adsLoading, adsMarketInsight }: Props) {
  const [adsSubTab, setAdsSubTab] = useState("library");
  const [adsGenTab, setAdsGenTab] = useState<"image" | "video">("image");
  const comps = (report.competitors as Record<string, unknown>[]) ?? [];
  const productNameForSearch = String(report.product_name ?? "");

  const imageAds = useMemo(() => realAds.filter((ad) => !isVideoSlot(ad)), [realAds]);
  const videoAds = useMemo(() => realAds.filter((ad) => isVideoSlot(ad)), [realAds]);

  return (
    <div>
      <style>{`@keyframes dashAdLibrarySpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ color: "white", fontWeight: 700, fontSize: 20 }}>Ad Intelligence</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              color: "#666",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⊕ Import Ads
          </button>
          <button
            type="button"
            style={{
              background: "#6c47ff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ✦ Generate with AI
          </button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: 20, gap: 0, flexWrap: "wrap" }}>
        {[
          { key: "library", label: "Ad Library", icon: "◎", count: comps.length },
          { key: "weaknesses", label: "Weaknesses", icon: "⚠", count: comps.length },
          { key: "generations", label: "My Generations", icon: "✦", count: 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setAdsSubTab(tab.key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: adsSubTab === tab.key ? "2px solid #6c47ff" : "2px solid transparent",
              padding: "10px 18px",
              fontSize: 13,
              color: adsSubTab === tab.key ? "white" : "#444",
              fontWeight: adsSubTab === tab.key ? 600 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count > 0 ? (
              <span
                style={{
                  background: adsSubTab === tab.key ? "#6c47ff22" : "#111",
                  color: adsSubTab === tab.key ? "#6c47ff" : "#444",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 10,
                }}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}

      </div>

      {adsSubTab === "library" && (
        <div>
          {adsLoading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  border: "2px solid rgba(108,71,255,0.2)",
                  borderTop: "2px solid #6c47ff",
                  borderRadius: "50%",
                  animation: "dashAdLibrarySpin 1s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <div style={{ color: "#555", fontSize: 14 }}>
                Searching competitor ads on Meta, TikTok and Instagram...
              </div>
            </div>
          ) : realAds.length > 0 ? (
            <div>
              {adsMarketInsight ? (
                <div
                  style={{
                    background: "rgba(108,71,255,0.08)",
                    border: "1px solid rgba(108,71,255,0.2)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 20,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🧠</span>
                  <div>
                    <div
                      style={{
                        color: "#6c47ff",
                        fontSize: 10,
                        fontWeight: 700,
                        marginBottom: 4,
                        letterSpacing: 1,
                      }}
                    >
                      AI MARKET INSIGHT
                    </div>
                    <div style={{ color: "#888", fontSize: 13, lineHeight: 1.6 }}>{adsMarketInsight}</div>
                  </div>
                </div>
              ) : null}

              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🖼</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Image Ads</span>
                  <span
                    style={{
                      background: "#111",
                      color: "#555",
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {imageAds.length}
                  </span>
                </div>
                {imageAds.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 20px",
                      background: "#0c0c14",
                      borderRadius: 16,
                      border: "1px solid rgba(108,71,255,0.12)",
                      color: "#555",
                      fontSize: 13,
                    }}
                  >
                    No static image ads in this batch — check Video Ads or run another analysis.
                  </div>
                ) : (
                  <div
                    style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
                    className="max-lg:grid-cols-2 max-sm:grid-cols-1"
                  >
                    {imageAds.slice(0, 9).map((ad, i) => {
                      const brand = String(ad.brand ?? "");
                      const website = String(ad.website ?? "");
                      const dom = adsLibraryDomain(website);
                      const platform = String(ad.platform ?? "");
                      const badgeBg = String(ad.platformColor ?? (platform === "Meta" ? "#1877f2" : "#6c47ff"));
                      const headline = String(ad.headline ?? "");
                      const body = String(ad.body ?? "");
                      const adUrl = String(ad.ad_url ?? "");
                      return (
                        <div
                          key={`img-${i}-${adUrl || headline}`}
                          style={{
                            background: "#0c0c14",
                            borderRadius: 14,
                            overflow: "hidden",
                            border: "1px solid rgba(108,71,255,0.12)",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#6c47ff";
                            e.currentTarget.style.transform = "translateY(-2px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(108,71,255,0.12)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <a href={adUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                            {ad.image ? (
                              <img
                                src={String(ad.image)}
                                alt={brand}
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  minHeight: 200,
                                  maxHeight: 400,
                                  display: "block",
                                  objectFit: "contain",
                                  background: "#0a0a12",
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.style.height = "200px";
                                    parent.style.background = "#0a0a14";
                                    parent.style.display = "flex";
                                    parent.style.alignItems = "center";
                                    parent.style.justifyContent = "center";
                                    parent.innerHTML = `<div style="text-align:center"><div style="font-size:32px;margin-bottom:8px">📢</div><div style="color:#333;font-size:12px">${brand}</div></div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  height: 200,
                                  background: "linear-gradient(135deg, #0a0a14, #111128)",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 12,
                                    background: "rgba(24,119,242,0.15)",
                                    border: "1px solid rgba(24,119,242,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#1877f2",
                                    fontWeight: 800,
                                    fontSize: 20,
                                  }}
                                >
                                  {brand.charAt(0) || "?"}
                                </div>
                                <div style={{ color: "#333", fontSize: 11 }}>Click to view ad</div>
                              </div>
                            )}
                          </a>
                          <div style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <div
                                style={{
                                  background: badgeBg,
                                  borderRadius: 4,
                                  padding: "2px 8px",
                                  fontSize: 10,
                                  color: "white",
                                  fontWeight: 700,
                                }}
                              >
                                {platform}
                              </div>
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom || "facebook.com")}&sz=14`}
                                alt=""
                                style={{ width: 14, height: 14, borderRadius: 3 }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                              <span style={{ color: "#555", fontSize: 11, fontWeight: 600 }}>{brand}</span>
                            </div>
                            {headline ? (
                              <div style={{ color: "#888", fontSize: 12, lineHeight: 1.4, marginBottom: 8 }}>
                                {headline.substring(0, 80)}
                              </div>
                            ) : null}
                            {body ? (
                              <div style={{ color: "#555", fontSize: 11, lineHeight: 1.4, marginBottom: 8 }}>
                                {body.substring(0, 100)}
                              </div>
                            ) : null}
                            <a
                              href={adUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "block",
                                background: "rgba(24,119,242,0.1)",
                                border: "1px solid rgba(24,119,242,0.3)",
                                borderRadius: 6,
                                padding: 7,
                                fontSize: 11,
                                color: "#1877f2",
                                fontWeight: 600,
                                textDecoration: "none",
                                textAlign: "center",
                              }}
                            >
                              👁 See Full Post
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 16 }}>🎥</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Video Ads</span>
                  <span style={{ background: "#111", color: "#555", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>
                    {videoAds.length}
                  </span>
                </div>
                {videoAds.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)" }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🎵</div>
                    <div style={{ color: "white", fontWeight: 600, marginBottom: 8 }}>Search TikTok directly</div>
                    <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(productNameForSearch)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#010101", border: "1px solid #333", borderRadius: 8, padding: "10px 20px", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                      🔍 Search TikTok Videos
                    </a>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {videoAds.slice(0, 9).map((ad, i) => {
                      const brand = String(ad.brand ?? "");
                      const platform = String(ad.platform ?? "TikTok");
                      const poster = String(ad.image ?? "");
                      const headline = String(ad.headline ?? "");
                      const adUrl = String(ad.ad_url ?? "");
                      const views = Number(ad.views ?? 0) || 0;
                      const website = String(ad.website ?? "");
                      const favDomain = adsLibraryDomain(website) || (platform === "TikTok" ? "tiktok.com" : platform === "YouTube" ? "youtube.com" : "facebook.com");
                      const watchHint = platform === "TikTok" ? "Watch on TikTok ↗" : platform === "YouTube" ? "Watch on YouTube ↗" : "Watch video ↗";
                      const openUrl = () => { if (adUrl) window.open(adUrl, "_blank"); };
                      return (
                        <div
                          key={`vid-${i}-${adUrl}`}
                          role="button"
                          tabIndex={0}
                          onClick={openUrl}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openUrl(); } }}
                          style={{ background: "#0c0c14", borderRadius: 14, border: "1px solid rgba(108,71,255,0.12)", display: "flex", alignItems: "center", gap: 0, overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6c47ff"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(108,71,255,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                          {/* Thumbnail — always black screen with logo + play button */}
                          <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0, background: "#000", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo.png" alt="ProdIQ" style={{ width: 32, height: 32, borderRadius: 8, opacity: 0.5 }} />
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", boxShadow: "0 2px 12px rgba(108,71,255,0.6)" }}>
                              ▶
                            </div>
                          </div>
                          {/* Content */}
                          <div style={{ flex: 1, padding: "12px 16px", minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <div style={{ background: "#6c47ff22", border: "1px solid #6c47ff44", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "#a78bfa", fontWeight: 700 }}>🎥 VIDEO AD</div>
                              <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(favDomain)}&sz=14`} alt="" style={{ width: 14, height: 14, borderRadius: 3 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              <span style={{ color: "#555", fontSize: 11, fontWeight: 600 }}>{brand}</span>
                              {views > 0 && (
                                <span style={{ marginLeft: "auto", color: "#00d4aa", fontSize: 11, fontWeight: 600 }}>
                                  {views > 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` : views > 1000 ? `${(views / 1000).toFixed(0)}K` : views} views
                                </span>
                              )}
                            </div>
                            {headline ? (
                              <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.4, marginBottom: 8, fontStyle: "italic" }}>
                                &ldquo;{headline.substring(0, 100)}&rdquo;
                              </div>
                            ) : null}
                            <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 600 }}>{watchHint}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "#0c0c14",
                  borderRadius: 16,
                  border: "1px solid rgba(108,71,255,0.12)",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                  No ads found in our database
                </div>
                <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>
                  Search directly on ad platforms for real competitor ads
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <a
                    href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&q=${encodeURIComponent(productNameForSearch)}&search_type=keyword_unordered`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#1877f2",
                      borderRadius: 8,
                      padding: "10px 18px",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    🔍 Search Meta Ads Library
                  </a>
                  <a
                    href={`https://library.tiktok.com/ads?region=US&keyword=${encodeURIComponent(productNameForSearch)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      borderRadius: 8,
                      padding: "10px 18px",
                      color: "#888",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    🎵 Search TikTok Ads
                  </a>
                </div>
              </div>
              {comps.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#444" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                  <div>No competitors in this report — run analysis to load ad data.</div>
                </div>
              ) : (
                comps.map((comp, ci) => {
                  const name = String(comp.name ?? "Competitor");
                  const website = String(comp.website ?? comp.url ?? "");
                  const dom = adsLibraryDomain(website);
                  return (
                    <div
                      key={ci}
                      style={{
                        background: "#0c0c14",
                        borderRadius: 14,
                        border: "1px solid rgba(108,71,255,0.12)",
                        padding: 16,
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      {dom ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=32`}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#111",
                            padding: 4,
                            boxSizing: "border-box",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#111",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#6c47ff",
                            fontWeight: 800,
                            fontSize: 14,
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{name}</div>
                        <div style={{ color: "#555", fontSize: 12 }}>
                          &quot;{String(comp.main_angle ?? "")}&quot;
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
                        <a
                          href={`https://www.facebook.com/ads/library/?q=${encodeURIComponent(name)}&search_type=keyword_unordered`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "#1877f222",
                            border: "1px solid #1877f244",
                            borderRadius: 6,
                            padding: "7px 12px",
                            fontSize: 11,
                            color: "#1877f2",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          Meta Ads ↗
                        </a>
                        <a
                          href={`https://library.tiktok.com/ads?region=US&keyword=${encodeURIComponent(name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "#ffffff11",
                            border: "1px solid #ffffff22",
                            borderRadius: 6,
                            padding: "7px 12px",
                            fontSize: 11,
                            color: "#888",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          TikTok ↗
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {adsSubTab === "generations" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setAdsGenTab("image")}
              style={{
                background: adsGenTab === "image" ? "#6c47ff" : "#111",
                border: `1px solid ${adsGenTab === "image" ? "#6c47ff" : "#222"}`,
                borderRadius: 10,
                padding: "10px 20px",
                color: adsGenTab === "image" ? "white" : "#555",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🖼 Image Ads
            </button>
            <button
              type="button"
              onClick={() => setAdsGenTab("video")}
              style={{
                background: adsGenTab === "video" ? "#6c47ff" : "#111",
                border: `1px solid ${adsGenTab === "video" ? "#6c47ff" : "#222"}`,
                borderRadius: 10,
                padding: "10px 20px",
                color: adsGenTab === "video" ? "white" : "#555",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🎥 Video Ads
            </button>
          </div>

          {adsGenTab === "image" && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#0c0c14",
                borderRadius: 16,
                border: "1px solid rgba(108,71,255,0.12)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🖼</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Generate Image Ads</div>
              <div style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
                AI-generated image ads based on your best untapped angles
              </div>
              <button
                type="button"
                style={{
                  background: "#6c47ff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 28px",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✦ Generate Image Ad
              </button>
            </div>
          )}

          {adsGenTab === "video" && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "#0c0c14",
                borderRadius: 16,
                border: "1px solid rgba(108,71,255,0.12)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎥</div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Generate Video Ads</div>
              <div style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
                AI-generated video ad scripts and concepts based on your angles
              </div>
              <button
                type="button"
                style={{
                  background: "#6c47ff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 28px",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ✦ Generate Video Script
              </button>
            </div>
          )}
        </div>
      )}

      {adsSubTab === "weaknesses" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {comps.map((comp, i) => (
            <div
              key={i}
              style={{
                background: "#0c0c14",
                borderRadius: 14,
                border: "1px solid rgba(255,68,68,0.15)",
                padding: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#ff444422",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ff6b6b",
                    fontWeight: 800,
                  }}
                >
                  {String(comp.name ?? "?").charAt(0)}
                </div>
                <div style={{ color: "white", fontWeight: 600 }}>{String(comp.name ?? "—")}</div>
              </div>
              <div style={{ background: "rgba(255,68,68,0.06)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ color: "#ff6b6b", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>CRITICAL WEAKNESS</div>
                <div style={{ color: "#888", fontSize: 13 }}>{String(comp.weakness ?? "—")}</div>
              </div>
              <div style={{ background: "rgba(0,212,170,0.06)", borderRadius: 8, padding: 12 }}>
                <div style={{ color: "#00d4aa", fontSize: 10, fontWeight: 700, marginBottom: 4 }}>HOW TO EXPLOIT THIS</div>
                <div style={{ color: "#888", fontSize: 13 }}>{String(comp.opportunity ?? "—")}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
