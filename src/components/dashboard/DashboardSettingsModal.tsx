/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Plan helpers ─────────────────────────────────────────────────────────────

const BILLING_PLANS = [
  { key: "starter", name: "Starter", price: "$29.90", quota: "15 analyses / day", color: "#888888", popular: false },
  { key: "pro",     name: "Pro",     price: "$59.90", quota: "30 analyses / day", color: "#6c47ff", popular: true  },
  { key: "agency",  name: "Agency",  price: "$89.90", quota: "Unlimited",          color: "#f59e0b", popular: false },
] as const;

function planDisplayName(plan: string) {
  return ({ free: "Free", starter: "Starter", pro: "Pro", agency: "Agency", enterprise: "Agency" } as Record<string, string>)[plan]
    ?? (plan.charAt(0).toUpperCase() + plan.slice(1));
}
function planQuota(plan: string, limit: number | null) {
  if (limit === null || ["agency", "enterprise"].includes(plan)) return "Unlimited analyses";
  if (plan === "free") return `${limit} total analysis`;
  return `${limit} analyses / day`;
}
function planColor(plan: string) {
  return ({ free: "#555", starter: "#888", pro: "#6c47ff", agency: "#f59e0b", enterprise: "#f59e0b" } as Record<string, string>)[plan] ?? "#6c47ff";
}

function verdictStyles(verdict: string | null) {
  const v = String(verdict ?? "");
  if (v === "GO")    return { bg: "rgba(0,212,170,0.15)",  color: "#00d4aa" };
  if (v === "NO-GO") return { bg: "rgba(255,68,68,0.15)",  color: "#ff4444" };
  return                    { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
}

function getSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !key || url.includes("placeholder")) return null;
  return createClient(url, key);
}

// ─── Props ────────────────────────────────────────────────────────────────────

const SIDEBAR: { key: SettingsTabKey; icon: string; label: string }[] = [
  { key: "account",       icon: "👤", label: "Account"         },
  { key: "billing",       icon: "💳", label: "Billing & Plan"  },
  { key: "history",       icon: "📋", label: "Product History" },
  { key: "notifications", icon: "🔔", label: "Notifications"   },
  { key: "preferences",   icon: "⚙️", label: "Preferences"     },
  { key: "api",           icon: "🔌", label: "API Access"      },
  { key: "security",      icon: "🔒", label: "Security"        },
  { key: "help",          icon: "❓", label: "Help Center"     },
  { key: "contact",       icon: "✉️", label: "Contact Us"      },
];

