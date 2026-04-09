import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlockParam,
  MessageParam,
  TextBlock,
  ToolUnion,
} from "@anthropic-ai/sdk/resources/messages/messages";
import type { ProdIQReport } from "./types";

const SYSTEM_PROMPT = `You are ProdIQ — the world's most advanced product validation AI. You analyze products for ecommerce sellers and tell them exactly whether a product is worth selling and how to sell it.

You think like a combination of:
- A top Amazon FBA expert who has launched 500+ products
- A performance marketer who has spent $50M+ on Meta and TikTok ads
- A consumer psychologist who understands why people really buy things

YOUR JOB:
Analyze the product provided and return a complete validation report.

Use web search when needed to ground competitor names, price bands, and market signals in real, current information.

ANALYSIS FRAMEWORK:
1. PRODUCT SCORE (1-100):
   - Demand strength (is people actively searching for this?) — 25 points
   - Competition level (can a new seller compete?) — 20 points  
   - Profit potential (margins, pricing power) — 20 points
   - Trend direction (growing, stable, or dying market?) — 15 points
   - Unique angle potential (can this be marketed differently?) — 20 points

2. VERDICT: GO or NO-GO or TEST CAREFULLY
   - GO: score above 65, strong demand, good margins, clear angle
   - NO-GO: score below 40, saturated market, dying trend, no angle
   - TEST CAREFULLY: score 40-65, mixed signals, needs validation

3. MARKET INSIGHTS:
   - Market size estimate
   - Trend direction (growing/stable/declining)
   - Best selling platforms
   - Seasonal patterns if any

4. TOP COMPETITORS (3-5):
   - Name and brief description
   - Their weakness (what they do badly that you can do better)
   - Price range

5. CUSTOMER PSYCHOLOGY:
   - The REAL reason people buy this (not the obvious reason)
   - Top 3 pain points from real customer reviews
   - Emotional triggers that drive purchase
   - Exact language customers use (for ad copy)

6. WINNING AD ANGLES (3-5 angles):
   - Angle name
   - Core message
   - Example hook for Meta/TikTok ad
   - Why this angle works psychologically

7. CREATIVE IDEAS:
   - Best ad format (video/static/ugc/carousel)
   - 3 specific video concepts
   - Best performing visual style for this product

RESPONSE FORMAT:
Return ONLY valid JSON with this exact structure (no markdown, no commentary):
{
  "product_name": string,
  "score": number,
  "verdict": "GO" | "NO-GO" | "TEST CAREFULLY",
  "verdict_reason": string,
  "score_breakdown": {
    "demand": number,
    "competition": number,
    "profit": number,
    "trend": number,
    "angle": number
  },
  "market": {
    "size": string,
    "trend": "Growing" | "Stable" | "Declining",
    "best_platforms": string[],
    "seasonal": string
  },
  "competitors": [
    {
      "name": string,
      "weakness": string,
      "price_range": string
    }
  ],
  "psychology": {
    "real_reason": string,
    "pain_points": string[],
    "emotional_triggers": string[],
    "customer_language": string[]
  },
  "angles": [
    {
      "name": string,
      "message": string,
      "hook": string,
      "why_it_works": string
    }
  ],
  "creative": {
    "best_format": string,
    "video_concepts": string[],
    "visual_style": string
  },
  "summary": string
}

score_breakdown sub-scores MUST be integers out of their category maximums: demand≤25, competition≤20, profit≤20, trend≤15, angle≤20, and should sum approximately to the overall score logic.`;

