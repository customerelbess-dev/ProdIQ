/**
 * Shared Stripe + plan helpers — server-side only.
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
 * Per-plan analysis limits.
 * - period: "total" counts all-time rows; "daily" counts rows created today.
 * - limit: null means unlimited.
 */
export const PLAN_LIMITS: Record<string, { limit: number | null; period: "total" | "daily"; label: string }> = {
  free:       { limit: 1,    period: "total", label: "1 total analysis" },
  starter:    { limit: 15,   period: "daily", label: "15 analyses / day" },
  pro:        { limit: 30,   period: "daily", label: "30 analyses / day" },
  agency:     { limit: null, period: "daily", label: "Unlimited analyses" },
  enterprise: { limit: null, period: "daily", label: "Unlimited analyses" }, // legacy alias
};

/** Ordered plan hierarchy (lowest → highest) */
const PLAN_ORDER = ["free", "starter", "pro", "agency"] as const;

/** Returns the next plan up, or null if already at the top */
export function nextPlanUp(currentPlan: string): PlanKey | null {
  const idx = PLAN_ORDER.indexOf(currentPlan as (typeof PLAN_ORDER)[number]);
  if (idx === -1 || idx >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[idx + 1] as PlanKey;
}

/** Returns all plans above the given plan (for upgrade wall) */
export function plansAbove(currentPlan: string): PlanKey[] {
  const idx = PLAN_ORDER.indexOf(currentPlan as (typeof PLAN_ORDER)[number]);
  if (idx === -1) return ["starter", "pro", "agency"];
  return PLAN_ORDER.slice(idx + 1).filter((p) => p !== "free") as PlanKey[];
}

/** Human-readable display label for a plan */
export function planDisplayLabel(plan: string): string {
  const labels: Record<string, string> = {
    free: "Free", starter: "Starter", pro: "Pro",
    agency: "Agency", enterprise: "Agency",
  };
  return labels[plan] ?? (plan.charAt(0).toUpperCase() + plan.slice(1));
}

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
