"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthParticleCanvas } from "@/components/auth/AuthParticleCanvas";
import { GoogleGIcon } from "@/components/auth/GoogleGIcon";
import { ProdIqBrandLogo } from "@/components/ProdIqBrandLogo";
import { ProdIqLogoMark } from "@/components/auth/ProdIqLogoMark";
import { supabase } from "@/lib/supabase";

const supabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

const inputBase = {
  width: "100%",
  background: "#111",
  border: "1px solid #222",
  borderRadius: "10px",
  padding: "14px 16px",
  color: "white",
  fontSize: "14px",
  outline: "none" as const,
  transition: "border-color 0.2s",
};

function SignupReportPreview() {
  const [score, setScore] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const duration = 2200;
    const target = 84;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - (1 - p) ** 3;
      setScore(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      <style>{`
        @keyframes auth-card-float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        .auth-preview-card {
          animation: auth-card-float 5s ease-in-out infinite;
        }
      `}</style>
      <div className="auth-preview-card relative z-[1] w-full max-w-[340px] px-4">
        <div
          className="rounded-2xl p-6 shadow-[0_0_80px_rgba(108,71,255,0.2)]"
          style={{ background: "#070708", border: "1px solid #1f1f1f" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#555555]">Market validation</p>
          <h3 className="mt-1 text-lg font-bold text-white">Portable LED Lamp</h3>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{
                background: "conic-gradient(from 200deg, #00d4aa, #6c47ff, #00d4aa)",
                padding: 3,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0a0a0a]">
                <span className="text-3xl font-black tabular-nums text-white">{score}</span>
                <span className="text-[9px] text-[#888888]">Score</span>
              </div>
            </div>
            <span className="rounded-lg border border-[#00d4aa]/50 bg-[#00d4aa]/15 px-3 py-1.5 text-xs font-bold text-[#00d4aa]">
              GO
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Demand High", "Trend Up", "Low competition"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-[#cccccc]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center text-base text-white">Your first analysis is free. No credit card needed.</p>
      </div>
    </>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Create account — ProdIQ";
  }, []);

  async function signInGoogle() {
    if (!supabaseConfigured || typeof window === "undefined") return;
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/dashboard` },
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabaseConfigured) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!agreed) return;
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    const user = data.user;
    const session = data.session;
    if (user && session) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: fullName.trim() || null,
          email: email.trim() || null,
        },
        { onConflict: "id" },
      );
      if (profileError) {
        setLoading(false);
        setError(profileError.message);
        return;
      }
    }
    setLoading(false);
    if (session) {
      router.push("/dashboard");
    } else {
      setError(
        "Account created. Check your email to confirm your address, then sign in.",
      );
    }
  }

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col bg-[#0a0a0a] lg:flex-row">
      <div
        className="order-1 flex w-full flex-col justify-center px-6 py-12 lg:order-1 lg:w-[40%] lg:px-12"
        style={{ background: "#050505", paddingTop: 48, paddingBottom: 48 }}
      >
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-2">
            <ProdIqBrandLogo variant="inline" />
          </div>
          <h1 className="mt-8 font-bold text-white" style={{ fontSize: 32, marginBottom: 8 }}>
            Create your account.
          </h1>
          <p className="text-[#888888]" style={{ fontSize: 14, marginBottom: 32 }}>
            Start validating products in 60 seconds.
          </p>

          <form onSubmit={(e) => void onSubmit(e)}>
            {error ? (
              <p
                className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
                  error.includes("Check your email")
                    ? "border-[#6c47ff]/40 bg-[#6c47ff]/10 text-[#d4ccff]"
                    : "border-red-500/40 bg-red-500/10 text-red-200"
                }`}
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  color: "#666",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                FULL NAME
              </label>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Jane Seller"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6c47ff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#222";
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  color: "#666",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6c47ff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#222";
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  color: "#666",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6c47ff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#222";
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  color: "#666",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                name="confirm"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                required
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = "#6c47ff";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#222";
                }}
              />
            </div>
            <p className="mb-4 text-xs text-[#666666]">🔒 Your data is encrypted and never shared.</p>
            <label className="mb-6 flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#333] bg-[#111] accent-[#6c47ff]"
              />
              <span className="text-xs text-[#888888]">I agree to the Terms of Service and Privacy Policy</span>
            </label>
            <button
              type="submit"
              disabled={!agreed || loading}
              className="w-full cursor-pointer font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: "#6c47ff",
                borderRadius: 10,
                padding: 14,
                fontSize: 15,
                fontWeight: 600,
                border: "none",
              }}
            >
              {loading ? "Creating account…" : "Create My Account →"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="h-px bg-[#222]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-3 text-xs text-[#666666]">
              or
            </span>
          </div>

          {supabaseConfigured ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void signInGoogle()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#222] bg-[#111] py-3 text-sm font-medium text-white transition hover:border-[#333] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleGIcon />
              Continue with Google
            </button>
          ) : (
            <p className="text-center text-xs text-[#666666]">Configure Supabase to enable Google sign-up.</p>
          )}

          <p className="mt-10 text-center text-sm text-[#888888]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#6c47ff] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="relative order-2 flex min-h-[42vh] w-full flex-col items-center justify-center overflow-hidden lg:order-2 lg:min-h-screen lg:w-[60%]">
        <div className="absolute inset-0">
          <AuthParticleCanvas className="h-full w-full" />
        </div>
        <div className="relative z-[1] flex max-w-[400px] flex-col items-center px-6 py-12 text-center">
          <ProdIqLogoMark size={28} />
          <p className="mt-10 text-white italic" style={{ fontSize: 22, lineHeight: 1.5, maxWidth: 400 }}>
            Stop testing products that flop. Start winning with data.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {["★★★★★ Trusted by 10,000+ sellers", "94% accuracy rate", "$2M+ saved"].map((t) => (
              <span
                key={t}
                style={{
                  background: "rgba(17,17,17,0.85)",
                  border: "1px solid #222",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 12,
                  color: "#888",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