type Props = {
  open: boolean;
  onClose: () => void;
  settingsTab: SettingsTabKey;
  setSettingsTab: (k: SettingsTabKey) => void;
  user: User | null;
  analyses: SettingsAnalysisRow[];
  userPlan?: string;
  analysesUsed?: number;
  /** null means unlimited (agency plan); undefined means not yet loaded */
  analysesLimit?: number | null;
  onLogout?: () => void;
  onSubscribe?: (planKey: string) => void;
  subscribingPlan?: string | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardSettingsModal({
  open,
  onClose,
  settingsTab,
  setSettingsTab,
  user,
  analyses,
  userPlan = "free",
  analysesUsed,
  analysesLimit,
  onLogout,
  onSubscribe,
  subscribingPlan,
}: Props) {
  const router = useRouter();

  // ── Account form ────────────────────────────────────────────────────────────
  const email    = user?.email ?? "";
  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? "";
  const [nameValue,  setNameValue]  = useState(fullName);
  const [accountMsg, setAccountMsg] = useState("");
  const [savingAcc,  setSavingAcc]  = useState(false);

  // ── Password form ───────────────────────────────────────────────────────────
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg,     setPwMsg]     = useState("");
  const [savingPw,  setSavingPw]  = useState(false);

  // ── Contact form ────────────────────────────────────────────────────────────
  const contactMsgRef = useRef<HTMLTextAreaElement>(null);
  const [contactSent, setContactSent] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);

  // ── Notification toggles (local state — no DB table yet) ───────────────────
  const [notifs, setNotifs] = useState({
    analysis:     true,
    marketAlerts: true,
    competitor:   false,
    weekly:       true,
    tips:         false,
  });

  // ── Plan info — driven by analysis_limit from DB, not hardcoded ───────────
  const totalAnalyses = analysesUsed ?? analyses.length;
  const isPaidPlan    = ["starter", "pro", "agency", "enterprise"].includes(userPlan);
  // analysesLimit comes from profiles.analysis_limit: null = unlimited
  const effectiveLimit: number | null =
    analysesLimit !== undefined ? analysesLimit : (userPlan === "free" ? 1 : null);
  const quotaLabel = planQuota(userPlan, effectiveLimit);
  const remainingLabel =
    effectiveLimit === null
      ? "Unlimited"
      : userPlan === "free"
      ? `${Math.max(0, effectiveLimit - totalAnalyses)} of ${effectiveLimit} remaining`
      : `${effectiveLimit} per day`;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleSaveAccount() {
    const supa = getSupabase();
    if (!supa) { setAccountMsg("Supabase not configured."); return; }
    setSavingAcc(true);
    setAccountMsg("");
    try {
      const { error } = await supa.auth.updateUser({ data: { full_name: nameValue.trim() } });
      if (error) setAccountMsg(`Error: ${error.message}`);
      else       setAccountMsg("✓ Saved successfully");
    } catch {
      setAccountMsg("Something went wrong. Try again.");
    } finally {
      setSavingAcc(false);
      setTimeout(() => setAccountMsg(""), 4000);
    }
  }

  async function handleUpdatePassword() {
    setPwMsg("");
    if (!pwNew.trim()) { setPwMsg("New password is required."); return; }
    if (pwNew !== pwConfirm) { setPwMsg("Passwords do not match."); return; }
    if (pwNew.length < 8) { setPwMsg("Password must be at least 8 characters."); return; }

    const supa = getSupabase();
    if (!supa) { setPwMsg("Supabase not configured."); return; }

    setSavingPw(true);
    try {
      const { error } = await supa.auth.updateUser({ password: pwNew });
      if (error) setPwMsg(`Error: ${error.message}`);
      else {
        setPwMsg("✓ Password updated");
        setPwCurrent(""); setPwNew(""); setPwConfirm("");
      }
    } catch {
      setPwMsg("Something went wrong. Try again.");
    } finally {
      setSavingPw(false);
      setTimeout(() => setPwMsg(""), 5000);
    }
  }

  function handleSendMessage() {
    const msg = contactMsgRef.current?.value?.trim() ?? "";
    if (!msg) return;
    setSendingContact(true);
    // Open the user's mail client with the message pre-filled
    window.location.href = `mailto:customer.prodiq@gmail.com?subject=ProdIQ Support Request&body=${encodeURIComponent(msg)}`;
    setTimeout(() => {
      setContactSent(true);
      setSendingContact(false);
      if (contactMsgRef.current) contactMsgRef.current.value = "";
    }, 800);
  }

  // ── Early return AFTER all hooks ──────────────────────────────────────────
  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#111", border: "1px solid #222", borderRadius: 10,
    padding: "12px 14px", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <style>{`@keyframes spin-settings { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{ background: "#0c0c14", borderRadius: 24, border: "1px solid rgba(108,71,255,0.2)", width: "100%", maxWidth: 860, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-labelledby="settings-title"
      >
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div id="settings-title" style={{ color: "white", fontWeight: 800, fontSize: 20 }}>Settings</div>
            <div style={{ color: "#555", fontSize: 13, marginTop: 2 }}>Manage your account and preferences</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "#111", border: "1px solid #222", borderRadius: 8, width: 32, height: 32, color: "#666", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Close">×</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Sidebar */}
          <div style={{ width: 220, borderRight: "1px solid #1a1a1a", padding: 16, flexShrink: 0, overflowY: "auto" }}>
            {SIDEBAR.map((item) => (
              <button key={item.key} type="button" onClick={() => setSettingsTab(item.key)}
                style={{ width: "100%", background: settingsTab === item.key ? "rgba(108,71,255,0.15)" : "transparent", border: settingsTab === item.key ? "1px solid rgba(108,71,255,0.3)" : "1px solid transparent", borderRadius: 10, padding: "10px 14px", color: settingsTab === item.key ? "#a78bfa" : "#555", fontSize: 13, fontWeight: settingsTab === item.key ? 600 : 400, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, marginBottom: 4, transition: "all 0.15s" }}
              >
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
              <button type="button" onClick={onLogout}
                style={{ width: "100%", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 10, padding: "10px 14px", color: "#ff6b6b", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
              >
                <span>🚪</span>Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>

            {/* ── ACCOUNT ── */}
            {settingsTab === "account" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Account Details</div>

                {/* Avatar + plan badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 20, background: "#111", borderRadius: 14, border: "1px solid #1a1a1a" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#6c47ff,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white", flexShrink: 0 }}>
                    {(email.charAt(0) || "?").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{nameValue || "Your Name"}</div>
                    <div style={{ color: "#555", fontSize: 13 }}>{email || "—"}</div>
                    <div style={{ background: isPaidPlan ? `${planColor(userPlan)}22` : "rgba(108,71,255,0.15)", color: isPaidPlan ? planColor(userPlan) : "#a78bfa", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, display: "inline-block", marginTop: 4 }}>
                      {planDisplayName(userPlan).toUpperCase()} PLAN
                    </div>
                  </div>
                </div>

                {/* Name field */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>FULL NAME</label>
                  <input value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="Your full name" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#6c47ff"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#222"; }}
                  />
                </div>

                {/* Email field (read-only) */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>EMAIL</label>
                  <input value={email} readOnly style={{ ...inputStyle, color: "#555", cursor: "default" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button type="button" onClick={handleSaveAccount} disabled={savingAcc}
                    style={{ background: "#6c47ff", border: "none", borderRadius: 10, padding: "12px 24px", color: "white", fontSize: 14, fontWeight: 600, cursor: savingAcc ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {savingAcc && <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin-settings 0.8s linear infinite" }} />}
                    {savingAcc ? "Saving…" : "Save Changes"}
                  </button>
                  {accountMsg && <span style={{ fontSize: 13, color: accountMsg.startsWith("✓") ? "#00d4aa" : "#ff6b6b" }}>{accountMsg}</span>}
                </div>

                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #1a1a1a" }}>
                  <div style={{ color: "#ff4444", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Danger Zone</div>
                  <button type="button"
                    onClick={() => { if (confirm("Are you sure? This cannot be undone.")) onLogout?.(); }}
                    style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 8, padding: "10px 20px", color: "#ff6b6b", fontSize: 13, cursor: "pointer" }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* ── BILLING ── */}
            {settingsTab === "billing" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Billing & Plan</div>

                {/* Current plan card */}
                <div style={{ background: isPaidPlan ? `${planColor(userPlan)}0d` : "rgba(108,71,255,0.08)", border: `1px solid ${isPaidPlan ? `${planColor(userPlan)}33` : "rgba(108,71,255,0.2)"}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ color: isPaidPlan ? planColor(userPlan) : "#a78bfa", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>CURRENT PLAN</div>
                      <div style={{ color: "white", fontWeight: 900, fontSize: 26, marginBottom: 4 }}>{planDisplayName(userPlan)}</div>
                      <div style={{ color: "#666", fontSize: 13 }}>{quotaLabel}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#555", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>TOTAL ANALYSES</div>
                      <div style={{ color: "white", fontWeight: 800, fontSize: 20 }}>
                        {effectiveLimit !== null ? `${totalAnalyses} / ${effectiveLimit}` : totalAnalyses}
                      </div>
                      <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{remainingLabel}</div>
                    </div>
                  </div>
                  {userPlan === "free" && effectiveLimit !== null && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ background: "#1a1a1a", borderRadius: 8, height: 6, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, (totalAnalyses / effectiveLimit) * 100)}%`, height: "100%", background: totalAnalyses >= effectiveLimit ? "#ff4444" : "#6c47ff", borderRadius: 8, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan cards */}
                {!isPaidPlan || userPlan === "starter" ? (
                  <div>
                    <div style={{ color: "#555", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 12 }}>
                      {isPaidPlan ? "UPGRADE YOUR PLAN" : "CHOOSE A PLAN"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="max-sm:grid-cols-1">
                      {BILLING_PLANS.filter((p) => userPlan === "starter" ? p.key !== "starter" : true).map((plan) => {
                        const isCurrent = userPlan === plan.key;
                        const isLoading = subscribingPlan === plan.key;
                        return (
                          <div key={plan.key} style={{ background: plan.popular ? "rgba(108,71,255,0.08)" : "#111", border: `1px solid ${plan.popular ? "rgba(108,71,255,0.4)" : "#1a1a1a"}`, borderRadius: 14, padding: 20, textAlign: "center", position: "relative" }}>
                            {plan.popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#6c47ff", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 10, whiteSpace: "nowrap" }}>PRO</div>}
                            <div style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{plan.name}</div>
                            <div style={{ color: plan.color, fontWeight: 900, fontSize: 22, marginBottom: 2 }}>{plan.price}</div>
                            <div style={{ color: "#555", fontSize: 11, marginBottom: 14 }}>{plan.quota}</div>
                            {isCurrent ? (
                              <div style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)", borderRadius: 8, padding: "8px 16px", color: "#00d4aa", fontSize: 12, fontWeight: 700 }}>✓ Current Plan</div>
                            ) : (
                              <button type="button" disabled={isLoading || subscribingPlan !== null}
                                onClick={() => {
                                  if (onSubscribe) onSubscribe(plan.key);
                                  else router.push("/pricing");
                                }}
                                style={{ background: plan.popular ? "#6c47ff" : "transparent", border: `1px solid ${plan.popular ? "#6c47ff" : "#333"}`, borderRadius: 8, padding: "8px 16px", color: plan.popular ? "white" : "#666", fontSize: 12, cursor: isLoading ? "wait" : "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: subscribingPlan !== null && !isLoading ? 0.6 : 1 }}
                              >
                                {isLoading
                                  ? <><span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", display: "inline-block", animation: "spin-settings 0.8s linear infinite" }} />Loading…</>
                                  : `Upgrade to ${plan.name} →`}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => router.push("/pricing")}
                      style={{ marginTop: 14, background: "transparent", border: "1px solid #1a1a1a", borderRadius: 8, padding: "9px 20px", color: "#555", fontSize: 12, cursor: "pointer", width: "100%" }}
                    >
                      View full pricing page →
                    </button>
                  </div>
                ) : (
                  <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 14, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
                    <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>You&apos;re on the {planDisplayName(userPlan)} plan</div>
                    <div style={{ color: "#555", fontSize: 13, marginBottom: 14 }}>Enjoy {quotaLabel}. Contact support to manage your subscription.</div>
                    <a href="mailto:customer.prodiq@gmail.com?subject=Subscription Management" style={{ color: "#6c47ff", fontSize: 13, fontWeight: 600 }}>Contact support →</a>
                  </div>
                )}
              </div>
            )}

            {/* ── HISTORY ── */}
            {settingsTab === "history" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Product History</div>
                <div style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>{analyses.length} product{analyses.length !== 1 ? "s" : ""} analyzed</div>
                {analyses.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#333" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                    <div>No analyses yet. Upload your first product to get started.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {analyses.map((analysis) => {
                      const vs = verdictStyles(analysis.verdict);
                      return (
                        <div key={analysis.id} style={{ background: "#111", borderRadius: 12, border: "1px solid #1a1a1a", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                          <img src={analysis.product_image || "/massager.jpg"} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} onError={(e) => { e.currentTarget.src = "/massager.jpg"; }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{analysis.product_name}</div>
                            <div style={{ color: "#555", fontSize: 12 }}>{new Date(analysis.created_at).toLocaleDateString()}</div>
                          </div>
                          <div style={{ color: "#6c47ff", fontWeight: 800, fontSize: 16 }}>{analysis.score ?? "—"}/100</div>
                          <div style={{ background: vs.bg, color: vs.color, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>{analysis.verdict ?? "—"}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── NOTIFICATIONS ── */}
            {settingsTab === "notifications" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Notification Preferences</div>
                <div style={{ color: "#555", fontSize: 12, marginBottom: 16 }}>Changes are saved locally and apply to this device.</div>
                {([
                  { key: "analysis",     label: "Analysis Complete",  desc: "Get notified when your product analysis is ready"                  },
                  { key: "marketAlerts", label: "Market Alerts",       desc: "Alert when a product you analyzed changes trend direction"         },
                  { key: "competitor",   label: "New Competitor",      desc: "Alert when a new competitor starts selling your product"           },
                  { key: "weekly",       label: "Weekly Report",       desc: "Weekly summary of all your analyzed products"                      },
                  { key: "tips",         label: "Product Tips",        desc: "Tips and tricks to get more from ProdIQ"                           },
                ] as { key: keyof typeof notifs; label: string; desc: string }[]).map((item) => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: "#111", borderRadius: 12, marginBottom: 8, border: "1px solid #1a1a1a", gap: 12 }}>
                    <div>
                      <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                      <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <button type="button" onClick={() => setNotifs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                      style={{ width: 44, height: 24, borderRadius: 12, background: notifs[item.key] ? "#6c47ff" : "#222", border: `1px solid ${notifs[item.key] ? "#6c47ff" : "#333"}`, cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}
                      aria-label={`Toggle ${item.label}`}
                    >
                      <div style={{ position: "absolute", top: 2, left: notifs[item.key] ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── PREFERENCES ── */}
            {settingsTab === "preferences" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>App Preferences</div>
                <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>Preference persistence coming soon. These settings are displayed for reference.</div>
                {[
                  { label: "Language",       options: ["English", "French", "Spanish", "Arabic"] },
                  { label: "Currency",       options: ["USD $", "EUR €", "GBP £", "MAD"]        },
                  { label: "Default Market", options: ["United States", "United Kingdom", "Global"] },
                ].map((pref, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <label style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", display: "block", marginBottom: 8 }}>{pref.label.toUpperCase()}</label>
                    <select style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 14, outline: "none", cursor: "pointer" }} defaultValue={pref.options[0]}>
                      {pref.options.map((o) => <option key={o} value={o} style={{ background: "#111" }}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* ── API ── */}
            {settingsTab === "api" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>API Access</div>
                {userPlan === "agency" || userPlan === "enterprise" ? (
                  <div>
                    <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <div style={{ color: "#00d4aa", fontSize: 12, fontWeight: 600 }}>✓ API access is enabled on your Agency plan</div>
                    </div>
                    <div style={{ background: "#111", borderRadius: 12, border: "1px solid #1a1a1a", padding: 16 }}>
                      <div style={{ color: "#555", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>YOUR API KEY</div>
                      <div style={{ color: "#666", fontSize: 13, fontFamily: "monospace", letterSpacing: 1 }}>Contact support to generate your API key.</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <div style={{ color: "#f59e0b", fontSize: 12, fontWeight: 600 }}>⚠ API access is available on the Agency plan only</div>
                    </div>
                    <button type="button" onClick={() => router.push("/pricing")}
                      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "10px 20px", color: "#f59e0b", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                    >
                      Upgrade to Agency →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── SECURITY ── */}
            {settingsTab === "security" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Security</div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 12 }}>CHANGE PASSWORD</div>
                  {[
                    { label: "Current Password", value: pwCurrent, setter: setPwCurrent },
                    { label: "New Password",     value: pwNew,     setter: setPwNew     },
                    { label: "Confirm Password", value: pwConfirm, setter: setPwConfirm },
                  ].map(({ label, value, setter }) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <label style={{ color: "#555", fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>
                      <input type="password" placeholder="••••••••" value={value} onChange={(e) => setter(e.target.value)} style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = "#6c47ff"; }}
                        onBlur={(e) => { e.target.style.borderColor = "#222"; }}
                      />
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                    <button type="button" onClick={handleUpdatePassword} disabled={savingPw}
                      style={{ background: "#6c47ff", border: "none", borderRadius: 10, padding: "12px 24px", color: "white", fontSize: 14, fontWeight: 600, cursor: savingPw ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {savingPw && <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin-settings 0.8s linear infinite" }} />}
                      {savingPw ? "Updating…" : "Update Password"}
                    </button>
                    {pwMsg && <span style={{ fontSize: 13, color: pwMsg.startsWith("✓") ? "#00d4aa" : "#ff6b6b" }}>{pwMsg}</span>}
                  </div>
                </div>
                <div style={{ padding: 16, background: "#111", borderRadius: 12, border: "1px solid #1a1a1a" }}>
                  <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Two-Factor Authentication</div>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 12 }}>Add an extra layer of security to your account</div>
                  <button type="button" onClick={() => alert("2FA setup is coming soon. Check back in the next update!")}
                    style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, padding: "8px 16px", color: "#666", fontSize: 12, cursor: "pointer" }}
                  >
                    Enable 2FA (Coming Soon)
                  </button>
                </div>
              </div>
            )}

            {/* ── HELP ── */}
            {settingsTab === "help" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Help Center</div>
                {[
                  { q: "How do I upload a product?",          a: "Go to the Market Analysis tab. If no product is selected you'll see the upload box. You can paste an Amazon link, upload an image, or describe the product in text." },
                  { q: "Why is my analysis taking long?",     a: "We search 50+ sources simultaneously. It usually takes 15-30 seconds. If it takes longer, try refreshing." },
                  { q: "How accurate are the results?",       a: "We use real-time data from Google, Amazon, Reddit and TikTok. Accuracy is very high but some smaller competitors may be missed." },
                  { q: "What does the score mean?",           a: "The score is calculated from demand, pain point intensity, wow factor, emotional trigger, competition, and profit potential." },
                  { q: "How many analyses do I get?",         a: "Free plan: 1 total. Starter: 15/day. Pro: 30/day. Agency: unlimited." },
                  { q: "My plan didn't update after paying?", a: "Wait up to 2 minutes and refresh. If still incorrect, email customer.prodiq@gmail.com with your Stripe receipt." },
                ].map((item, i) => (
                  <div key={i} style={{ background: "#111", borderRadius: 12, border: "1px solid #1a1a1a", padding: 16, marginBottom: 8 }}>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>❓ {item.q}</div>
                    <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>{item.a}</div>
                  </div>
                ))}
              </div>
            )}

            {/* ── CONTACT ── */}
            {settingsTab === "contact" && (
              <div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Contact Us</div>
                <div style={{ background: "rgba(108,71,255,0.06)", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 14, padding: 24, marginBottom: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✉️</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Customer Support</div>
                  <div style={{ color: "#555", fontSize: 13, marginBottom: 16 }}>We typically respond within 2-4 hours</div>
                  <a href="mailto:customer.prodiq@gmail.com" style={{ color: "#6c47ff", fontSize: 16, fontWeight: 700, textDecoration: "none" }}>customer.prodiq@gmail.com</a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }} className="max-sm:grid-cols-1">
                  {[{ icon: "⚡", title: "Response Time", value: "2-4 hours" }, { icon: "🌍", title: "Support Hours", value: "24/7" }, { icon: "🏢", title: "Headquarters", value: "New York, NY" }, { icon: "💬", title: "Languages", value: "EN, FR, AR" }].map((item, i) => (
                    <div key={i} style={{ background: "#111", borderRadius: 12, border: "1px solid #1a1a1a", padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <div><div style={{ color: "#555", fontSize: 11 }}>{item.title}</div><div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>{item.value}</div></div>
                    </div>
                  ))}
                </div>
                {contactSent ? (
                  <div style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                    <div style={{ color: "#00d4aa", fontWeight: 700, marginBottom: 4 }}>Mail client opened!</div>
                    <div style={{ color: "#555", fontSize: 13 }}>Your message has been pre-filled. Send it from your mail app.</div>
                    <button type="button" onClick={() => setContactSent(false)} style={{ marginTop: 12, background: "transparent", border: "1px solid #333", borderRadius: 8, padding: "8px 16px", color: "#666", fontSize: 12, cursor: "pointer" }}>Send another</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: "#666", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 8 }}>SEND A MESSAGE</div>
                    <textarea ref={contactMsgRef} placeholder="Describe your issue or question..." rows={4}
                      style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", color: "white", fontSize: 14, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 10 }}
                      onFocus={(e) => { e.target.style.borderColor = "#6c47ff"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#222"; }}
                    />
                    <button type="button" onClick={handleSendMessage} disabled={sendingContact}
                      style={{ background: "#6c47ff", border: "none", borderRadius: 10, padding: "12px 24px", color: "white", fontSize: 14, fontWeight: 600, cursor: sendingContact ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {sendingContact && <span style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin-settings 0.8s linear infinite" }} />}
                      {sendingContact ? "Opening mail…" : "Send Message"}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
