import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam, MessageParam, TextBlock } from "@anthropic-ai/sdk/resources/messages/messages";
import type { ProdIQReport } from "./types";

const RESEARCH_JSON_MAX = 28000;

export type AnalyzeInput = {
  inputType: "image" | "url" | "text";
  imageBase64?: string;
  imageMediaType?: string;
  url?: string;
  description?: string;
  targetMarket: string;
  pricePoint?: number | null;
};

export type IdentifyInput = {
  inputType: "image" | "url" | "text";
  imageBase64?: string;
  url?: string;
  description?: string;
};

export type IdentifyResult = {
  product_name: string;
  category: string;
  search_query: string;
  confidence_score: number;
};

export type ProductIdentification = IdentifyResult & {
  description: string;
};

function stripDataUrl(base64: string): { raw: string; media: "image/jpeg" | "image/png" | "image/gif" | "image/webp" } {
  const m = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (m) {
    const mt = m[1];
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
    const media = (allowed.includes(mt as (typeof allowed)[number]) ? mt : "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    return { raw: m[2], media };
  }
  return { raw: base64, media: "image/jpeg" };
}

function safeJsonSnippet(data: unknown, max = RESEARCH_JSON_MAX): string {
  try {
    const s = JSON.stringify(data);
    if (s.length <= max) return s;
    return `${s.slice(0, max)}\n...[truncated]`;
  } catch {
    return '"[unserializable]"';
  }
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

async function searchProduct(query: string): Promise<unknown> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY is not configured");
  const response = await fetch("https://google.serper.dev/shopping", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });
  if (!response.ok) {
    throw new Error(`Serper shopping failed: ${response.status}`);
  }
  return response.json();
}

async function scrapeAmazonReviews(query: string): Promise<unknown> {
  const key = process.env.SCRAPER_API_KEY;
  if (!key) throw new Error("SCRAPER_API_KEY is not configured");
  const encodedUrl = encodeURIComponent(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`);
  const response = await fetch(
    `http://api.scraperapi.com?api_key=${encodeURIComponent(key)}&url=${encodedUrl}&autoparse=true`,
  );
  if (!response.ok) {
    throw new Error(`ScraperAPI failed: ${response.status}`);
  }
  return response.json();
}

async function searchReddit(query: string): Promise<unknown> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY is not configured");
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `${query} site:reddit.com reviews complaints pain points`,
      num: 10,
    }),
  });
  if (!response.ok) {
    throw new Error(`Serper Reddit search failed: ${response.status}`);
  }
  return response.json();
}

async function searchCompetitors(query: string): Promise<unknown> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY is not configured");
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: `best ${query} buy online competitors`,
      num: 10,
    }),
  });
  if (!response.ok) {
    throw new Error(`Serper competitor search failed: ${response.status}`);
  }
  return response.json();
}

async function withResearchFallback(label: string, fn: () => Promise<unknown>): Promise<unknown> {
  try {
    return await fn();
  } catch (e) {
    return {
      error: true,
      source: label,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

const IDENTIFY_SYSTEM = `You are a product identification expert for ecommerce. Given an image, URL, or text description, identify the specific product type for market research.

Return ONLY valid JSON (no markdown):
{
  "product_name": string,
  "category": string,
  "description": string,
  "search_query": string,
  "confidence_score": number
}

search_query must be a short, high-signal phrase for Google Shopping / Amazon search (e.g. "portable blender bottle 20oz").
confidence_score is 0-100 for how sure you are.`;

function identificationUserContent(input: IdentifyInput): ContentBlockParam[] {
  if (input.inputType === "image" && input.imageBase64) {
    const { raw, media } = stripDataUrl(input.imageBase64);
    return [
      { type: "image", source: { type: "base64", media_type: media, data: raw } },
      {
        type: "text",
        text: "Identify this product. Return the JSON object only.",
      },
    ];
  }
  if (input.inputType === "url" && input.url?.trim()) {
    return [
      {
        type: "text",
        text: `Product URL (seller or product page):\n${input.url.trim()}\n\nIdentify what product this refers to. Return the JSON object only.`,
      },
    ];
  }
  return [
    {
      type: "text",
      text: `Product name / description:\n${input.description?.trim() ?? ""}\n\nIdentify the product for market research. Return the JSON object only.`,
    },
  ];
}

export async function identifyProduct(input: IdentifyInput): Promise<IdentifyResult> {
  const full = await identifyProductFull(input);
  return {
    product_name: full.product_name,
    category: full.category,
    search_query: full.search_query,
    confidence_score: full.confidence_score,
  };
}

export async function identifyProductFull(input: IdentifyInput): Promise<ProductIdentification> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || apiKey === "your_anthropic_key_here") {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  const messages: MessageParam[] = [
    { role: "user", content: identificationUserContent(input) },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: IDENTIFY_SYSTEM,
    messages,
  });

  const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
  const text = textBlocks.map((b) => b.text).join("\n");
  const jsonStr = extractJson(text);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    throw new Error("Identification did not return valid JSON");
  }

  return {
    product_name: String(parsed.product_name ?? "Unknown product"),
    category: String(parsed.category ?? ""),
    description: String(parsed.description ?? ""),
    search_query:
      String(parsed.search_query ?? parsed.product_name ?? "").trim() || String(parsed.product_name ?? ""),
    confidence_score: Math.min(100, Math.max(0, Number(parsed.confidence_score) || 0)),
  };
}

