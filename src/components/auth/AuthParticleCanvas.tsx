"use client";

import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number };

/**
 * Full-bleed particle network + soft purple glow + rotating wireframe shapes.
 */
export function AuthParticleCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let rot = 0;
    let ro: ResizeObserver | null = null;

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    resize();
    ro = new ResizeObserver(resize);
    ro.observe(parent);

    const drawShapes = () => {
      rot += 0.003;
      const shapes = [
        { cx: w * 0.15, cy: h * 0.2, r: Math.min(w, h) * 0.12, sides: 6, phase: 0 },
        { cx: w * 0.85, cy: h * 0.75, r: Math.min(w, h) * 0.1, sides: 4, phase: 1.2 },
        { cx: w * 0.78, cy: h * 0.18, r: Math.min(w, h) * 0.07, sides: 3, phase: 2.1 },
      ];
      ctx.strokeStyle = "rgba(108, 71, 255, 0.22)";
      ctx.lineWidth = 1;
      for (const s of shapes) {
        ctx.beginPath();
        for (let i = 0; i <= s.sides; i++) {
          const a = rot + s.phase + (i * 2 * Math.PI) / s.sides;
          const x = s.cx + Math.cos(a) * s.r;
          const y = s.cy + Math.sin(a) * s.r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      const gradient = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.6);
      gradient.addColorStop(0, "rgba(108, 71, 255, 0.15)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      drawShapes();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(108, 71, 255, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro?.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden style={{ display: "block" }} />;
}
