"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedButton } from "@/components/AnimatedButton";
import { EXAMPLE_REPORT } from "@/lib/example-report";

type MarketingCtasProps = {
  layout?: "hero" | "inline";
};

export function MarketingCtas({ layout = "hero" }: MarketingCtasProps) {
  const router = useRouter();

  function seeExample() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("prodiq_report", JSON.stringify(EXAMPLE_REPORT));
    }
    router.push("/report");
  }

  const wrap =
    layout === "hero"
      ? "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
      : "flex flex-col items-stretch gap-3 sm:flex-row";

  return (
    <div className={wrap}>
      {layout === "hero" ? (
        <AnimatedButton text="Analyze My First Product →" href="/signup" />
      ) : (
        <Link
          href="/signup"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[#6c47ff] px-6 text-sm font-semibold text-white transition hover:bg-[#5a3ad4]"
        >
          Analyze a Product →
        </Link>
      )}
      <button
        type="button"
        onClick={seeExample}
        className="inline-flex h-12 items-center justify-center rounded-lg border border-[#222222] bg-transparent px-6 text-sm font-semibold text-white transition hover:border-[#333333] hover:bg-[#111111]"
      >
        See example report
      </button>
    </div>
  );
}