function buildAnalysisSystemPrompt(
  shoppingData: unknown,
  amazonData: unknown,
  redditData: unknown,
  competitorData: unknown,
  productName: string,
): string {
  return `You are ProdIQ — the world's most advanced product validation AI. You have just been given real market research data about a product. Analyze everything and generate a complete validation report.

You think like:
- A top Amazon FBA expert who has launched 500+ products
- A performance marketer who spent $50M+ on Meta and TikTok ads  
- A consumer psychologist who understands why people REALLY buy things

REAL RESEARCH DATA PROVIDED:
Google Shopping Results: ${safeJsonSnippet(shoppingData)}
Amazon Data: ${safeJsonSnippet(amazonData)}
Reddit Discussions: ${safeJsonSnippet(redditData)}
Competitor Data: ${safeJsonSnippet(competitorData)}

PRODUCT: ${productName}

YOUR ANALYSIS FRAMEWORK:

SCORING (1-100):
- Demand strength: are people actively searching and buying this? (25 points)
- Competition level: can a new seller realistically compete? (20 points)
- Profit potential: are margins viable? (20 points)
- Trend direction: growing, stable, or dying market? (15 points)
- Unique angle potential: can this be marketed differently than competitors? (20 points)

VERDICT:
- GO: score above 65
- TEST CAREFULLY: score 40-65
- NO-GO: below 40

CUSTOMER PSYCHOLOGY (most important section):
Read the real reviews and Reddit discussions provided. Extract:
- The REAL reason people buy this (not the obvious surface reason — the emotional truth)
- Exact phrases and words real customers use
- The pain they felt BEFORE buying
- What they say AFTER buying that made them happy
- Frustrations with existing products (these become your winning angles)

WINNING AD ANGLES — CRITICAL:
You MUST generate EXACTLY 5 SATURATED angles, EXACTLY 5 EMERGING angles, and EXACTLY 5 UNTAPPED angles — 15 angles total minimum.
NEVER return fewer than 5 per category.

SATURATED angles: generic/mainstream claims the top brands all use ("best quality", "professional grade", price-focused, feature-focused).
EMERGING angles: growing pain points from Reddit/reviews used by 1-2 competitors but not mainstream yet.
UNTAPPED angles: deep emotional pain nobody is addressing in ads — hyper-specific life situations, transformation stories, fear-based hooks that make someone say "this was made for ME".

success_rate ranges:
- SATURATED: 8-35
- EMERGING: 52-74
- UNTAPPED: 72-94

Return ONLY valid JSON with this structure:
{
  "product_name": string,
  "score": number,
  "verdict": "GO" | "NO-GO" | "TEST CAREFULLY",
  "verdict_reason": string,
  "confidence": "High" | "Medium" | "Low",
  "market": {
    "size": string,
    "trend": "Growing" | "Stable" | "Declining",
    "trend_reason": string,
    "best_platforms": string[],
    "price_range": string,
    "seasonal": string
  },
  "competitors": [
    {
      "name": string,
      "url": string,
      "price": string,
      "weakness": string,
      "opportunity": string
    }
  ],
  "psychology": {
    "real_reason": string,
    "before_pain": string,
    "after_feeling": string,
    "pain_points": string[],
    "emotional_triggers": string[],
    "customer_language": string[]
  },
  "angles": [
    // 5 SATURATED + 5 EMERGING + 5 UNTAPPED = 15 minimum
    {
      "name": string,
      "type": "UNTAPPED" | "EMERGING" | "SATURATED",
      "target_emotion": string,
      "hook": string,
      "body": string,
      "why_it_works": string,
      "platform": string,
      "success_rate": number,
      "saturation": number
    }
  ],
  "creative": {
    "best_format": string,
    "video_concepts": string[],
    "visual_style": string,
    "do_not_do": string[]
  },
  "score_breakdown": {
    "demand": number,
    "competition": number,
    "profit": number,
    "trend": number,
    "angle_potential": number
  },
  "summary": string,
  "action_items": string[]
}

Use "body" for each angle's main copy (primary ad / script body). We map "body" to the app's message field.
Ensure score_breakdown integers respect maxima: demand≤25, competition≤20, profit≤20, trend≤15, angle_potential≤20.`;
}

