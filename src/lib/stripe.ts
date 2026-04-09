/**
 * Shared Stripe helpers — server-side only.
 * Never import from client components.
 */

export type PlanKey = "starter" | "pro" | "agency";

/** Canonical plan names stored in Supabase profiles.plan */
export const PLAN_NAMES: Record<PlanKey, string> = {
  starter: "starter",
  pro:     "pro",
  agency:  "agency",
};

/**
 * Resolve the Stripe Price ID for a given plan key.
 * Reads from server-side env vars (STRIPE_PRICE_STARTER / PRO / AGENCY).
 * Throws a descriptive error if the variable is missing or empty.
 */
export function getPriceId(planKey: PlanKey): string {
  const envVarName =
    planKey === "starter" ? "STRIPE_PRICE_STARTER" :
    planKey === "pro"     ? "STRIPE_PRICE_PRO"     :
                            "STRIPE_PRICE_AGENCY";

  const priceId = process.env[envVarName]?.trim();

  if (!priceId) {
    throw new Error(
      `Missing Stripe price ID: environment variable ${envVarName} is not set. ` +
      `Add it to your Vercel project settings (Settings → Environment Variables).`,
    );
  }

  return priceId;
}

/**
 * Build a reverse map: Stripe Price ID → plan name.
 * Used by the webhook to look up which plan a subscription belongs to.
 */
export function buildPriceToPlan(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of ["starter", "pro", "agency"] as PlanKey[]) {
    const envVarName =
      key === "starter" ? "STRIPE_PRICE_STARTER" :
      key === "pro"     ? "STRIPE_PRICE_PRO"     :
                          "STRIPE_PRICE_AGENCY";
    const id = process.env[envVarName]?.trim();
    if (id) map[id] = PLAN_NAMES[key];
  }
  return map;
}
