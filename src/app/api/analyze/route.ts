import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { runFullAnalysis, type AnalyzeInput } from "@/lib/analyze-pipeline";
import { nextPlanUp } from "@/lib/stripe";

interface UsageInfo {
  /** Non-null means the request should be blocked with this response */
  blockResponse: NextResponse | null;
  /** True when this user's usage should be incremented after success */
  shouldRecord: boolean;
  /**
   * True when this analysis will consume the user's LAST allowed slot.
   * Used to send a hint to the frontend (free_limit_reached) so the next
   * "New Product" click can skip a server round-trip and show the wall
   * immediately — without interrupting the current analysis flow.
   */
  isLastAllowed: boolean;
  /**
   * Call AFTER a successful analysis to record usage.
   * Closes over the Supabase client — no args needed.
   */
  recordUsage: () => Promise<void>;
}

/**
 * Determine which period to count analyses for, based on plan name.
 * - free: count all-time rows (analysis_count from profiles is the source of truth)
 * - starter / pro: count rows created today (resets naturally each day)
 * - agency / enterprise: unlimited (skip check entirely)
 */
function periodForPlan(plan: string): "total" | "daily" | "unlimited" {
  if (plan === "agency" || plan === "enterprise") return "unlimited";
  if (plan === "free") return "total";
  return "daily"; // starter, pro
}

/** Human-readable quota label for 402 error messages */
function quotaLabel(limit: number, period: "total" | "daily"): string {
  if (period === "total") return `${limit} total analysis${limit === 1 ? "" : "s"}`;
  return `${limit} analysis${limit === 1 ? "" : "es"} per day`;
}

/**
 * Server-side usage check.
 *
 * Source of truth for limits: `analysis_limit` column in the `profiles` table.
 * Source of truth for usage count: rows in the `analyses` table.
 *   - free plan: counts all-time rows (never resets)
 *   - starter/pro: counts rows created today (resets automatically at midnight)
 *
 * Fails open (allows the request) on any infrastructure error so a misconfigured
 * Supabase connection never blocks a legitimate user.
 */
async function resolveUsage(req: NextRequest): Promise<UsageInfo> {
  const noop: UsageInfo = { blockResponse: null, shouldRecord: false, isLastAllowed: false, recordUsage: async () => {} };

  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return noop;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) return noop;

  try {
    const client = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userErr } = await client.auth.getUser();
    if (userErr || !user?.id) return noop;

    const userId = user.id;

    // ── 1. Read plan + limits directly from profiles table ─────────────────
    const { data: profile, error: profileErr } = await client
      .from("profiles")
      .select("plan, analysis_count, analysis_limit")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) {
      console.error(`[analyze] profiles read error for user=${userId}:`, profileErr.message);
    }

    const plan           = String(profile?.plan ?? "free");
    const analysisCount  = Number(profile?.analysis_count ?? 0);
    // analysis_limit from DB: null means unlimited (agency), number means capped
    const analysisLimit: number | null =
      profile?.analysis_limit == null ? null : Number(profile.analysis_limit);

    const period = periodForPlan(plan);

    console.log(`[analyze] ── plan check ──`);
    console.log(`[analyze]   user_id        = ${userId}`);
    console.log(`[analyze]   profile found  = ${profile !== null}`);
    console.log(`[analyze]   plan           = "${plan}"`);
    console.log(`[analyze]   analysis_count = ${analysisCount}`);
    console.log(`[analyze]   analysis_limit = ${analysisLimit ?? "unlimited"}`);
    console.log(`[analyze]   period         = ${period}`);

    // Unlimited plan — allow immediately without counting
    if (period === "unlimited" || analysisLimit === null) {
      console.log(`[analyze]   → unlimited plan — allowing`);
      return noop;
    }

    // ── 2. Count analyses for the relevant period ───────────────────────────
    let usedCount: number;

    if (period === "total") {
      // For free plan use analysis_count from profiles (fastest — no extra query)
      usedCount = analysisCount;
    } else {
      // For paid daily plans count rows in analyses table created today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count, error: countErr } = await client
        .from("analyses")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", todayStart.toISOString());

      if (countErr) {
        console.error("[analyze] count error — failing open:", countErr.message);
        return noop;
      }
      usedCount = count ?? 0;
    }

    console.log(`[analyze]   used=${usedCount}/${analysisLimit} (${period})`);

    // ── 3. Block if at or over limit ────────────────────────────────────────
    if (usedCount >= analysisLimit) {
      const suggested = nextPlanUp(plan);
      const label = quotaLabel(analysisLimit, period);
      return {
        blockResponse: NextResponse.json(
          {
            error: "LIMIT_REACHED",
            message:
              plan === "free"
                ? `You've used your 1 free analysis. Upgrade to continue.`
                : `You've reached your ${label}. Upgrade to ${suggested ?? "a higher plan"} for more.`,
            plan,
            analyses_used: usedCount,
            limit: analysisLimit,
            next_plan: suggested,
          },
          { status: 402 },
        ),
        shouldRecord: false,
        isLastAllowed: false,
        recordUsage: async () => {},
      };
    }

    // ── 4. Within limit — record after success ─────────────────────────────
    // Always increment analysis_count in profiles (used for free-plan total tracking
    // and as a running lifetime counter for paid users).
    const recordUsage = async () => {
      try {
        const { error } = await client.rpc("increment_analysis_count", { uid: userId });
        if (error) console.error("[analyze] increment_analysis_count error:", error.message);
        else console.log(`[analyze] analysis_count incremented for user=${userId}`);
      } catch (err) {
        console.error("[analyze] increment_analysis_count exception:", err);
      }
    };

    // isLastAllowed: true when this is the final analysis slot being consumed
    // (usedCount + 1 will equal analysisLimit after recording).
    const isLastAllowed = usedCount + 1 >= analysisLimit;

    return { blockResponse: null, shouldRecord: true, isLastAllowed, recordUsage };
  } catch (err) {
    console.error("[analyze] usage check exception — failing open:", err);
    return noop;
  }
}