function normalizePipelineReport(raw: unknown): ProdIQReport {
  const o = raw as Record<string, unknown>;
  const market = (o.market || {}) as Record<string, unknown>;
  const psychology = (o.psychology || {}) as Record<string, unknown>;
  const creative = (o.creative || {}) as Record<string, unknown>;
  const breakdown = (o.score_breakdown || {}) as Record<string, unknown>;
  const angleScore = Number(breakdown.angle_potential ?? breakdown.angle) || 0;

  const competitors = Array.isArray(o.competitors)
    ? (o.competitors as Record<string, unknown>[]).map((c) => {
        const price = c.price != null ? String(c.price) : "";
        const pr = c.price_range != null ? String(c.price_range) : "";
        const price_range = pr || price || "—";
        return {
          name: String(c.name ?? ""),
          weakness: String(c.weakness ?? ""),
          price_range,
          url: c.url != null ? String(c.url) : undefined,
          opportunity: c.opportunity != null ? String(c.opportunity) : undefined,
        };
      })
    : [];

  const angles = Array.isArray(o.angles)
    ? (o.angles as Record<string, unknown>[]).map((a) => {
        const rawType = String(a.type ?? "").toUpperCase();
        const validType = ["SATURATED", "EMERGING", "UNTAPPED"].includes(rawType) ? rawType : "UNTAPPED";
        return {
          name: String(a.name ?? ""),
          message: String(a.message ?? a.body ?? ""),
          hook: String(a.hook ?? ""),
          why_it_works: String(a.why_it_works ?? ""),
          target_emotion: a.target_emotion != null ? String(a.target_emotion) : undefined,
          platform: a.platform != null ? String(a.platform) : undefined,
          // Preserve categorisation fields so the dashboard mind-map works correctly
          type: validType as "SATURATED" | "EMERGING" | "UNTAPPED",
          success_rate: a.success_rate != null ? Math.max(50, Number(a.success_rate)) : undefined,
          saturation: a.saturation != null ? Number(a.saturation) : undefined,
          emotion: a.why_it_works != null ? String(a.why_it_works) : undefined,
          script: a.body != null ? String(a.body) : a.message != null ? String(a.message) : undefined,
        };
      })
    : [];

  return {
    product_name: String(o.product_name ?? "Unknown product"),
    score: Math.min(100, Math.max(0, Number(o.score) || 0)),
    verdict: (["GO", "NO-GO", "TEST CAREFULLY"].includes(String(o.verdict))
      ? o.verdict
      : "TEST CAREFULLY") as ProdIQReport["verdict"],
    verdict_reason: String(o.verdict_reason ?? ""),
    confidence: o.confidence != null ? String(o.confidence) : undefined,
    score_breakdown: {
      demand: Math.min(25, Math.max(0, Number(breakdown.demand) || 0)),
      competition: Math.min(20, Math.max(0, Number(breakdown.competition) || 0)),
      profit: Math.min(20, Math.max(0, Number(breakdown.profit) || 0)),
      trend: Math.min(15, Math.max(0, Number(breakdown.trend) || 0)),
      angle: Math.min(20, Math.max(0, angleScore)),
    },
    market: {
      size: String(market.size ?? ""),
      trend: (["Growing", "Stable", "Declining"].includes(String(market.trend))
        ? market.trend
        : "Stable") as ProdIQReport["market"]["trend"],
      best_platforms: Array.isArray(market.best_platforms)
        ? (market.best_platforms as unknown[]).map(String)
        : [],
      seasonal: String(market.seasonal ?? ""),
      trend_reason: market.trend_reason != null ? String(market.trend_reason) : undefined,
      price_range: market.price_range != null ? String(market.price_range) : undefined,
    },
    competitors,
    psychology: {
      real_reason: String(psychology.real_reason ?? ""),
      pain_points: Array.isArray(psychology.pain_points)
        ? (psychology.pain_points as unknown[]).map(String)
        : [],
      emotional_triggers: Array.isArray(psychology.emotional_triggers)
        ? (psychology.emotional_triggers as unknown[]).map(String)
        : [],
      customer_language: Array.isArray(psychology.customer_language)
        ? (psychology.customer_language as unknown[]).map(String)
        : [],
      before_pain: psychology.before_pain != null ? String(psychology.before_pain) : undefined,
      after_feeling: psychology.after_feeling != null ? String(psychology.after_feeling) : undefined,
    },
    angles,
    creative: {
      best_format: String(creative.best_format ?? ""),
      video_concepts: Array.isArray(creative.video_concepts)
        ? (creative.video_concepts as unknown[]).map(String)
        : [],
      visual_style: String(creative.visual_style ?? ""),
      do_not_do: Array.isArray(creative.do_not_do)
        ? (creative.do_not_do as unknown[]).map(String)
        : undefined,
    },
    summary: String(o.summary ?? ""),
    action_items: Array.isArray(o.action_items)
      ? (o.action_items as unknown[]).map(String)
      : undefined,
  };
}

