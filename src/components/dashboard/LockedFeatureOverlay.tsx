"use client";

/**
 * LockedFeatureOverlay
 *
 * Wraps a feature section that requires a paid plan.
 * - locked=true  → blurs children behind a dark overlay with a lock icon +
 *                  "Upgrade to see this" button (calls onUpgrade)
 * - locked=false → renders children transparently, zero overhead
 *
 * onUpgrade should navigate to /pricing (NOT show the full-screen upgrade wall).
 * The full-screen wall is reserved exclusively for the "you've used your limit"
 * moment when a user tries to START a new analysis.
 */

import React from "react";

interface Props {
  locked: boolean;
  /** Short label shown above the lock icon, e.g. "Competitor Intelligence" */
  featureName: string;
  /** Called when the user clicks the upgrade button — should route to /pricing */
  onUpgrade: () => void;
  children: React.ReactNode;
}

export function LockedFeatureOverlay({ locked, featureName, onUpgrade, children }: Props) {
  if (!locked) return <>{children}</>;

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
      {/* Real content — visible through the frosted glass overlay */}
      <div style={{ pointerEvents: "none", userSelect: "none" }} aria-hidden="true">
        {children}
      </div>

      {/* Frosted glass overlay — content is tantalizingly visible but unreadable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: "32px 24px",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        {/* Lock circle */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(108,71,255,0.18)",
            border: "1px solid rgba(108,71,255,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          🔒
        </div>

        {/* Label */}
        <div style={{ color: "#888", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px" }}>
          {featureName.toUpperCase()}
        </div>

        {/* Headline */}
        <div style={{ color: "white", fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}>
          This section is locked
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            background: "linear-gradient(135deg, #6c47ff 0%, #a78bfa 100%)",
            border: "none",
            borderRadius: 10,
            padding: "11px 26px",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            marginTop: 2,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.82"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Upgrade to see this →
        </button>
      </div>
    </div>
  );
}
