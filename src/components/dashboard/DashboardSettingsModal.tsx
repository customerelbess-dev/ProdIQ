/* eslint-disable @next/next/no-img-element */
"use client";

import type { User } from "@supabase/supabase-js";

export type SettingsAnalysisRow = {
  id: string;
  product_name: string;
  product_image: string | null;
  score: number | null;
  verdict: string | null;
  created_at: string;
};

export type SettingsTabKey =
  | "account"
  | "billing"
  | "history"
  | "notifications"
  | "preferences"
  | "api"
  | "security"
  | "help"
  | "contact";

type Props = {
  open: boolean;
  onClose: () => void;
  settingsTab: SettingsTabKey;
  setSettingsTab: (k: SettingsTabKey) => void;
  user: User | null;
  analyses: SettingsAnalysisRow[];
  onLogout?: () => void;
};

const SIDEBAR: { key: SettingsTabKey; icon: string; label: string }[] = [
  { key: "account", icon: "👤", label: "Account" },
  { key: "billing", icon: "💳", label: "Billing & Plan" },
  { key: "history", icon: "📋", label: "Product History" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
  { key: "preferences", icon: "⚙️", label: "Preferences" },
  { key: "api", icon: "🔌", label: "API Access" },
  { key: "security", icon: "🔒", label: "Security" },
  { key: "help", icon: "❓", label: "Help Center" },
  { key: "contact", icon: "✉️", label: "Contact Us" },
];

function verdictStyles(verdict: string | null) {
  const v = String(verdict ?? "");
  if (v === "GO") return { bg: "rgba(0,212,170,0.15)", color: "#00d4aa" };
  if (v === "NO-GO") return { bg: "rgba(255,68,68,0.15)", color: "#ff4444" };
  return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
}

export function DashboardSettingsModal({
  open,
  onClose,
  settingsTab,
  setSettingsTab,
  user,
  analyses,
  onLogout,
}: Props) {
  if (!open) return null;

  const email = user?.email ?? "";
  const fullName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        style={{
          background: "#0c0c14",
          borderRadius: 24,
          border: "1px solid rgba(108,71,255,0.2)",
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid #1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div id="settings-modal-title" style={{ color: "white", fontWeight: 800, fontSize: 20 }}>
              Settings
            </div>
            <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>Manage your account and preferences</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#111",
              border: "1px solid #222",
              borderRadius: 8,
              width: 32,
              height: 32,
              color: "#666",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              width: 220,
              borderRight: "1px solid #1a1a1a",
              padding: 16,
              flexShrink: 0,
              overflowY: "auto",
            }}
          >
            {SIDEBAR.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSettingsTab(item.key)}
                style={{
                  width: "100%",
                  background: settingsTab === item.key ? "rgba(108,71,255,0.15)" : "transparent",
                  border:
                    settingsTab === item.key ? "1px solid rgba(108,71,255,0.3)" : "1px solid transparent",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: settingsTab === item.key ? "#a78bfa" : "#555",
                  fontSize: 13,
                  fontWeight: settingsTab === item.key ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                  transition: "all 0.15s",
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
              <button
                type="button"
                onClick={onLogout}
                style={{
                  width: "100%",
                  background: "rgba(255,68,68,0.08)",
                  border: "1px solid rgba(255,68,68,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#ff6b6b",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.15s",
                }}
              >
                <span>🚪</span>
                Sign Out
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
            {settingsTab === "account" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Account Details</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 24,
                    padding: 20,
                    background: "#111",
                    borderRadius: 14,
                    border: "1px solid #1a1a1a",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {(email.charAt(0) || "?").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                      {fullName || "Your Name"}
                    </div>
                    <div style={{ color: "#555", fontSize: 13 }}>{email || "—"}</div>
                    <div
                      style={{
                        background: "rgba(108,71,255,0.15)",
                        color: "#a78bfa",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                        display: "inline-block",
                        marginTop: 4,
                      }}
                    >
                      FREE PLAN
                    </div>
                  </div>
                </div>
                {[
                  { label: "Full Name", value: fullName, placeholder: "Your full name" },
                  { label: "Email", value: email, placeholder: "your@email.com" },
                ].map((field, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        color: "#666",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {field.label.toUpperCase()}
                    </label>
                    <input
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      style={{
                        width: "100%",
                        background: "#111",
                        border: "1px solid #222",
                        borderRadius: 10,
                        padding: "12px 14px",
                        color: "white",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#6c47ff";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#222";
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  style={{
                    background: "#6c47ff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 24px",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #1a1a1a" }}>
                  <div style={{ color: "#ff4444", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Danger Zone</div>
                  <button
                    type="button"
                    style={{
                      background: "rgba(255,68,68,0.1)",
                      border: "1px solid rgba(255,68,68,0.3)",
                      borderRadius: 8,
                      padding: "10px 20px",
                      color: "#ff6b6b",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {settingsTab === "billing" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Billing & Plan</div>
                <div
                  style={{
                    background: "rgba(108,71,255,0.08)",
                    border: "1px solid rgba(108,71,255,0.2)",
                    borderRadius: 14,
                    padding: 20,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CURRENT PLAN</div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: 22 }}>Free</div>
                      <div style={{ color: "#555", fontSize: 13 }}>1 analysis remaining</div>
                    </div>
                    <button
                      type="button"
                      style={{
                        background: "#6c47ff",
                        border: "none",
                        borderRadius: 10,
                        padding: "12px 24px",
                        color: "white",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Upgrade Plan →
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="max-sm:grid-cols-1">
                  {[
                    { name: "Starter", price: "$29.90", analyses: "15/day", color: "#555", popular: false },
                    { name: "Pro", price: "$59.90", analyses: "30/day", color: "#6c47ff", popular: true },
                    { name: "Agency", price: "$89.90", analyses: "50+/day", color: "#f59e0b", popular: false },
                  ].map((plan, i) => (
                    <div
                      key={i}
                      style={{
                        background: plan.popular ? "rgba(108,71,255,0.08)" : "#111",
                        border: `1px solid ${plan.popular ? "rgba(108,71,255,0.4)" : "#1a1a1a"}`,
                        borderRadius: 14,
                        padding: 20,
                        textAlign: "center",
                      }}
                    >
                      {plan.popular ? (
                        <div
                          style={{
                            background: "#6c47ff",
                            color: "white",
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 10,
                            display: "inline-block",
                            marginBottom: 8,
                          }}
                        >
                          MOST POPULAR
                        </div>
                      ) : null}
                      <div style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ color: plan.color, fontWeight: 900, fontSize: 24, marginBottom: 4 }}>{plan.price}</div>
                      <div style={{ color: "#555", fontSize: 11, marginBottom: 14 }}>{plan.analyses}</div>
                      <button
                        type="button"
                        style={{
                          background: plan.popular ? "#6c47ff" : "transparent",
                          border: `1px solid ${plan.popular ? "#6c47ff" : "#333"}`,
                          borderRadius: 8,
                          padding: "8px 16px",
                          color: plan.popular ? "white" : "#666",
                          fontSize: 12,
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        Choose {plan.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settingsTab === "history" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Product History</div>
                <div style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>{analyses.length} products analyzed</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {analyses.map((analysis) => {
                    const vs = verdictStyles(analysis.verdict);
                    return (
                      <div
                        key={analysis.id}
                        style={{
                          background: "#111",
                          borderRadius: 12,
                          border: "1px solid #1a1a1a",
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <img
                          src={analysis.product_image || "/massager.jpg"}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.src = "/massager.jpg";
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{analysis.product_name}</div>
                          <div style={{ color: "#555", fontSize: 12 }}>
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ color: "#6c47ff", fontWeight: 800, fontSize: 16 }}>
                          {analysis.score ?? "—"}/100
                        </div>
                        <div
                          style={{
                            background: vs.bg,
                            color: vs.color,
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 20,
                            flexShrink: 0,
                          }}
                        >
                          {analysis.verdict ?? "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {settingsTab === "notifications" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
                  Notification Preferences
                </div>
                {[
                  { label: "Analysis Complete", desc: "Get notified when your product analysis is ready", defaultOn: true },
                  { label: "Market Alerts", desc: "Alert when a product you analyzed changes trend direction", defaultOn: true },
                  { label: "New Competitor", desc: "Alert when a new competitor starts selling your product", defaultOn: false },
                  { label: "Weekly Report", desc: "Weekly summary of all your analyzed products", defaultOn: true },
                  { label: "Product Tips", desc: "Tips and tricks to get more from ProdIQ", defaultOn: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 16,
                      background: "#111",
                      borderRadius: 12,
                      marginBottom: 8,
                      border: "1px solid #1a1a1a",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                      <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <div
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: item.defaultOn ? "#6c47ff" : "#222",
                        border: `1px solid ${item.defaultOn ? "#6c47ff" : "#333"}`,
                        cursor: "pointer",
                        position: "relative",
                        flexShrink: 0,
                      }}
                      role="presentation"
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          left: item.defaultOn ? 22 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "white",
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {settingsTab === "preferences" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>App Preferences</div>
                {[
                  { label: "Language", options: ["English", "French", "Spanish", "Arabic"] },
                  { label: "Currency", options: ["USD $", "EUR €", "GBP £", "MAD"] },
                  { label: "Default Market", options: ["United States", "United Kingdom", "Global"] },
                ].map((pref, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        color: "#666",
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {pref.label.toUpperCase()}
                    </label>
                    <select
                      style={{
                        width: "100%",
                        background: "#111",
                        border: "1px solid #222",
                        borderRadius: 10,
                        padding: "12px 14px",
                        color: "white",
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                      }}
                      defaultValue={pref.options[0]}
                    >
                      {pref.options.map((o) => (
                        <option key={o} value={o} style={{ background: "#111" }}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {settingsTab === "api" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>API Access</div>
                <div
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>
                    ⚠ API access is available on Agency plan only
                  </div>
                </div>
                <div
                  style={{
                    background: "#111",
                    borderRadius: 12,
                    border: "1px solid #1a1a1a",
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ color: "#555", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>YOUR API KEY</div>
                  <div style={{ color: "#333", fontSize: 13, fontFamily: "monospace", letterSpacing: 1 }}>
                    ••••••••••••••••••••••••••••••••
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 8,
                    padding: "10px 20px",
                    color: "#f59e0b",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Upgrade to Access API →
                </button>
              </div>
            )}

            {settingsTab === "security" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Security</div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 8 }}>
                    CHANGE PASSWORD
                  </div>
                  {["Current Password", "New Password", "Confirm New Password"].map((label, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <label style={{ color: "#555", fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        style={{
                          width: "100%",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 10,
                          padding: "12px 14px",
                          color: "white",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#6c47ff";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#222";
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    style={{
                      background: "#6c47ff",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 24px",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Update Password
                  </button>
                </div>
                <div style={{ padding: 16, background: "#111", borderRadius: 12, border: "1px solid #1a1a1a" }}>
                  <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    Two-Factor Authentication
                  </div>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 12 }}>
                    Add an extra layer of security to your account
                  </div>
                  <button
                    type="button"
                    style={{
                      background: "transparent",
                      border: "1px solid #333",
                      borderRadius: 8,
                      padding: "8px 16px",
                      color: "#666",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {settingsTab === "help" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Help Center</div>
                {[
                  {
                    q: "How do I upload a product?",
                    a: "Go to the Dashboard tab and use the upload box. You can paste an Amazon link, upload an image, or type a description.",
                  },
                  {
                    q: "Why is my analysis taking long?",
                    a: "We search 50+ sources simultaneously. It usually takes 15-30 seconds. If it takes longer, try refreshing.",
                  },
                  {
                    q: "How accurate are the competitor results?",
                    a: "We use real-time data from Google, Amazon, Reddit and TikTok. Accuracy is very high but some smaller competitors may be missed.",
                  },
                  {
                    q: "What does the score mean?",
                    a: "The score is calculated from demand, pain point intensity, wow factor, emotional trigger, competition, and profit potential.",
                  },
                  {
                    q: "How many analyses do I get?",
                    a: "Free plan includes 1 analysis. Starter: 15/day. Pro: 30/day. Agency: 50+/day.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#111",
                      borderRadius: 12,
                      border: "1px solid #1a1a1a",
                      padding: 16,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>❓ {item.q}</div>
                    <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>{item.a}</div>
                  </div>
                ))}
              </div>
            )}

            {settingsTab === "contact" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Contact Us</div>
                <div
                  style={{
                    background: "rgba(108,71,255,0.06)",
                    border: "1px solid rgba(108,71,255,0.2)",
                    borderRadius: 14,
                    padding: 24,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Customer Support</div>
                  <div style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>We typically respond within 2-4 hours</div>
                  <a
                    href="mailto:customer.prodiq@gmail.com"
                    style={{ color: "#6c47ff", fontSize: 16, fontWeight: 700, textDecoration: "none" }}
                  >
                    customer.prodiq@gmail.com
                  </a>
                </div>
                <div
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}
                  className="max-sm:grid-cols-1"
                >
                  {[
                    { icon: "⚡", title: "Response Time", value: "2-4 hours" },
                    { icon: "🌍", title: "Support Hours", value: "24/7" },
                    { icon: "🏢", title: "Headquarters", value: "New York, NY" },
                    { icon: "💬", title: "Languages", value: "EN, FR, AR" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#111",
                        borderRadius: 12,
                        border: "1px solid #1a1a1a",
                        padding: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <div>
                        <div style={{ color: "#555", fontSize: 11 }}>{item.title}</div>
                        <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 8 }}>
                    SEND A MESSAGE
                  </div>
                  <textarea
                    placeholder="Describe your issue or question..."
                    rows={4}
                    style={{
                      width: "100%",
                      background: "#111",
                      border: "1px solid #222",
                      borderRadius: 10,
                      padding: "12px 14px",
                      color: "white",
                      fontSize: 14,
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                      marginBottom: 10,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#6c47ff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#222";
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      background: "#6c47ff",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 24px",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Send Message
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