export async function runFullAnalysis(input: AnalyzeInput): Promise<ProdIQReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || apiKey === "your_anthropic_key_here") {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const identifyInput: IdentifyInput = {
    inputType: input.inputType,
    imageBase64: input.imageBase64,
    url: input.url,
    description: input.description,
  };

  const identified = await identifyProductFull(identifyInput);
  const searchQuery = identified.search_query || identified.product_name;

  const [shoppingData, amazonData, redditData, competitorData] = await Promise.all([
    withResearchFallback("shopping", () => searchProduct(searchQuery)),
    withResearchFallback("amazon", () => scrapeAmazonReviews(searchQuery)),
    withResearchFallback("reddit", () => searchReddit(searchQuery)),
    withResearchFallback("competitors", () => searchCompetitors(searchQuery)),
  ]);

  const priceLine =
    input.pricePoint != null && !Number.isNaN(Number(input.pricePoint))
      ? `$${input.pricePoint}`
      : "not specified";

  const userContext = `Additional seller context (use in your analysis):
TARGET MARKET / AUDIENCE: ${input.targetMarket}
INTENDED SELL PRICE: ${priceLine}
PRODUCT CATEGORY (from identification): ${identified.category}
PRODUCT DESCRIPTION (from identification): ${identified.description}

Base your report on the research data and this context. Return ONLY the JSON object, no markdown.`;

  const system = buildAnalysisSystemPrompt(
    shoppingData,
    amazonData,
    redditData,
    competitorData,
    identified.product_name,
  );

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

  const messages: MessageParam[] = [{ role: "user", content: userContext }];

  const response = await client.messages.create({
    model,
    max_tokens: 16384,
    system,
    messages,
  });

  const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
  const lastText = textBlocks.map((b) => b.text).join("\n");
  const jsonStr = extractJson(lastText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Analysis did not return valid JSON");
  }

  const report = normalizePipelineReport(parsed);
  if (!report.product_name || report.product_name === "Unknown product") {
    report.product_name = identified.product_name;
  }
  return report;
}
