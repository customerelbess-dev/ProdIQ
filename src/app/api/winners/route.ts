import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function serpApiCall(params: Record<string, string>): Promise<Record<string, unknown>> {
  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) return {};
  try {
    const query = new URLSearchParams({ ...params, api_key: apiKey }).toString();
    const res = await fetch(`https://serpapi.com/search.json?${query}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function rainforestCall(params: Record<string, string>): Promise<Record<string, unknown>> {
  const apiKey = process.env.RAINFOREST_API_KEY?.trim();
  if (!apiKey) return {};
  try {
    const query = new URLSearchParams({ ...params, api_key: apiKey }).toString();
    const res = await fetch(`https://api.rainforestapi.com/request?${query}`, {
      signal: AbortSignal.timeout(14000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// In-memory cache until next Monday
let cachedWinners: unknown[] | null = null;
let cacheTimestamp = 0;

function getNextMonday(): number {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime();
}

function getCacheDuration(): number {
  return getNextMonday() - Date.now();
}

type RainforestProduct = {
  title?: string;
  asin?: string;
  ratings_total?: number;
  rating?: number;
  price?: { raw?: string };
  buybox_winner?: { price?: { raw?: string } };
  bestsellers_rank?: unknown[];
  main_image?: { link?: string };
  images?: { link?: string }[];
};

export async function GET(_req: NextRequest) {
  try {
    // Return in-memory cache if still valid
    if (cachedWinners && Date.now() - cacheTimestamp < getCacheDuration()) {
      return NextResponse.json({ winners: cachedWinners, cached: true });
    }

    // Try Supabase cache
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: cachedRow } = await sb
          .from("winners_cache")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (cachedRow) {
          const createdAt = new Date((cachedRow as { created_at: string }).created_at).getTime();
          const lastMonday = getNextMonday() - 7 * 24 * 60 * 60 * 1000;
          if (createdAt > lastMonday) {
            const winners = (cachedRow as { winners: unknown[] }).winners ?? [];
            cachedWinners = winners;
            cacheTimestamp = createdAt;
            return NextResponse.json({ winners, cached: true });
          }
        }
      }
    } catch {
      // Supabase unavailable — continue to fetch fresh
    }

    const anthropic = getAnthropic();

    const categories = [
      "back pain relief device",
      "posture corrector adults",
      "sleep improvement device",
      "anxiety stress relief gadget",
      "weight loss body sculpting",
    ];

    const searchResults = await Promise.all(
      categories.map((cat) =>
        rainforestCall({
          type: "search",
          search_term: cat,
          amazon_domain: "amazon.com",
          sort_by: "featured",
        }),
      ),
    );

    type SearchResult = { title?: string; asin?: string; ratings_total?: number; rating?: number };
    const allProducts: SearchResult[] = [];
    searchResults.forEach((result) => {
      const products = ((result.search_results as SearchResult[]) || []).slice(0, 3);
      products.forEach((p) => {
        if (p.title && p.asin && (p.ratings_total ?? 0) > 100) {
          allProducts.push(p);
        }
      });
    });

    const topProducts = allProducts
      .filter((p) => (p.ratings_total ?? 0) > 200 && (p.rating ?? 0) >= 4.0)
      .slice(0, 8);

    const productDetails = await Promise.all(
      topProducts.slice(0, 6).map((p) =>
        rainforestCall({ type: "product", asin: p.asin!, amazon_domain: "amazon.com" }),
      ),
    );

    const productSummaries = productDetails
      .map((pd, i) => {
        const p = (pd.product as RainforestProduct) ?? topProducts[i];
        return `Product ${i + 1}: ${p.title}
Price: ${p.price?.raw ?? p.buybox_winner?.price?.raw ?? "N/A"}
Reviews: ${p.ratings_total ?? topProducts[i]?.ratings_total}
Rating: ${p.rating ?? topProducts[i]?.rating}
BSR: ${JSON.stringify((p.bestsellers_rank ?? []).slice(0, 2))}
ASIN: ${topProducts[i]?.asin}`;
      })
      .join("\n\n");

    if (!anthropic) {
      return NextResponse.json({ winners: [], error: "ANTHROPIC_API_KEY not configured" });
    }

    const claudeRes = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `You are a dropshipping product expert. From these Amazon products pick the 5 BEST potential winners.

Pick 5 products that:
1. Solve a DEEP emotional pain — embarrassment, chronic pain, insecurity, fear, loneliness
2. Have a WOW factor — something surprising or impressive
3. Have 200-2000 reviews on Amazon (not ultra saturated, not unproven)
4. Price point $20-$80 (good dropshipping margin)
5. NOT already sold by every dropshipper (no phone cases, no LED strips)

The best winning products make someone say 'I NEED this' not 'that looks nice'.
Think: chronic back pain, poor sleep, body insecurity, social anxiety, productivity struggles.

For each product success_rate should be 78-96% — these are winners, not maybes.

${productSummaries}

Return ONLY this JSON array:
[
  {
    "name": "string (short product name)",
    "category": "string",
    "asin": "string",
    "monthly_revenue": "string (estimate like '$47K')",
    "demand_score": 75,
    "competition_level": "Low",
    "untapped_angles": 4,
    "avg_price": "$49",
    "success_rate": 82,
    "why_it_wins": "string (2-3 sentences)",
    "best_angle": "string (most powerful emotional hook)",
    "wow_factor": "string",
    "competitors": [
      {"name": "string", "website": "string", "angle": "string", "revenue": "string"}
    ],
    "pain_points": ["string"]
  }
]`,
        },
      ],
    });

    const text = claudeRes.content[0]?.type === "text" ? claudeRes.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    type WinnerItem = Record<string, unknown>;
    const winners: WinnerItem[] = match ? (JSON.parse(match[0]) as WinnerItem[]) : [];

    const winnersWithImages = await Promise.all(
      winners.map(async (winner) => {
        try {
          const asin = String(winner.asin ?? "");
          if (asin) {
            const pd = productDetails.find(
              (p) => (p.product as RainforestProduct)?.asin === asin,
            );
            const rp = pd?.product as RainforestProduct | undefined;
            const img = rp?.main_image?.link ?? rp?.images?.[0]?.link ?? "";
            if (img) return { ...winner, image: img };
          }
          const imgRes = await serpApiCall({
            engine: "google_images",
            q: String(winner.name ?? "") + " product",
            num: "3",
          });
          const imgs = imgRes.images_results as { original?: string; thumbnail?: string }[] | undefined;
          const imgUrl = imgs?.[0]?.original ?? imgs?.[0]?.thumbnail ?? "";
          return { ...winner, image: imgUrl };
        } catch {
          return winner;
        }
      }),
    );

    cachedWinners = winnersWithImages;
    cacheTimestamp = Date.now();

    // Persist to Supabase
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb.from("winners_cache").insert({ winners: winnersWithImages });
      }
    } catch {
      // Non-fatal — winners were generated, just not cached to Supabase
    }

    return NextResponse.json({ winners: winnersWithImages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Winners error";
    console.error("Winners error:", error);
    return NextResponse.json({ error: message, winners: [] }, { status: 500 });
  }
}
