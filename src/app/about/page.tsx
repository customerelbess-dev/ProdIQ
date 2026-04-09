import Link from "next/link";
import { AnimatedButton } from "@/components/LandingHeroClient";
import { ProdIqBrandLogoLink } from "@/components/ProdIqBrandLogo";

const VALUES = [
  { title: "Truth before spend", line: "We surface what the data says — not what you hope it says." },
  { title: "Speed with depth", line: "Seconds to a report, not weeks of spreadsheets." },
  { title: "Built for operators", line: "Every screen is designed for people who ship products, not slide decks." },
] as const;

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <div className="mx-auto max-w-[720px] px-4 sm:px-6">
        <div className="mb-10">
          <ProdIqBrandLogoLink variant="inline" />
        </div>
        <h1 className="font-bold leading-tight text-white" style={{ fontSize: 48 }}>
          We built ProdIQ because we lost money too.
        </h1>
        <p className="mt-8 text-lg leading-relaxed text-[#aaaaaa]">
          We were ecom sellers. We wasted thousands testing products that flopped. No tool told us the truth before we
          spent. So we built one.
        </p>
        <p className="mt-6 text-base leading-relaxed text-[#888888]">
          ProdIQ fuses live market signals, competitor creatives, and buyer psychology into one verdict you can act on the
          same day — without hiring a research team.
        </p>
        <h2 className="mt-16 text-xl font-bold text-white">What we stand for</h2>
        <ul className="mt-6 space-y-6">
          {VALUES.map((v) => (
            <li key={v.title} className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6">
              <p className="font-semibold text-[#a78bfa]">{v.title}</p>
              <p className="mt-2 text-sm text-[#888888]">{v.line}</p>
            </li>
          ))}
        </ul>
        <h2 className="mt-16 text-xl font-bold text-white">Mission</h2>
        <p className="mt-4 text-base leading-relaxed text-[#888888]">
          Help every seller validate demand, find winning angles, and out-launch competitors — before capital is gone.
        </p>
        <div className="mt-12 flex justify-center">
          <AnimatedButton href="/signup" text="Start free →" />
        </div>
        <p className="mt-8 text-center text-sm text-[#666666]">
          <Link href="/" className="text-[#a78bfa] hover:underline">
            ← Back home
          </Link>
        </p>
      </div>
    </main>
  );
}
