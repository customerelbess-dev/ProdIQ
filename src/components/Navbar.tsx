"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ProdIqBrandLogoLink } from "@/components/ProdIqBrandLogo";
import { supabase } from "@/lib/supabase";
import { usePathname } from "next/navigation";

const supabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

function PlainPurpleLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-center transition hover:opacity-90"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 22px",
        background: "#6c47ff",
        borderRadius: "20px",
        color: "white",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

const WORKFLOW_CARDS = [
  {
    icon: "🔍",
    title: "Market Research & Validation",
    description: "Upload once — demand, trends, geo, and a clear go / no-go in seconds.",
    href: "/workflows/market-research",
  },
  {
    icon: "🎯",
    title: "Winning Angles & Ad Scripts",
    description: "Untapped hooks, emotional angles, and shoot-ready scripts per product.",
    href: "/workflows/angles-and-scripts",
  },
  {
    icon: "🕵️",
    title: "Competitor Intelligence",
    description: "Their ads, angles, and gaps — mapped so you can out-launch them fast.",
    href: "/workflows/competitor-intel",
  },
  {
    icon: "🤝",
    title: "World-Class Suppliers",
    description: "Factory-direct pricing, fast samples, and zero middlemen — ready for your product.",
    href: "/workflows/suppliers",
  },
] as const;

const dropdownPanelStyle: CSSProperties = {
  background: "rgba(10,10,10,0.95)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid #1a1a1a",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
};

const workflowCardStyle: CSSProperties = {
  background: "#111",
  borderRadius: 12,
  padding: 20,
};

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [workflowsHover, setWorkflowsHover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const workflowsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close mobile menu on navigation
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const workflowsVisible = workflowsOpen || workflowsHover;

  useEffect(() => {
    // Always attempt to read the session — don't gate on supabaseConfigured
    // because NEXT_PUBLIC_ env vars can evaluate to undefined at module level
    // even when they are properly set on Vercel.
    supabase.auth.getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => setUser(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!workflowsOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!workflowsRef.current?.contains(e.target as Node)) {
        setWorkflowsOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [workflowsOpen]);

  async function signOut() {
    await supabase.auth.signOut().catch(() => {});
  }

  return (
    <header
      className="fixed left-0 right-0 top-0 z-[100] border-b border-white/[0.06]"
      style={{
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Main bar */}
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <ProdIqBrandLogoLink variant="navbar" className="shrink-0" />

        {/* Desktop nav — hidden on mobile */}
        <nav className="hidden items-center gap-6 md:flex">
          <div
            ref={workflowsRef}
            className="relative"
            onMouseEnter={() => setWorkflowsHover(true)}
            onMouseLeave={() => setWorkflowsHover(false)}
          >
            <button
              type="button"
              aria-expanded={workflowsVisible}
              aria-haspopup="true"
              onClick={(e) => { e.stopPropagation(); setWorkflowsOpen((o) => !o); }}
              className="flex items-center gap-1 text-sm text-[#888888] transition hover:text-white"
            >
              Workflows
              <span className="text-[10px] opacity-70" aria-hidden>▼</span>
            </button>
            {workflowsVisible && (
              <div
                className="absolute left-1/2 top-full z-[110] -translate-x-1/2 pt-2"
                style={{ minWidth: "min(92vw, 560px)" }}
              >
                <div style={dropdownPanelStyle}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {WORKFLOW_CARDS.map((card) => (
                      <Link
                        key={card.title}
                        href={card.href}
                        className="cursor-pointer border border-[#1a1a1a] text-left transition-[border-color] duration-200 hover:border-[#6c47ff]"
                        style={workflowCardStyle}
                        onClick={() => setWorkflowsOpen(false)}
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full text-lg" style={{ background: "rgba(108,71,255,0.25)" }}>
                          {card.icon}
                        </div>
                        <h3 className="text-[15px] font-bold leading-snug text-white">{card.title}</h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#888888]">{card.description}</p>
                        <span className="mt-3 inline-block text-[13px] font-semibold text-[#6c47ff]">Learn more →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link href="/resources" className="text-sm text-[#888888] transition hover:text-white">Resources</Link>
          <Link href="/pricing" className="text-sm text-[#888888] transition hover:text-white">Pricing</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logged-in: show only Dashboard. Logged-out: Sign in + Start Free. */}
          {user ? (
            <Link
              href="/dashboard"
              className="hidden rounded-lg bg-[#6c47ff] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#5a3ad4] md:inline"
            >
              Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg border border-[#222] px-3 py-1.5 text-sm text-[#888] transition hover:border-[#6c47ff] hover:text-white md:inline"
              >
                Sign in
              </Link>
              <PlainPurpleLink href="/signup">Start Free →</PlainPurpleLink>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg border border-[#222] md:hidden"
          >
            <span className={`block h-px w-5 bg-[#888] transition-all duration-200 ${mobileMenuOpen ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`block h-px w-5 bg-[#888] transition-all duration-200 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-5 bg-[#888] transition-all duration-200 ${mobileMenuOpen ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="border-t border-white/[0.06] md:hidden"
          style={{ background: "rgba(10,10,10,0.98)", backdropFilter: "blur(20px)" }}
        >
          <div className="mx-auto max-w-[1200px] px-4 pb-6 pt-4">
            {/* Auth */}
            <div className="mb-4 flex gap-2">
              {user ? (
                <Link href="/dashboard" className="flex-1 rounded-lg bg-[#6c47ff] py-2 text-center text-sm font-semibold text-white">
                  Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1 rounded-lg border border-[#222] py-2 text-center text-sm text-[#888] transition hover:border-[#6c47ff] hover:text-white">
                    Sign in
                  </Link>
                  <Link href="/signup" className="flex-1 rounded-lg bg-[#6c47ff] py-2 text-center text-sm font-semibold text-white">
                    Start Free →
                  </Link>
                </>
              )}
            </div>

            {/* Nav links */}
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#444]">Navigation</div>
            <Link href="/resources" className="block py-2.5 text-sm text-[#888] transition hover:text-white">Resources</Link>
            <Link href="/pricing" className="block py-2.5 text-sm text-[#888] transition hover:text-white">Pricing</Link>

            {/* Workflows */}
            <div className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#444]">Workflows</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WORKFLOW_CARDS.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="flex items-center gap-3 rounded-xl border border-[#1a1a1a] p-3 text-left transition hover:border-[#6c47ff]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base" style={{ background: "rgba(108,71,255,0.25)" }}>
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{card.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-[#666]">{card.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
