"use client";

import { animate, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

type ScoreCardProps = {
  score: number;
  size?: number;
  stroke?: number;
};

function ringColor(score: number) {
  if (score > 65) return "#00d4aa";
  if (score >= 40) return "#f5a623";
  return "#ff4444";
}

export function ScoreCard({ score, size = 160, stroke = 10 }: ScoreCardProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = ringColor(clamped);

  const [displayScore, setDisplayScore] = useState(0);

  const progress = useMotionValue(0);
  const spring = useSpring(progress, { stiffness: 90, damping: 22 });
  const offset = useTransform(spring, (v) => c - (v / 100) * c);

  useEffect(() => {
    progress.set(clamped);
  }, [clamped, progress]);

  useEffect(() => {
    const ctrl = animate(0, clamped, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [clamped]);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#222222"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tabular-nums text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {displayScore}
        </motion.span>
        <span className="text-xs font-medium uppercase tracking-wider text-[#888888]">Score</span>
      </div>
    </div>
  );
}
