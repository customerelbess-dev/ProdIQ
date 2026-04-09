/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

type Competitor = { name: string; website: string; angle: string; revenue: string };
type AdItem = { image: string; headline: string };
type Winner = {
  name: string;
  category: string;
  image?: string;
  monthly_revenue: string;
  demand_score: number;
  competition_level: string;
  untapped_angles: number;
  avg_price: string;
  success_rate: number;
  why_it_wins: string;
  best_angle: string;
  wow_factor: string;
  competitors?: Competitor[];
  ads?: AdItem[];
};

type Props = {
  setActiveTab: (tab: string) => void;
};

export function WinnersTab({ setActiveTab }: Props) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);

  useEffect(() => {
    void fetchWinners();
  }, []);

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/winners");
      const data = (await res.json()) as { winners?: Winner[] };
      setWinners(data.winners ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 80 }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "2px solid rgba(108,71,255,0.2)",
            borderTop: "2px solid #6c47ff",
            borderRadius: "50%",
            animation: "winnersTabSpin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <style>{`@keyframes winnersTabSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: "#555" }}>Finding this week&apos;s winning products...</div>
      </div>
    );

  if (selectedWinner)
    return (
      <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
        <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <button
          type="button"
          onClick={() => setSelectedWinner(null)}
          style={{
            background: "transparent",
            border: "1px solid #222",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#666",
            fontSize: 12,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          ← Winners
        </button>

        <div
          style={{
            background: "#0c0c14",
            borderRadius: 20,
            border: "1px solid rgba(108,71,255,0.2)",
            padding: 28,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            {selectedWinner.image ? (
              <img
                src={selectedWinner.image}
                style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                alt={selectedWinner.name}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}
              >
                <div
                  style={{
                    background: "#f59e0b22",
                    color: "#f59e0b",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  🔥 WINNER OF THE WEEK
                </div>
                <div
                  style={{
                    background: "#00d4aa22",
                    color: "#00d4aa",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  {selectedWinner.success_rate}% success rate
                </div>
              </div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
                {selectedWinner.name}
              </div>
              <div style={{ color: "#555", fontSize: 13 }}>{selectedWinner.category}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 28 }}>
                {selectedWinner.monthly_revenue}
              </div>
              <div style={{ color: "#444", fontSize: 12 }}>Amazon last 30 days</div>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}
            className="max-sm:grid-cols-2"
          >
            {[
              { label: "Demand Score", value: `${selectedWinner.demand_score}/100`, color: "#6c47ff" },
              { label: "Competition", value: selectedWinner.competition_level, color: "#f59e0b" },
              {
                label: "Untapped Angles",
                value: `${selectedWinner.untapped_angles} found`,
                color: "#00d4aa",
              },
              { label: "Avg Price", value: selectedWinner.avg_price, color: "white" },
            ].map((m, i) => (
              <div
                key={i}
                style={{ background: "#111", borderRadius: 10, padding: 14, textAlign: "center" }}
              >
                <div style={{ color: "#444", fontSize: 10, marginBottom: 4 }}>
                  {m.label.toUpperCase()}
                </div>
                <div style={{ color: m.color, fontWeight: 700, fontSize: 15 }}>{m.value}</div>
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
              padding: 20,
            }}
          >
            <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
              🎯 WHY IT WINS
            </div>
            <div style={{ color: "#888", fontSize: 13, lineHeight: 1.7 }}>
              {selectedWinner.why_it_wins}
            </div>
          </div>
          <div
            style={{
              background: "#0c0c14",
              borderRadius: 16,
              border: "1px solid rgba(108,71,255,0.12)",
              padding: 20,
            }}
          >
            <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
              ✓ BEST UNTAPPED ANGLE
            </div>
            <div style={{ color: "white", fontSize: 14, fontStyle: "italic", marginBottom: 8 }}>
              &quot;{selectedWinner.best_angle}&quot;
            </div>
            <div style={{ color: "#555", fontSize: 12 }}>
              Nobody is running this yet. This is your edge.
            </div>
          </div>
        </div>

        {(selectedWinner.competitors?.length ?? 0) > 0 ? (
          <div
            style={{
              background: "#0c0c14",
              borderRadius: 16,
              border: "1px solid rgba(108,71,255,0.12)",
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
              🕵️ WHO IS SELLING THIS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedWinner.competitors!.map((comp, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    background: "#111",
                    borderRadius: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(comp.website)}&sz=24`}
                    style={{ width: 24, height: 24, borderRadius: 4 }}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>{comp.name}</div>
                    <div style={{ color: "#555", fontSize: 11, fontStyle: "italic" }}>{comp.angle}</div>
                  </div>
                  <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>{comp.revenue}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(selectedWinner.ads?.length ?? 0) > 0 ? (
          <div
            style={{
              background: "#0c0c14",
              borderRadius: 16,
              border: "1px solid rgba(108,71,255,0.12)",
              padding: 20,
            }}
          >
            <div style={{ color: "#888", fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
              📢 COMPETITOR ADS RUNNING NOW
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}
              className="max-sm:grid-cols-1"
            >
              {selectedWinner.ads!.map((ad, i) => (
                <div
                  key={i}
                  style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1a1a1a" }}
                >
                  <img
                    src={ad.image}
                    alt=""
                    style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div style={{ padding: 8, background: "#0a0a0a" }}>
                    <div style={{ color: "#666", fontSize: 11 }}>{ad.headline?.substring(0, 50)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setActiveTab("launch")}
          style={{
            width: "100%",
            marginTop: 16,
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
          🚀 Launch Campaign For This Product →
        </button>
      </div>
    );

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            background: "#f59e0b22",
            border: "1px solid #f59e0b44",
            borderRadius: 20,
            padding: "6px 16px",
            display: "inline-block",
            color: "#f59e0b",
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 12,
            letterSpacing: 1,
          }}
        >
          🔥 UPDATED EVERY MONDAY
        </div>
        <h2
          style={{ color: "white", fontWeight: 900, fontSize: 28, marginBottom: 8, marginTop: 0 }}
        >
          Winning Products This Week
        </h2>
        <p style={{ color: "#555", fontSize: 14, margin: "0 auto" }}>
          Hand-picked by our AI from Amazon. High demand, emotional, untapped angles. Click to
          unlock the full strategy.
        </p>
      </div>

      {winners.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            background: "#0c0c14",
            borderRadius: 16,
            border: "1px solid rgba(108,71,255,0.12)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ color: "white", fontWeight: 600, marginBottom: 8 }}>
            No winners found yet
          </div>
          <div style={{ color: "#555", fontSize: 13 }}>
            Configure your Rainforest API key to see winning products
          </div>
        </div>
      ) : (
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}
        >
          {winners.map((winner, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedWinner(winner)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedWinner(winner);
                }
              }}
              style={{
                background: "#0c0c14",
                borderRadius: 16,
                border: "1px solid rgba(108,71,255,0.12)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6c47ff";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(108,71,255,0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {winner.image ? (
                <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                  <img
                    src={winner.image}
                    alt={winner.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to bottom, transparent 40%, rgba(4,4,6,0.95) 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "#f59e0b",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#1a0a00",
                    }}
                  >
                    🔥 #{i + 1} THIS WEEK
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "rgba(0,212,170,0.9)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#003322",
                    }}
                  >
                    {winner.success_rate}% success
                  </div>
                </div>
              ) : null}
              <div style={{ padding: 16 }}>
                <div style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  {winner.name}
                </div>
                <div style={{ color: "#555", fontSize: 12, marginBottom: 12 }}>{winner.category}</div>
                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}
                >
                  <div
                    style={{ background: "#111", borderRadius: 8, padding: 8, textAlign: "center" }}
                  >
                    <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 13 }}>
                      {winner.monthly_revenue}
                    </div>
                    <div style={{ color: "#444", fontSize: 9 }}>Amazon/mo</div>
                  </div>
                  <div
                    style={{ background: "#111", borderRadius: 8, padding: 8, textAlign: "center" }}
                  >
                    <div style={{ color: "#6c47ff", fontWeight: 700, fontSize: 13 }}>
                      {winner.demand_score}/100
                    </div>
                    <div style={{ color: "#444", fontSize: 9 }}>Demand</div>
                  </div>
                  <div
                    style={{ background: "#111", borderRadius: 8, padding: 8, textAlign: "center" }}
                  >
                    <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 13 }}>
                      {winner.untapped_angles}
                    </div>
                    <div style={{ color: "#444", fontSize: 9 }}>Untapped</div>
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(0,212,170,0.06)",
                    border: "1px solid rgba(0,212,170,0.15)",
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ color: "#00d4aa", fontSize: 9, fontWeight: 700, marginBottom: 4 }}>
                    BEST ANGLE HINT
                  </div>
                  <div style={{ color: "#888", fontSize: 12, fontStyle: "italic" }}>
                    &quot;{winner.best_angle?.substring(0, 60)}...&quot;{" "}
                    <span style={{ color: "#333" }}>— click to unlock full strategy</span>
                  </div>
                </div>
                <div style={{ color: "#6c47ff", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                  View Full Strategy →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
