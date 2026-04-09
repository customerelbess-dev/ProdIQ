import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-center text-sm text-[#888888]">Signing you in…</p>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
