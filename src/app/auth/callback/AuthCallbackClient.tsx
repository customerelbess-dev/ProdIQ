"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      router.replace("/");
      return;
    }

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (!code) {
      router.replace(next);
      return;
    }

    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      router.replace(error ? "/dashboard" : next);
    });
  }, [router, searchParams]);

  return (
    <p className="p-4 text-center text-sm text-[#888888]">Signing you in…</p>
  );
}
