"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScoreCard } from "@/components/ScoreCard";
import { ReportSection } from "@/components/ReportSection";
import { supabase } from "@/lib/supabase";
import type { ProdIQReport, Verdict } from "@/lib/types";

function verdictStyles(v: Verdict) {
  switch (v) {
    case "GO":
      return {
        bg: "bg-[#00d4aa]/15",
        border: "border-[#00d4aa]/50",
        text: "text-[#00d4aa]",
      };
    case "NO-GO":
      return {
        bg: "bg-[#ff4444]/15",
        border: "border-[#ff4444]/50",
        text: "text-[#ff4444]",
      };
    default:
      return {
        bg: "bg-[#f5a623]/15",
        border: "border-[#f5a623]/50",
        text: "text-[#f5a623]",
      };
  }
}

const BREAKDOWN = [
  { key: "demand" as const, label: "Demand strength", max: 25 },
  { key: "competition" as const, label: "Competition level", max: 20 },
  { key: "profit" as const, label: "Profit potential", max: 20 },
  { key: "trend" as const, label: "Trend direction", max: 15 },
  { key: "angle" as const, label: "Unique angle potential", max: 20 },
];

function loadReport(): ProdIQReport | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("prodiq_report");
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<ProdIQReport>;
    if (typeof o.product_name !== "string" || typeof o.score !== "number") return null;
    const b = o.score_breakdown;
    const score_breakdown =
      b && typeof b === "object"
        ? {
            demand: Number(b.demand) || 0,
            competition: Number(b.competition) || 0,
            profit: Number(b.profit) || 0,
            trend: Number(b.trend) || 0,
            angle: Number(b.angle) || 0,
          }
        : { demand: 0, competition: 0, profit: 0, trend: 0, angle: 0 };
    return { ...o, score_breakdown } as ProdIQReport;
  } catch {
    return null;
  }
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<ProdIQReport | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    // Client-only: sessionStorage is unavailable during SSR/first paint alignment.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage after mount
    setReport(loadReport());
  }, []);

  const saveReport = useCallback(async () => {
    setSaveMsg(null);
    if (!report) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setSaveMsg("Add Supabase environment variables to enable saving.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveMsg("Sign in from the header to save reports to your account.");
      return;
    }
    const { error } = await supabase.from("saved_reports").insert({
      user_id: user.id,
      payload: report,
    });
    if (error) {
      setSaveMsg(
        error.message.includes("relation")
          ? "Create a saved_reports table (payload jsonb, user_id uuid) and RLS for authenticated inserts."
          : error.message,
      );
      return;
    }
    setSaveMsg("Report saved.");
  }, [report]);

  if (!report) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-[88px] sm:pt-[96px]">
        <p className="text-center text-[#888888]">No report found. Run an analysis first.</p>
        <Link
          href="/signup"
          className="mt-6 rounded-lg bg-[#6c47ff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5a3ad4]"
        >
          Analyze a product
        </Link>
      </div>
    );
  }

  const vs = verdictStyles(report.verdict);

  return (
    <div className="flex flex-1 flex-col pb-16 pt-[72px] sm:pb-24 sm:pt-[84px]">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-xl border border-[#222222] bg-[#111111] p-6 sm:p-8"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 space-y-4">
              <p className="text-sm font-medium uppercase tracking-wider text-[#888888]">
                Validation report
              </p>
              <h1 className="text-balance text-3xl font-bold text-white sm:text-4xl">
                {report.product_name}
              </h1>
              <div
                className={`inline-flex w-fit items-center rounded-lg border px-4 py-2 text-lg font-bold ${vs.bg} ${vs.border} ${vs.text}`}
              >
                {report.verdict}
              </div>
              <p className="max-w-xl text-[#888888]">{report.verdict_reason}</p>
            </div>
            <div className="flex shrink-0 justify-center lg:justify-end">
              <ScoreCard score={report.score} size={176} stroke={11} />
            </div>
          </div>
        </motion.section>

        <div className="space-y-10">
          <ReportSection title="Score breakdown" subtitle="How we weighted your opportunity">
            <div className="space-y-5">
              {BREAKDOWN.map(({ key, label, max }) => {
                const val = Number(report.score_breakdown[key] ?? 0);
                const pct = Math.min(100, Math.round((val / max) * 100));
                const barColor =
                  pct >= 70 ? "bg-[#00d4aa]" : pct >= 45 ? "bg-[#f5a623]" : "bg-[#ff4444]";
                return (
                  <div key={key}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-white">{label}</span>
                      <span className="tabular-nums text-[#888888]">
                        {val} / {max}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#222222]">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ReportSection>

          <ReportSection title="Market intelligence">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  Market size
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white">{report.market.size}</p>
              </div>
              <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  Trend
                </p>
                <p className="mt-2 text-lg font-semibold text-[#6c47ff]">{report.market.trend}</p>
              </div>
              <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  Best platforms
                </p>
                <p className="mt-2 text-sm text-white">
                  {report.market.best_platforms.join(", ") || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  Seasonal pattern
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white">{report.market.seasonal}</p>
              </div>
            </div>
          </ReportSection>

          <ReportSection title="Top competitors">
            <div className="grid gap-4 md:grid-cols-2">
              {report.competitors.map((c) => (
                <div
                  key={c.name}
                  className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4"
                >
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="mt-2 text-sm text-[#f5a623]">
                    <span className="font-medium text-[#888888]">Weakness: </span>
                    {c.weakness}
                  </p>
                  <p className="mt-2 text-sm text-[#888888]">
                    Price range: <span className="text-white">{c.price_range}</span>
                  </p>
                </div>
              ))}
            </div>
          </ReportSection>

          <ReportSection
            title="Customer psychology"
            subtitle="The layer most sellers skip — and the one that prints"
          >
            <div className="space-y-6">
              <div className="rounded-lg border border-[#6c47ff]/40 bg-[#6c47ff]/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6c47ff]">
                  The real reason they buy
                </p>
                <p className="mt-3 text-base leading-relaxed text-white">
                  {report.psychology.real_reason}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-white">Pain points</p>
                <ul className="list-inside list-disc space-y-1.5 text-sm text-[#888888]">
                  {report.psychology.pain_points.map((p) => (
                    <li key={p} className="text-[#cccccc]">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-white">Emotional triggers</p>
                <div className="flex flex-wrap gap-2">
                  {report.psychology.emotional_triggers.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-[#222222] bg-[#0a0a0a] px-3 py-1 text-xs text-[#00d4aa]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-white">Customer language</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {report.psychology.customer_language.map((q) => (
                    <blockquote
                      key={q}
                      className="border-l-2 border-[#6c47ff] bg-[#0a0a0a] py-2 pl-4 pr-3 text-sm italic text-[#cccccc]"
                    >
                      “{q}”
                    </blockquote>
                  ))}
                </div>
              </div>
            </div>
          </ReportSection>

          <ReportSection title="Winning ad angles">
            <div className="space-y-4">
              {report.angles.map((a) => (
                <div
                  key={a.name}
                  className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4"
                >
                  <h3 className="font-semibold text-[#6c47ff]">{a.name}</h3>
                  <p className="mt-2 text-sm text-[#cccccc]">{a.message}</p>
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-[#222222] bg-[#111111] p-3 font-mono text-xs text-[#00d4aa]">
                    {a.hook}
                  </pre>
                  <p className="mt-3 text-xs leading-relaxed text-[#888888]">
                    <span className="font-semibold text-[#888888]">Why it works: </span>
                    {a.why_it_works}
                  </p>
                </div>
              ))}
            </div>
          </ReportSection>

          <ReportSection title="Creative ideas">
            <div className="space-y-4">
              <span className="inline-flex rounded-lg border border-[#6c47ff]/50 bg-[#6c47ff]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#6c47ff]">
                {report.creative.best_format}
              </span>
              <div>
                <p className="mb-2 text-sm font-medium text-white">Video concepts</p>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-[#cccccc]">
                  {report.creative.video_concepts.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ol>
              </div>
              <p className="text-sm leading-relaxed text-[#888888]">
                <span className="font-medium text-white">Visual style: </span>
                {report.creative.visual_style}
              </p>
            </div>
          </ReportSection>

          {report.summary ? (
            <ReportSection title="Executive summary">
              <p className="text-sm leading-relaxed text-[#cccccc]">{report.summary}</p>
            </ReportSection>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => void saveReport()}
            className="h-12 rounded-lg border border-[#222222] bg-[#111111] px-6 text-sm font-semibold text-white transition hover:border-[#6c47ff]/50 hover:bg-[#141414]"
          >
            Save report
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("prodiq_report");
              router.push("/analyze");
            }}
            className="h-12 rounded-lg bg-[#6c47ff] px-6 text-sm font-semibold text-white transition hover:bg-[#5a3ad4]"
          >
            Analyze another product
          </button>
        </div>
        {saveMsg ? (
          <p className="mt-4 text-center text-sm text-[#888888]">{saveMsg}</p>
        ) : null}
      </div>
    </div>
  );
}
