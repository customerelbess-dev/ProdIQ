"use client";

/**
 * LockedFeatureOverlay
 *
 * Wraps any feature section that requires a paid plan.
 * When `locked={true}`:
 *   - renders the children blurred behind a frosted overlay
 *   - shows a prominent upgrade call-to-action
 * When `locked={false}`:
 *   - renders children normally, no overhead
 */

import React from "react";

interface Props {
  locked: boolean;
  /** Feature name shown in the lock badge, e.g. "Competitor Intelligence" */
  featureName: string;
  /** Which plan unlocks this feature (default: "Starter") */
  requiredPlan?: string;
  /** Called when the user clicks the upgrade button */
  onUpgrade: () => void;
  children: React.ReactNode;
}

export function LockedFeatureOverlay({
  locked,
  featureName,
  requiredPlan = "Starter",
  onUpgrade,
  children,
}: Props) {
  if (!locked) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {/* Blurred preview of the real content */}
      <div
        style={{
          filter: "blur(6px)",
          opacity: 0.35,
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "linear-gradient(180deg, rgba(4,4,6,0.4) 0%, rgba(4,4,6,0.82) 60%)",
          borderRadius: "inherit",
          zIndex: 10,
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(108,71,255,0.15)",
            border: "1px solid rgba(108,71,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          🔒
        </div>

        {/* Badge */}
        <div
          style={{
            background: "rgba(108,71,255,0.12)",
            border: "1px solid rgba(108,71,255,0.3)",
            borderRadius: 20,
            padding: "3px 14px",
            color: "#a78bfa",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.8px",
          }}
        >
          {requiredPlan.toUpperCase()}+ FEATURE
        </div>

        {/* Title */}
        <div style={{ color: "white", fontWeight: 800, fontSize: 18, lineHeight: 1.3 }}>
          {featureName}
        </div>

        {/* Subtitle */}
        <div style={{ color: "#666", fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
          Upgrade to <strong style={{ color: "#a78bfa" }}>{requiredPlan}</strong> or above to
          unlock {featureName.toLowerCase()} and all other premium intelligence features.
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            background: "linear-gradient(135deg, #6c47ff, #a78bfa)",
            border: "none",
            borderRadius: 12,
            padding: "12px 28px",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            transition: "opacity 0.2s",
            marginTop: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          Upgrade to {requiredPlan} →
        </button>
      </div>
    </div>
  );
}
