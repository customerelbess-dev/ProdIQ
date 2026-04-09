"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProdIqBrandLogoLink } from "@/components/ProdIqBrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-[#111111] bg-[#050505]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-[60px]">
        <div>
          <ProdIqBrandLogoLink variant="footer" className="mb-3" />
          <p className="mt-3 max-w-[200px] text-[13px] leading-relaxed text-[#888888]">
            AI-powered product intelligence for serious sellers.
          </p>
          <div className="mt-5 flex gap-2">
            <a
              href="#"
              aria-label="X (Twitter)"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#222222] bg-[#111111] text-[#888888] transition hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#222222] bg-[#111111] text-[#888888] transition hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#222222] bg-[#111111] text-[#888888] transition hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.5 8.5h2.5V18H6.5V8.5zm1.25-4a1.45 1.45 0 100 2.9 1.45 1.45 0 000-2.9zM11 12.6V18h2.5v-5.2c0-1.37.7-2.2 1.9-2.2 1.1 0 1.6.8 1.6 2V18H19v-5.7c0-2.5-1.3-3.7-3.2-3.7-1.5 0-2.4.8-2.8 1.4h-.04V8.5H11v4.1z" />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <p className="mb-4 text-[13px] font-bold text-white">Product</p>
          <Link href="/#features" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Features
          </Link>
          <Link href="/resources" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Resources
          </Link>
          <Link href="/resources#trusted-suppliers" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Trusted Suppliers
          </Link>
          <Link href="/pricing" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Pricing
          </Link>
          <Link href="/pricing" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            API
          </Link>
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: "13px", marginBottom: "16px" }}>Company</div>

          <div
            style={{
              marginBottom: "20px",
              padding: "12px",
              background: "#0c0c14",
              borderRadius: "10px",
              border: "1px solid #1a1a1a",
            }}
          >
            <div
              style={{
                color: "#6c47ff",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              ESTABLISHED 2019
            </div>
            <div style={{ color: "#888", fontSize: "12px", lineHeight: 1.6 }}>
              Built by sellers, for sellers. Over 6 years of product intelligence.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {[
              { label: "Active Users", value: "120K+" },
              { label: "Products Analyzed", value: "2.4M+" },
              { label: "Countries", value: "50+" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#555", fontSize: "12px" }}>{stat.label}</span>
                <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {(["About Us", "Blog", "Careers", "Press", "Contact"] as const).map((link) => (
            <Link
              key={link}
              href={link === "About Us" ? "/about" : "#"}
              className="mb-2.5 block text-[13px] text-[#555555] no-underline transition-colors duration-200 hover:text-white"
            >
              {link}
            </Link>
          ))}

          <div
            style={{
              marginTop: "16px",
              padding: "10px 12px",
              background: "rgba(108,71,255,0.05)",
              border: "1px solid rgba(108,71,255,0.15)",
              borderRadius: "8px",
            }}
          >
            <div style={{ color: "#6c47ff", fontSize: "10px", fontWeight: 700, marginBottom: "2px" }}>
              🏢 HEADQUARTERS
            </div>
            <div style={{ color: "#555", fontSize: "12px" }}>New York, NY 10001</div>
            <div style={{ color: "#555", fontSize: "12px" }}>United States</div>
          </div>
        </div>
        <div>
          <p className="mb-4 text-[13px] font-bold text-white">Support</p>
          <Link href="/help" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Help Center
          </Link>
          <a href="mailto:support@prodiq.app" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Contact Us
          </a>
          <Link href="/privacy" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="mb-2.5 block text-[13px] text-[#888888] hover:text-white">
            Terms
          </Link>
          <p className="mt-3 text-xs text-[#888888]">support@prodiq.app</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 border-t border-[#111111] px-6 py-6 sm:flex-row">
        <p className="text-xs text-[#888888]">© 2026 ProdIQ. All rights reserved.</p>
        <p className="text-xs text-[#888888]">Made for serious sellers. 🔥</p>
      </div>
    </footer>
  );
}

export function ConditionalFooter() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/analyze") ||
    pathname.startsWith("/report") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }
  return <Footer />;
}
