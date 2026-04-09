"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ProdIqBrandLogoLink } from "@/components/ProdIqBrandLogo";
import { supabase } from "@/lib/supabase";

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
  width: 240,
  background: "#111",
  borderRadius: 12,
  padding: 20,
};

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [workflowsHover, setWorkflowsHover] = useState(false);
  const workflowsRef = useRef<HTMLDivElement>(null);

  const workflowsVisible = workflowsOpen || workflowsHover;

  useEffect(() => {
    if (!supabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

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
    if (!supabaseConfigured) return;
    await supabase.auth.signOut();
  }

  return (
    <header
      className="fixed left-0 right-0 top-0 z-[100] border-b border-white/[0.06]"
      style={{
        background: "rgba(10,10,10,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <ProdIqBrandLogoLink variant="navbar" className="shrink-0" />
        <nav className="-mx-2 flex max-w-[52vw] flex-1 justify-center gap-5 overflow-visible px-2 sm:max-w-none sm:gap-8 md:flex-none">
          <div
            ref={workflowsRef}
            className="relative shrink-0"
            onMouseEnter={() => setWorkflowsHover(true)}
            onMouseLeave={() => setWorkflowsHover(false)}
          >
            <button
              type="button"
              aria-expanded={workflowsVisible}
              aria-haspopup="true"
              onClick={(e) => {
                e.stopPropagation();
                setWorkflowsOpen((o) => !o);
              }}
              className="flex items-center gap-1 text-sm text-[#888888] transition hover:text-white"
            >
              Workflows
              <span className="text-[10px] opacity-70" aria-hidden>
                ▼
              </span>
            </button>
            {workflowsVisible ? (
              <div
                className="absolute left-1/2 top-full z-[110] -translate-x-1/2 pt-2"
                style={{ minWidth: "min(92vw, 820px)" }}
              >
                <div style={dropdownPanelStyle}>
                  <div className="flex flex-wrap justify-center gap-4">
                    {WORKFLOW_CARDS.map((card) => (
                      <Link
                        key={card.title}
                        href={card.href}
                        className="shrink-0 cursor-pointer border border-[#1a1a1a] text-left transition-[border-color] duration-200 hover:border-[#6c47ff]"
                        style={workflowCardStyle}
                        onClick={() => setWorkflowsOpen(false)}
                      >
                        <div
                          className="mb-3 flex h-11 w-11 items-center justify-center rounded-full text-lg"
                          style={{ background: "rgba(108,71,255,0.25)" }}
                        >
                          {card.icon}
                        </div>
                        <h3 className="text-[15px] font-bold leading-snug text-white">{card.title}</h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-[#888888]">{card.description}</p>
                        <span className="mt-3 inline-block text-[13px] font-semibold text-[#6c47ff]">
                          Learn more →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <Link href="/resources" className="shrink-0 text-sm text-[#888888] transition hover:text-white">
            Resources
          </Link>
          <Link href="/pricing" className="shrink-0 text-sm text-[#888888] transition hover:text-white">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          {supabaseConfigured ? (
            user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="hidden rounded-lg border border-[#222222] px-3 py-1.5 text-sm text-[#888888] transition hover:border-[#333333] hover:text-white sm:inline"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg bg-[#6c47ff] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#5a3ad4] sm:inline"
              >
                Sign in
              </Link>
            )
          ) : (
            <Link href="/login" className="hidden text-sm text-[#888888] transition hover:text-white sm:inline">
              Login
            </Link>
          )}
          <PlainPurpleLink href="/signup">Start Free →</PlainPurpleLink>
        </div>
      </div>
    </header>
  );
}
