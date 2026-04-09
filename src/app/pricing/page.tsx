// Server component — owns the route segment config.
// All interactive UI lives in pricing-client.tsx (a "use client" file).
export const dynamic = "force-dynamic";

import { PricingClient } from "./pricing-client";

export default function PricingPage() {
  return <PricingClient />;
}