export const maxDuration = 120;

const ANALYZE_MODEL = process.env.ANTHROPIC_ANALYZE_MODEL ?? "claude-opus-4-5-20251101";

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function serpApi(params: Record<string, string>): Promise<Record<string, unknown>> {
  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) return {};
  try {
    const q = new URLSearchParams({ ...params, api_key: apiKey }).toString();
    const res = await fetch(`https://serpapi.com/search.json?${q}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function rainforest(params: Record<string, string>): Promise<Record<string, unknown>> {
  const apiKey = process.env.RAINFOREST_API_KEY?.trim();
  if (!apiKey) return {};
  try {
    const q = new URLSearchParams({ ...params, api_key: apiKey }).toString();
    const res = await fetch(`https://api.rainforestapi.com/request?${q}`, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function serper(q: string, type = "search", num = 8): Promise<Record<string, unknown>> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return {};
  try {
    const res = await fetch(`https://google.serper.dev/${type}`, {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q, num }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function extractTrendValues(googleTrends: Record<string, unknown>): number[] {
  const timeline = (googleTrends.interest_over_time as { timeline_data?: { values?: { extracted_value?: number }[] }[] })
    ?.timeline_data;
  if (!Array.isArray(timeline)) return [];
  return timeline
    .map((t) => {
      const v = t.values?.[0]?.extracted_value;
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    })
    .filter((n) => n >= 0);
}

function trendDirectionFromValues(trendValues: number[]): "Growing" | "Stable" | "Declining" {
  if (trendValues.length < 4) return "Stable";
  const first = trendValues[0] ?? 0;
  const last = trendValues[trendValues.length - 1] ?? 0;
  if (last > first + 5) return "Growing";
  if (last < first - 20) return "Declining";
  return "Stable";
}

type CompRow = Record<string, unknown> & { domain?: string };

function domainFromRow(link: string, source: string): string {
  const m = link.match(/(?:https?:\/\/)?(?:www\.)?([^/]+)/i);
  return String(m?.[1] || source || "")
    .toLowerCase()
    .trim();
}

async function runDashboardAnalysis(
  product_name: string,
  search_query: string,
  asin: string | undefined,
): Promise<Record<string, unknown>> {
  const asinClean = asin?.trim() || "";

  const [
    rfProduct,
    rfReviews,
    rfSearch,
    googleTrends,
    googleShopping1,
    googleShopping2,
    serpCompetitors,
    serpShopify,
    serpInstagram,
    serpFacebook,
    redditPain,
    tiktokTrends,
    googleImages,
  ] = await Promise.all([
    asinClean
      ? rainforest({ type: "product", asin: asinClean, amazon_domain: "amazon.com" })
      : Promise.resolve({}),
    asinClean
      ? rainforest({
          type: "product_reviews",
          asin: asinClean,
          amazon_domain: "amazon.com",
          sort_by: "most_helpful",
        })
      : Promise.resolve({}),
    rainforest({
      type: "search",
      search_term: search_query,
      amazon_domain: "amazon.com",
      sort_by: "featured",
    }),
    serpApi({ engine: "google_trends", q: search_query, data_type: "TIMESERIES", date: "today 12-m" }),
    serpApi({ engine: "google_shopping", q: search_query, num: "15" }),
    serpApi({ engine: "google_shopping", q: `best ${search_query} buy online`, num: "10" }),
    serpApi({ engine: "google", q: `${search_query} brand store buy shopify`, num: "10" }),
    serpApi({
      engine: "google",
      q: `${search_query} shopify store site:myshopify.com OR site:shop.app`,
      num: "10",
    }),
    serpApi({ engine: "google", q: `${search_query} instagram shop buy`, num: "8" }),
    serpApi({ engine: "google", q: `${search_query} sponsored ad facebook buy`, num: "8" }),
    serper(`${search_query} reddit reviews honest complaints love hate`, "search", 10),
    serper(`${search_query} tiktok viral trending`, "search", 8),
    serpApi({ engine: "google_images", q: `${search_query} product brand`, num: "10" }),
  ]);

  const rfP = rfProduct as Record<string, unknown>;
  const rfR = rfReviews as Record<string, unknown>;
  const amazonProduct = (rfP.product as Record<string, unknown>) || {};
  const amazonReviews = (rfR.reviews as Record<string, unknown>[]) || [];
  const amazonSearchResults = (rfSearch.search_results as Record<string, unknown>[]) || [];

  const reviewTexts = amazonReviews.slice(0, 10).map((r) => ({
    rating: r.rating,
    title: r.title,
    body: typeof r.body === "string" ? r.body.substring(0, 200) : "",
    verified: r.verified_purchase,
  }));

  const trendValues = extractTrendValues(googleTrends);
  const trendDirection = trendDirectionFromValues(trendValues);

  const competitorSources: CompRow[] = [
    ...((googleShopping1.shopping_results as CompRow[]) || []),
    ...((googleShopping2.shopping_results as CompRow[]) || []),
    ...((serpCompetitors.organic_results as CompRow[]) || []),
    ...((serpShopify.organic_results as CompRow[]) || []),
    ...((serpInstagram.organic_results as CompRow[]) || []),
    ...((serpFacebook.organic_results as CompRow[]) || []),
  ];

  const uniqueCompetitors = competitorSources
    .filter((r) => r.source || r.link || r.title)
    .reduce<CompRow[]>((acc, curr) => {
      const link = String(curr.link ?? "");
      const domain = domainFromRow(link, String(curr.source ?? ""));
      if (!domain || domain.includes("amazon.com")) return acc;
      if (acc.some((a) => a.domain === domain)) return acc;
      acc.push({ ...curr, domain });
      return acc;
    }, [])
    .slice(0, 15);

  const shoppingNonAmazon1 = ((googleShopping1.shopping_results as CompRow[]) || []).filter(
    (r) => !String(r.link ?? "").includes("amazon"),
  );

  const researchContext = `
PRODUCT: ${product_name}
SEARCH QUERY: ${search_query}
ASIN: ${asinClean || "N/A"}

=== AMAZON PRODUCT DATA (Rainforest API) ===
Title: ${amazonProduct.title ?? "N/A"}
Brand: ${amazonProduct.brand ?? "N/A"}
Price: ${(amazonProduct.buybox_winner as { price?: { raw?: string } } | undefined)?.price?.raw ?? (amazonProduct.price as { raw?: string } | undefined)?.raw ?? "N/A"}
Rating: ${amazonProduct.rating ?? "N/A"} (${amazonProduct.ratings_total ?? 0} reviews)
BSR: ${JSON.stringify((amazonProduct.bestsellers_rank as unknown[])?.slice(0, 2) ?? [])}
Description: ${typeof amazonProduct.description === "string" ? amazonProduct.description.substring(0, 300) : "N/A"}
Features: ${JSON.stringify((amazonProduct.feature_bullets as string[])?.slice(0, 5) ?? [])}

=== REAL CUSTOMER REVIEWS (Rainforest API) ===
${reviewTexts.map((r) => `[${r.rating}★] ${r.title}: ${r.body}`).join("\n")}

=== GOOGLE TRENDS (SerpApi) ===
Direction (computed): ${trendDirection}
Peak value: ${trendValues.length ? Math.max(...trendValues) : 0}
Current value: ${trendValues.length ? trendValues[trendValues.length - 1] : 0}
Recent values: ${trendValues.slice(-6).join(", ")}

=== GOOGLE SHOPPING COMPETITORS (non-Amazon) ===
${shoppingNonAmazon1
  .slice(0, 8)
  .map((r) => `${r.title} | ${String(r.price ?? "")} | ${String(r.source ?? "")} | ${String(r.link ?? "")}`)
  .join("\n")}

=== SHOPIFY & ECOM STORES ===
${((serpShopify.organic_results as { title?: string; link?: string; snippet?: string }[]) || [])
  .slice(0, 5)
  .map((r) => `${r.title} | ${r.link} | ${r.snippet?.substring(0, 100)}`)
  .join("\n")}

=== INSTAGRAM / SHOP DISCOVERY ===
${((serpInstagram.organic_results as { title?: string; link?: string; snippet?: string }[]) || [])
  .slice(0, 4)
  .map((r) => `${r.title} | ${r.link} | ${r.snippet?.substring(0, 100)}`)
  .join("\n")}

=== FACEBOOK / SPONSORED SIGNALS ===
${((serpFacebook.organic_results as { title?: string; link?: string; snippet?: string }[]) || [])
  .slice(0, 4)
  .map((r) => `${r.title} | ${r.link} | ${r.snippet?.substring(0, 100)}`)
  .join("\n")}

=== ALL UNIQUE COMPETITORS FOUND (deduped domains) ===
${uniqueCompetitors
  .slice(0, 12)
  .map((r) => `${String(r.title ?? r.name ?? "")} | ${r.domain} | ${String(r.price ?? "")}`)
  .join("\n")}

=== AMAZON SEARCH RESULTS (Rainforest — for saturated angle cues from titles, not as competitor URLs) ===
${amazonSearchResults
  .slice(0, 8)
  .map((r) => {
    const price = r.price as { value?: string | number } | undefined;
    return `${r.title} | $${price?.value ?? "N/A"} | ${r.ratings_total ?? 0} reviews | ASIN: ${r.asin ?? ""}`;
  })
  .join("\n")}

=== REDDIT / SOCIAL (Serper) ===
${((redditPain.organic as { title?: string; snippet?: string }[]) || [])
  .slice(0, 6)
  .map((r) => `${r.title}: ${r.snippet?.substring(0, 150)}`)
  .join("\n")}

=== TIKTOK / VIRAL (Serper) ===
${((tiktokTrends.organic as { title?: string; snippet?: string }[]) || [])
  .slice(0, 5)
  .map((r) => `${r.title}: ${r.snippet?.substring(0, 100)}`)
  .join("\n")}

=== GOOGLE IMAGES (brand / pack shots) ===
${((googleImages.images_results as { title?: string; original?: string }[]) || [])
  .slice(0, 6)
  .map((r) => `${r.title} | ${r.original ?? ""}`)
  .join("\n")}
`;

  const anthropic = getAnthropic();
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const systemPrompt = `You are ProdIQ — advanced ecommerce product intelligence AI.

You receive REAL data from Rainforest (Amazon), SerpApi (Google Trends, Shopping, web, images), and Serper (Reddit/social).

CRITICAL:
1. ONLY use the research text provided — never invent facts.
2. Be brutally honest where data is weak.

SCORING RULES — CRITICAL:
Each metric is scored out of 100. MINIMUM score for any metric is 50 unless the product genuinely fails that dimension (e.g. zero demand or zero emotional hook).

Score each out of 100:
- demand: 50-100 based on search volume and Amazon reviews count
- pain_point: 50-100 — how badly does this hurt the customer? Physical pain = 85+, daily frustration = 70+
- wow_factor: 50-100 — would someone stop scrolling? Unique gadget = 85+
- emotion: 50-100 — MOST IMPORTANT. Does it connect to fear, love, confidence, transformation? Emotional product = 85+
- competition: 50-100 — this is OPPORTUNITY score. High competition BUT good angles = 70+. Low competition = 90+
- profit: 50-100 — margin potential. 60%+ margin = 85+

WEIGHTING for final score (use these EXACT weights on the 0-100 subscores):
emotion × 0.25
pain_point × 0.20
demand × 0.20
wow_factor × 0.15
competition × 0.12
profit × 0.08

Final score = sum of weighted scores, rounded to integer (0-100).

NEVER give any metric below 50 unless the product has zero demand or zero emotion per the research.

COMPETITORS RULES — CRITICAL:
You MUST only include competitors selling the EXACT SAME product type as the product being analyzed.
Example: if the product is a "dog GPS tracker", ONLY include brands selling dog GPS trackers.
NEVER include brands selling related but different products (e.g. dog collars, dog food, dog toys, generic pet accessories).
The product category and primary use case must match EXACTLY.

For each competitor you must verify:
1. Their product title or listing contains the same core product-type keywords as this product.
2. Their listing is for the same primary use case (same job-to-be-done).
3. If you are unsure — EXCLUDE them.

Output between 6 and 10 competitors (minimum 6, maximum 10). Only include a row if you are confident it is 100% the same product category; otherwise omit and explain fewer competitors in the summary if the research truly lacks enough exact matches.
Include competitors from the research data (Shopify, Google Shopping, Amazon brand listings, social signals) when they pass the exact-match test.
NEVER list Amazon.com as the competitor website — use real brand/store domains from the data.
main_angle MUST come from their actual product title or description in the search data.
For each competitor estimate monthly_revenue using evidence from the data when possible.

ANGLES RULES — CRITICAL:
You MUST generate minimum 6 angles: at least 2 SATURATED, 2 EMERGING, 2 UNTAPPED.
NEVER return 0 saturated angles — there are ALWAYS saturated angles.

SATURATED angles come from:
- What the biggest brands in this space are saying (titles/descriptions in search data)
- Generic claims everyone makes: "best [product]", "professional grade", "top rated"
- Price-focused angles: "affordable", "cheap", "budget"
- Feature-focused: listing specs instead of benefits
- Top Amazon listing titles in the data ARE saturated angle fodder

EMERGING angles come from:
- Reddit discussions showing new pain points
- Recent trends in the data
- Angles that 1-2 competitors use but not everyone yet

UNTAPPED angles come from:
- Deep emotional pain in reviews that nobody addresses in marketing
- Specific life situations in Reddit ("as a nurse who stands 12 hours")
- Transformation stories in reviews
- Fear-based angles nobody is running
- The angle that makes someone say "this was made for ME"

success_rate:
- SATURATED: 8-35
- EMERGING: 52-74
- UNTAPPED: 72-94

EMOTION is the most important factor for untapped winners.

potential_success: integer 52-94, NOT the same as score — 60-day profitability if the best untapped angle is executed.

Return ONLY valid compact JSON. No markdown.`;

  const response = await anthropic.messages.create({
    model: ANALYZE_MODEL,
    max_tokens: 6000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze this product using ALL real data below.

${researchContext}

Return ONLY this JSON (no markdown):
{
  "product_name": string,
  "score": number,
  "verdict": "GO" | "NO-GO" | "TEST CAREFULLY",
  "verdict_reason": string,
  "confidence": "High" | "Medium" | "Low",
  "summary": string,
  "potential_success": number,
  "market": {
    "size": string,
    "trend": "Growing" | "Stable" | "Declining",
    "trend_reason": string,
    "best_platforms": string[],
    "price_range": string,
    "seasonal": string,
    "monthly_revenue_estimate": string,
    "top_countries": [{"country": string, "flag": string, "demand": string, "width": string}]
  },
  "competitors": [
    {
      "name": string,
      "website": string,
      "price": string,
      "monthly_revenue": string,
      "avg_order_value": string,
      "main_angle": string,
      "weakness": string,
      "opportunity": string
    }
  ],
  "angles": [
    {
      "name": string,
      "hook": string,
      "type": "UNTAPPED" | "EMERGING" | "SATURATED",
      "saturation": number,
      "success_rate": number,
      "emotion": string,
      "script": string,
      "platform": string,
      "estimated_revenue": string
    }
  ],
  "psychology": {
    "real_reason": string,
    "pain_points": string[],
    "emotional_triggers": string[],
    "customer_language": string[]
  },
  "score_breakdown": {
    "demand": number,
    "pain_point": number,
    "wow_factor": number,
    "emotion": number,
    "competition": number,
    "profit": number
  },
  "profit_estimate": {
    "buy_price": string,
    "sell_price": string,
    "margin": string,
    "break_even_roas": string,
    "monthly_profit_potential": string
  },
  "amazon_data": {
    "rating": string,
    "reviews_count": number,
    "bsr_rank": string,
    "price": string
  }
}`,
      },
    ],
  });

  const responseText = response.content[0]?.type === "text" ? response.content[0].text : "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");

  const report = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  if (amazonProduct.rating != null || amazonProduct.ratings_total != null) {
    const bsr = amazonProduct.bestsellers_rank as { rank?: number; category?: string }[] | undefined;
    report.amazon_data = {
      rating: String(amazonProduct.rating ?? ""),
      reviews_count: Number(amazonProduct.ratings_total) || 0,
      bsr_rank: bsr?.[0]?.rank ? `#${bsr[0].rank} in ${bsr[0].category ?? ""}` : "N/A",
      price: String(
        (amazonProduct.buybox_winner as { price?: { raw?: string } } | undefined)?.price?.raw ??
          (amazonProduct.price as { raw?: string } | undefined)?.raw ??
          "N/A",
      ),
    };
  }

  const market = (report.market as Record<string, unknown>) || {};
  market.trend = trendDirection;
  const last12 = trendValues.slice(-12);
  const maxV = last12.length ? Math.max(...last12, 1) : 100;
  market.trend_data = last12.map((v) => Math.round((v / maxV) * 100));
  report.market = market;

  return report;
}

export async function POST(req: NextRequest) {
  console.log("Analyze API:", new Date().toISOString());

  // ── Server-side usage limit enforcement ──────────────────────────────────
  const usage = await resolveUsage(req);
  if (usage.blockResponse) return usage.blockResponse;
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const body = (await req.json()) as Record<string, unknown>;

    const product_name = typeof body.product_name === "string" ? body.product_name.trim() : "";
    const search_query = typeof body.search_query === "string" ? body.search_query.trim() : "";
    const asin = typeof body.asin === "string" ? body.asin.trim() : "";

    if (product_name && search_query) {
      const report = await runDashboardAnalysis(product_name, search_query, asin || undefined);
      if (usage.shouldRecord) await usage.recordUsage();
      // free_limit_reached: true only when the user has NOW exhausted their quota after
      // this analysis. Used by the frontend as a hint — NOT to show the wall immediately,
      // but so the next "New Product" click can skip a redundant server round-trip.
      const nowAtLimit = Boolean(usage.shouldRecord && usage.isLastAllowed);
      return NextResponse.json({ success: true, report, free_limit_reached: nowAtLimit });
    }

    if (!body.inputType || !["image", "url", "text"].includes(String(body.inputType))) {
      return NextResponse.json(
        { error: "Provide product_name+search_query (optional asin) or legacy inputType payload" },
        { status: 400 },
      );
    }

    if (!body.targetMarket || typeof body.targetMarket !== "string") {
      return NextResponse.json({ error: "targetMarket is required" }, { status: 400 });
    }

    const inputType = body.inputType as AnalyzeInput["inputType"];
    if (inputType === "image" && !body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required for image input" }, { status: 400 });
    }
    if (inputType === "url" && !String(body.url ?? "").trim()) {
      return NextResponse.json({ error: "url is required for url input" }, { status: 400 });
    }
    if (inputType === "text" && !String(body.description ?? "").trim()) {
      return NextResponse.json({ error: "description is required for text input" }, { status: 400 });
    }

    const input: AnalyzeInput = {
      inputType,
      imageBase64: typeof body.imageBase64 === "string" ? body.imageBase64 : undefined,
      imageMediaType: typeof body.imageMediaType === "string" ? body.imageMediaType : undefined,
      url: typeof body.url === "string" ? body.url : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      targetMarket: String(body.targetMarket),
      pricePoint:
        body.pricePoint == null || body.pricePoint === ""
          ? null
          : Number(body.pricePoint),
    };

    const report = await runFullAnalysis(input);
    if (usage.shouldRecord) await usage.recordUsage();
    const nowAtLimit = Boolean(usage.shouldRecord && usage.isLastAllowed);
    return NextResponse.json({ ...report, free_limit_reached: nowAtLimit });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    console.error("Analysis error:", error);
    const status =
      message.includes("ANTHROPIC_API_KEY") ||
      message.includes("SERPER_API_KEY") ||
      message.includes("SCRAPER_API_KEY")
        ? 503
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
