"use client";

import { useEffect, useRef } from "react";

type Shape = {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  speed: number;
  opacity: number;
};

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let shapes: Shape[] = [];

    const rebuildShapes = () => {
      const w = canvas.width;
      const h = canvas.height;
      shapes = [
        { x: -120, y: h * 0.3, width: 280, height: 280, angle: 25, speed: 0.0004, opacity: 0.12 },
        { x: w + 80, y: h * 0.6, width: 320, height: 320, angle: -15, speed: 0.0003, opacity: 0.1 },
        { x: w * 0.5, y: -100, width: 240, height: 240, angle: 45, speed: 0.0005, opacity: 0.08 },
        { x: -60, y: h * 0.7, width: 180, height: 180, angle: -30, speed: 0.0006, opacity: 0.07 },
        { x: w + 40, y: h * 0.2, width: 200, height: 200, angle: 60, speed: 0.0004, opacity: 0.09 },
      ];
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      rebuildShapes();
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      pulse: number;
    }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;
    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach((shape, si) => {
        shape.angle += shape.speed * 60;

        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate((shape.angle * Math.PI) / 180);

        const lightPos = (Math.sin(time * 0.8 + si * 1.2) + 1) / 2;

        const gradient = ctx.createLinearGradient(-shape.width / 2, 0, shape.width / 2, 0);
        gradient.addColorStop(0, "rgba(108,71,255,0)");
        gradient.addColorStop(Math.max(0, lightPos - 0.08), "rgba(108,71,255,0)");
        gradient.addColorStop(lightPos, `rgba(108,71,255,${shape.opacity * 4})`);
        gradient.addColorStop(Math.min(1, lightPos + 0.08), "rgba(108,71,255,0)");
        gradient.addColorStop(1, "rgba(108,71,255,0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);

        ctx.strokeStyle = `rgba(108,71,255,${shape.opacity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);

        ctx.restore();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const opacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1, i + 5).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(108,71,255,${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.6,
      }}
      aria-hidden
    />
  );
}
