/**
 * Shared Stripe helpers — safe to import from both API routes and server components.
 * Do NOT import from client components (contains secret-adjacent constants).
 */

/** Map from Stripe Price ID → plan name stored in Supabase profiles.plan */
export function buildPriceToPlan(): Record<string, string> {
  const map: Record<string, string> = {};
  if (process.env.STRIPE_PRICE_STARTER)    map[process.env.STRIPE_PRICE_STARTER]    = "starter";
  if (process.env.STRIPE_PRICE_PRO)        map[process.env.STRIPE_PRICE_PRO]        = "pro";
  if (process.env.STRIPE_PRICE_ENTERPRISE) map[process.env.STRIPE_PRICE_ENTERPRISE] = "enterprise";
  return map;
}
