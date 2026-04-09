"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

const ANIMATED_STATS_CONFIG = [
  { target: 50, prefix: "", suffix: "K+", label: "Products Validated", stopAt: 500 },
  { target: 10, prefix: "", suffix: "sec", label: "To Full Launch Plan", stopAt: 1000 },
  { target: 94, prefix: "", suffix: "%", label: "Angle Accuracy Rate", stopAt: 1500 },
  { target: 2, prefix: "$", suffix: "M+", label: "Saved on Bad Products", stopAt: 2000 },
] as const;

/** Point t in [0,1) along perimeter of rounded rect, clockwise from top edge after top-left corner. */
function getPointOnRoundedRect(t: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const top = w - 2 * r;
  const right = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const perimeter = 2 * top + 2 * right + 4 * arc;
  let p = (((t % 1) + 1) % 1) * perimeter;

  if (p < top) {
    return { x: r + p, y: 0 };
  }
  p -= top;
  if (p < arc) {
    const a = p / r;
    return { x: w - r + r * Math.sin(a), y: r - r * Math.cos(a) };
  }
  p -= arc;
  if (p < right) {
    return { x: w, y: r + p };
  }
  p -= right;
  if (p < arc) {
    const a = p / r;
    return { x: w - r + r * Math.cos(a), y: h - r + r * Math.sin(a) };
  }
  p -= arc;
  if (p < top) {
    return { x: w - r - p, y: h };
  }
  p -= top;
  if (p < arc) {
    const a = p / r;
    return { x: r - r * Math.sin(a), y: h - r + r * Math.cos(a) };
  }
  p -= arc;
  return { x: 0, y: h - r - p };
}

export function AnimatedBadge({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let progress = 0;
    let speed = 0.004;
    let slowTimer = 0;
    let ro: ResizeObserver | null = null;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    ro = new ResizeObserver(resize);
    ro.observe(container);

    const animate = () => {
      slowTimer++;
      if (slowTimer > 80 && slowTimer < 130) speed = 0.001;
      else if (slowTimer > 130 && slowTimer < 160) speed = 0.012;
      else if (slowTimer > 160) {
        speed = 0.004;
        slowTimer = 0;
      }
      progress = (progress + speed) % 1;

      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const cornerR = h / 2;

      ctx.clearRect(0, 0, w, h);
      const pt = getPointOnRoundedRect(progress, w, h, cornerR);

      const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 18);
      gradient.addColorStop(0, "rgba(167, 139, 250, 1)");
      gradient.addColorStop(0.35, "rgba(108, 71, 255, 0.55)");
      gradient.addColorStop(1, "rgba(108, 71, 255, 0)");

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        borderRadius: "9999px",
        padding: "1.5px",
        background: "transparent",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "9999px",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 3,
          background: "rgba(108, 71, 255, 0.15)",
          border: "1px solid rgba(108, 71, 255, 0.3)",
          borderRadius: "9999px",
          padding: "6px 16px",
          fontSize: "13px",
          color: "#a78bfa",
          fontWeight: 500,
          letterSpacing: "0.02em",
          backdropFilter: "blur(8px)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function AnimatedButton({
  text,
  href,
  onClick,
}: {
  text: string;
  href?: string;
  onClick?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let progress = 0;
    let speed = 0.004;
    let slowTimer = 0;
    let frame = 0;
    let ro: ResizeObserver | null = null;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    ro = new ResizeObserver(resize);
    ro.observe(container);

    const animate = () => {
      slowTimer++;
      if (slowTimer > 80 && slowTimer < 130) speed = 0.001;
      else if (slowTimer > 130 && slowTimer < 160) speed = 0.012;
      else if (slowTimer > 160) {
        speed = 0.004;
        slowTimer = 0;
      }

      progress = (progress + speed) % 1;

      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const r = Math.min(22, w / 2 - 0.5, h / 2 - 0.5);

      ctx.clearRect(0, 0, w, h);
      const pt = getPointOnRoundedRect(progress, w, h, r);

      const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 20);
      gradient.addColorStop(0, "rgba(108, 71, 255, 1)");
      gradient.addColorStop(0.3, "rgba(167, 139, 250, 0.6)");
      gradient.addColorStop(1, "rgba(108, 71, 255, 0)");

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
    };
  }, []);

  const buttonStyle: CSSProperties = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 28px",
    background: "#6c47ff",
    borderRadius: "22px",
    border: "none",
    color: "white",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    overflow: "hidden",
    textDecoration: "none",
  };

  const content = (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        borderRadius: "22px",
        padding: "1.5px",
        background: "transparent",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          borderRadius: "22px",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <div style={buttonStyle}>
        <span style={{ position: "relative", zIndex: 3 }}>{text}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "inline-flex" }}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "inline-flex", cursor: "pointer", border: "none", padding: 0, background: "none" }}
    >
      {content}
    </button>
  );
}

export function AnimatedStats() {
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted((s) => (s ? s : true));
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();
    const totalDuration = 2200;
    let rafId = 0;

    const frame = (now: number) => {
      const elapsed = now - startTime;

      setCounts(
        ANIMATED_STATS_CONFIG.map((stat) => {
          if (elapsed >= stat.stopAt) return stat.target;
          const progress = elapsed / stat.stopAt;
          const eased = 1 - Math.pow(1 - progress, 3);
          return Math.floor(eased * stat.target);
        }),
      );

      if (elapsed < totalDuration) {
        rafId = requestAnimationFrame(frame);
      } else {
        setCounts(ANIMATED_STATS_CONFIG.map((s) => s.target));
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [started]);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        gap: "16px",
        justifyContent: "center",
        flexWrap: "wrap",
        margin: "48px auto",
        maxWidth: "800px",
      }}
    >
      {ANIMATED_STATS_CONFIG.map((stat, i) => (
        <div
          key={stat.label}
          style={{
            background: "#111111",
            border: "1px solid #222222",
            borderRadius: "12px",
            padding: "20px 28px",
            textAlign: "center",
            minWidth: "150px",
            flex: "1",
          }}
        >
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#6c47ff" }}>
            {stat.prefix}
            {counts[i]}
            {stat.suffix}
          </div>
          <div style={{ fontSize: "12px", color: "#666666", marginTop: "6px" }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
