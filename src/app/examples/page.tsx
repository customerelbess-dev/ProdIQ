import Link from "next/link";
import { AnimatedButton } from "@/components/LandingHeroClient";

const REPORTS = [
  {
    product: "Portable Neck Massager",
    score: 84,
    verdict: "GO" as const,
    metrics: ["Demand High", "Trend ↑", "Competition Med"],
    angles: ["Desk-neck rescue hook", "Gift they actually use"],
  },
  {
    product: "LED Face Mask",
    score: 71,
    verdict: "GO" as const,
    metrics: ["Demand Rising", "TikTok hot", "Margin Strong"],
    angles: ["Derm skepticism angle", "Glow in 14 days story"],
  },
  {
    product: "Meal Prep Chopper",
    score: 62,
    verdict: "CAUTION" as const,
    metrics: ["Demand Med", "Amazon crowded", "Price war risk"],
    angles: ["10-min weekly prep", "Busy parent POV"],
  },
  {
    product: "Magnetic Lash Kit",
    score: 58,
    verdict: "NO-GO" as const,
    metrics: ["Saturation High", "Returns spike", "Ads expensive"],
    angles: ["Skip generic glam", "Allergen-safe niche only"],
  },
  {
    product: "Posture Corrector",
    score: 79,
    verdict: "GO" as const,
    metrics: ["WFH tailwind", "UGC works", "UK strong"],
    angles: ["Remote worker pain", "Invisible under shirt"],
  },
  {
    product: "Ice Roller Set",
    score: 73,
    verdict: "GO" as const,
    metrics: ["Seasonal spike", "Low COG", "Influencer fit"],
    angles: ["Morning de-puff ritual", "Gym bag essential"],
  },
] as const;

function verdictStyle(v: (typeof REPORTS)[number]["verdict"]) {
  if (v === "GO") return "border-[#00d4aa]/45 bg-[#00d4aa]/12 text-[#00d4aa]";
  if (v === "CAUTION") return "border-[#f5a623]/45 bg-[#f5a623]/12 text-[#f5a623]";
  return "border-[#ff4444]/45 bg-[#ff4444]/12 text-[#ff8888]";
}

export default function ExamplesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <header className="mx-auto max-w-[640px] text-center">
          <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight">
            Real ProdIQ reports. Real results.
          </h1>
          <p className="mt-4 text-sm text-[#888888]">
            Sample outputs — upload your SKU to get your own full breakdown.
          </p>
        </header>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REPORTS.map((r) => (
            <div
              key={r.product}
              className="flex flex-col rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6"
              style={{ boxShadow: "0 0 40px rgba(108,71,255,0.08)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-white">{r.product}</h2>
                <span className={`rounded-lg border px-2 py-1 text-xs font-bold ${verdictStyle(r.verdict)}`}>
                  {r.verdict}
                </span>
              </div>
              <p className="mt-3 text-3xl font-black tabular-nums text-white">{r.score}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#555555]">ProdIQ score</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.metrics.map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#cccccc]"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-5 border-t border-[#1a1a1a] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">Winning angles</p>
                <ul className="mt-2 space-y-1.5 text-sm text-[#a78bfa]">
                  {r.angles.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center gap-4">
          <AnimatedButton href="/signup" text="Analyze my product →" />
          <Link href="/" className="text-sm text-[#888888] hover:text-white">
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
