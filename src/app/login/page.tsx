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

export default function LoginPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Sign in — ProdIQ";
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
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col bg-[#0a0a0a] lg:flex-row">
      <div className="relative order-2 flex min-h-[42vh] w-full flex-col items-center justify-center overflow-hidden lg:order-1 lg:min-h-screen lg:w-[60%]">
        <div className="absolute inset-0">
          <AuthParticleCanvas className="h-full w-full" />
        </div>
        <div className="relative z-[1] flex max-w-[400px] flex-col items-center px-6 py-12 text-center">
          <ProdIqLogoMark size={28} />
          <p
            className="mt-10 text-white italic"
            style={{ fontSize: 22, lineHeight: 1.5, maxWidth: 400 }}
          >
            Stop testing products that flop. Start winning with data.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {[
              "★★★★★ Trusted by 10,000+ sellers",
              "94% accuracy rate",
              "$2M+ saved",
            ].map((t) => (
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

      <div
        className="order-1 flex w-full flex-col justify-center border-[#111] px-6 py-12 lg:order-2 lg:w-[40%] lg:border-l lg:px-12"
        style={{ background: "#050505", paddingTop: 48, paddingBottom: 48 }}
      >
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8">
            <ProdIqBrandLogo variant="inline" />
          </div>
          <h1 className="font-bold text-white" style={{ fontSize: 32, marginBottom: 8 }}>
            Welcome back.
          </h1>
          <p className="text-[#888888]" style={{ fontSize: 14, marginBottom: 40 }}>
            Sign in to your ProdIQ account.
          </p>

          <form onSubmit={(e) => void onSubmit(e)}>
            {error ? (
              <p
                className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
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
            <div style={{ marginBottom: 8 }}>
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
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div className="mb-6 text-right">
              <Link href="#" className="text-xs text-[#888888] hover:text-white">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: "#6c47ff",
                borderRadius: 10,
                padding: 14,
                fontSize: 15,
                fontWeight: 600,
                border: "none",
              }}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="h-px bg-[#222]" />
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-3 text-xs text-[#666666]"
            >
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
            <p className="text-center text-xs text-[#666666]">Configure Supabase to enable Google sign-in.</p>
          )}

          <p className="mt-10 text-center text-sm text-[#888888]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-[#6c47ff] hover:underline">
              Start for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