export type AnalyzeInput = {
  inputType: "image" | "url" | "text";
  imageBase64?: string;
  imageMediaType?: string;
  url?: string;
  description?: string;
  targetMarket: string;
  pricePoint?: number | null;
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

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function normalizeReport(raw: unknown): ProdIQReport {
  const o = raw as Record<string, unknown>;
  const market = (o.market || {}) as Record<string, unknown>;
  const psychology = (o.psychology || {}) as Record<string, unknown>;
  const creative = (o.creative || {}) as Record<string, unknown>;
  const breakdown = (o.score_breakdown || {}) as Record<string, unknown>;

  return {
    product_name: String(o.product_name ?? "Unknown product"),
    score: Math.min(100, Math.max(0, Number(o.score) || 0)),
    verdict: (["GO", "NO-GO", "TEST CAREFULLY"].includes(String(o.verdict))
      ? o.verdict
      : "TEST CAREFULLY") as ProdIQReport["verdict"],
    verdict_reason: String(o.verdict_reason ?? ""),
    score_breakdown: {
      demand: Math.min(25, Math.max(0, Number(breakdown.demand) || 0)),
      competition: Math.min(20, Math.max(0, Number(breakdown.competition) || 0)),
      profit: Math.min(20, Math.max(0, Number(breakdown.profit) || 0)),
      trend: Math.min(15, Math.max(0, Number(breakdown.trend) || 0)),
      angle: Math.min(20, Math.max(0, Number(breakdown.angle) || 0)),
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
    },
    competitors: Array.isArray(o.competitors)
      ? (o.competitors as Record<string, unknown>[]).map((c) => ({
          name: String(c.name ?? ""),
          weakness: String(c.weakness ?? ""),
          price_range: String(c.price_range ?? ""),
        }))
      : [],
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
    },
    angles: Array.isArray(o.angles)
      ? (o.angles as Record<string, unknown>[]).map((a) => ({
          name: String(a.name ?? ""),
          message: String(a.message ?? ""),
          hook: String(a.hook ?? ""),
          why_it_works: String(a.why_it_works ?? ""),
        }))
      : [],
    creative: {
      best_format: String(creative.best_format ?? ""),
      video_concepts: Array.isArray(creative.video_concepts)
        ? (creative.video_concepts as unknown[]).map(String)
        : [],
      visual_style: String(creative.visual_style ?? ""),
    },
    summary: String(o.summary ?? ""),
  };
}

export async function analyzeProductWithClaude(input: AnalyzeInput): Promise<ProdIQReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";

  const priceLine =
    input.pricePoint != null && !Number.isNaN(Number(input.pricePoint))
      ? `$${input.pricePoint}`
      : "not specified";

  const userBlocks: ContentBlockParam[] = [];

  if (input.inputType === "image" && input.imageBase64) {
    const { raw, media } = stripDataUrl(input.imageBase64);
    userBlocks.push({
      type: "image",
      source: { type: "base64", media_type: media, data: raw },
    });
    userBlocks.push({
      type: "text",
      text: `Target market: ${input.targetMarket}. Intended sell price: ${priceLine}. Analyze this product image and produce the JSON report.`,
    });
  } else if (input.inputType === "url" && input.url) {
    userBlocks.push({
      type: "text",
      text: `Product URL: ${input.url}\nTarget market: ${input.targetMarket}\nIntended sell price: ${priceLine}\nUse web search to inspect the listing/market context if the URL is public. Return the JSON report.`,
    });
  } else {
    userBlocks.push({
      type: "text",
      text: `Product description:\n${input.description ?? ""}\n\nTarget market: ${input.targetMarket}\nIntended sell price: ${priceLine}\nReturn the JSON report.`,
    });
  }

  const tools: ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 15 },
  ];

  const messages: MessageParam[] = [{ role: "user", content: userBlocks }];

  let lastText = "";
  const maxIter = 24;

  for (let i = 0; i < maxIter; i++) {
    const response = await client.messages.create({
      model,
      max_tokens: 16384,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
    const chunk = textBlocks.map((b) => b.text).join("\n");
    if (chunk) lastText = chunk;

    if (response.stop_reason === "end_turn") break;
    if (response.stop_reason === "pause_turn") continue;
    break;
  }

  const jsonStr = extractJson(lastText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Claude did not return valid JSON");
  }

  return normalizeReport(parsed);
}
