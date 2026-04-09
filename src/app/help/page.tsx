"use client";

import { useState } from "react";
import Link from "next/link";

type Cat = "Getting Started" | "Billing" | "Features" | "Technical";

const FAQ: { category: Cat; q: string; a: string }[] = [
  {
    category: "Getting Started",
    q: "How do I run my first analysis?",
    a: "Create a free account, upload a product image, link, or description, and open the report. Your first runs are free.",
  },
  {
    category: "Getting Started",
    q: "What file types can I upload?",
    a: "Images (JPG, PNG, WebP) and pasted text or URLs work best. Clear product shots improve match quality.",
  },
  {
    category: "Billing",
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade from billing settings. Changes apply on your next cycle unless noted otherwise.",
  },
  {
    category: "Billing",
    q: "Do you offer refunds?",
    a: "We offer a 7-day satisfaction window on paid plans. Contact support with your account email.",
  },
  {
    category: "Features",
    q: "What is included in the free tier?",
    a: "A limited number of full reports per month with core demand, verdict, and angle previews. Pro unlocks depth and exports.",
  },
  {
    category: "Features",
    q: "Where do competitor ads come from?",
    a: "We aggregate public ad surfaces and normalize them into angles, weaknesses, and creative patterns for your niche.",
  },
  {
    category: "Technical",
    q: "Is my product data private?",
    a: "Yes. Your uploads and reports are tied to your account and not used to train third-party models.",
  },
  {
    category: "Technical",
    q: "Why is my report still loading?",
    a: "Heavy traffic or large source sets can add a few seconds. Refresh once; if it persists, email support with the time and product.",
  },
];

const CATEGORIES: Cat[] = ["Getting Started", "Billing", "Features", "Technical"];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [filter, setFilter] = useState<Cat | "All">("All");

  const items = filter === "All" ? FAQ : FAQ.filter((x) => x.category === filter);

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6">
        <h1 className="text-center text-[clamp(1.75rem,4vw,2.5rem)] font-bold">Help Center</h1>
        <p className="mx-auto mt-3 max-w-[480px] text-center text-sm text-[#888888]">
          Quick answers about ProdIQ. Email{" "}
          <a href="mailto:support@prodiq.app" className="text-[#a78bfa] hover:underline">
            support@prodiq.app
          </a>{" "}
          anytime.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("All")}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              filter === "All" ? "bg-[#6c47ff] text-white" : "border border-[#333] text-[#888888] hover:border-[#444]"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setFilter(c);
                setOpen(null);
              }}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                filter === c ? "bg-[#6c47ff] text-white" : "border border-[#333] text-[#888888] hover:border-[#444]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mt-10 space-y-2">
          {items.map((item, i) => {
            const idx = FAQ.indexOf(item);
            const isOpen = open === idx;
            return (
              <div key={item.q} className="rounded-xl border border-[#1a1a1a] bg-[#0d0d0d]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-white sm:text-base"
                >
                  <span>{item.q}</span>
                  <span className="shrink-0 text-[#6c47ff]" aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? <p className="border-t border-[#1a1a1a] px-4 pb-4 pt-3 text-sm leading-relaxed text-[#888888]">{item.a}</p> : null}
              </div>
            );
          })}
        </div>
        <p className="mt-12 text-center text-sm text-[#666666]">
          <Link href="/" className="text-[#a78bfa] hover:underline">
            ← Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
