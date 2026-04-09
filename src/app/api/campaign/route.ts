import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      product?: Record<string, unknown>;
      angle?: Record<string, unknown>;
      answers?: Record<string, string>;
      report?: Record<string, unknown>;
    };
    const { product, angle, answers = {}, report } = body;

    const budget = parseFloat((String(answers.budget ?? "50")).replace(/[^0-9.]/g, "")) || 50;

    const creativeCount =
      budget < 50 ? "2-3" : budget < 100 ? "3-4" : budget < 200 ? "4-5" : "5-6";
    const creativeReason =
      budget < 50
        ? "Your budget is limited. With fewer creatives each one gets more budget and better data."
        : budget < 100
          ? `With $${budget}/day, 3-4 creatives is optimal. More would spread your budget too thin to get statistical significance.`
          : "Your budget allows testing multiple angles while maintaining enough spend per creative to exit the learning phase.";

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2000,
      system: `You are a Meta ads expert who has spent $50M+ on Facebook ads for ecommerce brands.

CRITICAL RULES FOR CAMPAIGN STRUCTURE:
1. ALWAYS use CBO (Campaign Budget Optimization) — NEVER ABO
2. ALWAYS start with 1 ad set only — never multiple ad sets for testing
3. ALWAYS broad targeting — no interests, no custom audiences for cold traffic testing
4. Number of creatives depends on budget
5. Be specific with numbers and times
6. Always explain WHY each decision is made`,
      messages: [
        {
          role: "user",
          content: `Create a complete Meta ads campaign structure for:
Product: ${String(product?.product_name ?? "Unknown")}
Angle: ${String(angle?.name ?? "")} — "${String(angle?.hook ?? "")}"
Daily Budget: $${budget}
Experience Level: ${String(answers.experience ?? "None")}
Goal: ${String(answers.goal ?? "")}
Launch Timeline: ${String(answers.timeline ?? "")}
Market Data: Score ${String(report?.score ?? "N/A")}/100, ${String(report?.verdict ?? "")}
Best Platform: ${String(angle?.platform ?? "Meta")}

Generate a complete campaign plan. Return ONLY this JSON:
{
  "sections": [
    {
      "icon": "⚙️",
      "title": "Campaign Setup",
      "items": [
        "Campaign type: CONVERSIONS (Purchase)",
        "Budget optimization: CBO — Campaign Budget Optimization ONLY. Never ABO.",
        "Daily budget: $${budget}",
        "Campaign name: [Product] - [Angle] - CBO - [Date]"
      ]
    },
    {
      "icon": "🎯",
      "title": "Ad Set Structure",
      "items": [
        "Number of ad sets: 1 ONLY",
        "Targeting: BROAD — no interests, no age restrictions, no gender restrictions",
        "Why broad: Facebook algorithm is smarter than manual targeting in 2025. Let it find buyers.",
        "Placement: Advantage+ placements (automatic)",
        "Optimization: Purchase",
        "Attribution: 7-day click, 1-day view"
      ]
    },
    {
      "icon": "🎥",
      "title": "Creative Strategy",
      "items": [
        "Number of creatives: ${creativeCount}",
        "Why ${creativeCount}: ${creativeReason}",
        "Hook (first 3 seconds): ${String(angle?.hook ?? "")}",
        "Creative format: UGC-style video preferred, image ads as backup",
        "Creative naming: [Product]-[Angle#]-[Format]-[Date]"
      ]
    },
  ]
}`,
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    const plan = match ? (JSON.parse(match[0]) as Record<string, unknown>) : {};

    return NextResponse.json({ plan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Campaign error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
