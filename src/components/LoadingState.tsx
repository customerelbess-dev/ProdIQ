"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  "Searching market data…",
  "Analyzing competitors…",
  "Reading customer psychology…",
  "Building your verdict…",
] as const;

type LoadingStateProps = {
  completedSteps: boolean[];
};

export function LoadingState({ completedSteps }: LoadingStateProps) {
  return (
    <div className="w-full max-w-md space-y-4 rounded-xl border border-[#222222] bg-[#111111] p-8">
      <p className="text-center text-sm font-medium text-[#888888]">Analyzing your product</p>
      <ul className="space-y-3">
        {STEPS.map((label, i) => {
          const done = completedSteps[i];
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                  done
                    ? "border-[#00d4aa] bg-[#00d4aa]/15 text-[#00d4aa]"
                    : "border-[#222222] bg-[#0a0a0a] text-[#555555]"
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={done ? "text-white" : "text-[#888888]"}>{label}</span>
            </motion.li>
          );
        })}
      </ul>
      <div className="pt-2">
        <div className="h-1 overflow-hidden rounded-full bg-[#222222]">
          <motion.div
            className="h-full bg-[#6c47ff]"
            initial={{ width: "0%" }}
            animate={{
              width: `${((completedSteps.filter(Boolean).length + (completedSteps.some((x) => x) ? 0.15 : 0)) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
