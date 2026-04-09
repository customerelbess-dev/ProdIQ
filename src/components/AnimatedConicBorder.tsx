"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type ConicBorderVariant = "badge" | "button";

export function AnimatedConicBorder({
  variant,
  className,
  children,
}: {
  variant: ConicBorderVariant;
  className?: string;
  children: ReactNode;
}) {
  const borderRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let angle = 0;
    let slowTimer = 0;
    let speed = variant === "badge" ? 2 : 1.5;

    const gradientBadge = (a: number) =>
      `conic-gradient(from ${a}deg, transparent 0deg, transparent 60deg, #6c47ff 120deg, #a78bfa 180deg, #6c47ff 240deg, transparent 300deg, transparent 360deg)`;

    const gradientButton = (a: number) =>
      `conic-gradient(from ${a}deg, transparent 0deg, transparent 40deg, #6c47ff 100deg, #a78bfa 160deg, #00d4aa 200deg, #6c47ff 260deg, transparent 300deg, transparent 360deg)`;

    const animate = () => {
      slowTimer++;

      if (variant === "badge") {
        if (slowTimer > 120 && slowTimer < 180) speed = 0.3;
        else if (slowTimer > 180 && slowTimer < 220) speed = 4;
        else if (slowTimer > 220) {
          speed = 2;
          slowTimer = 0;
        }
      } else {
        if (slowTimer > 100 && slowTimer < 150) speed = 0.2;
        else if (slowTimer > 150 && slowTimer < 190) speed = 5;
        else if (slowTimer > 190) {
          speed = 1.5;
          slowTimer = 0;
        }
      }

      angle = (angle + speed) % 360;
      const el = borderRef.current;
      if (el) {
        el.style.background = variant === "badge" ? gradientBadge(angle) : gradientButton(angle);
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [variant]);

  const radius = variant === "badge" ? "9999px" : "12px";

  return (
    <div
      className={`relative inline-flex ${className ?? ""}`}
      style={{ padding: "2px", borderRadius: radius }}
    >
      <div
        ref={borderRef}
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          ...(variant === "badge" ? { padding: "1.5px" } : {}),
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}
