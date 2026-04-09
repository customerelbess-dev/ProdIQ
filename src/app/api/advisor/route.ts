import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function serpApiCall(q: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) return {};
  try {
    const params = new URLSearchParams({
      engine: "google",
      q,
      api_key: apiKey,
      num: "5",
    });
    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

type MessageItem = { role: "user" | "assistant"; content: string };
type AnalysisItem = {
  product_name?: string;
  score?: number;
  verdict?: string;
  angles?: unknown[];
  competitors?: unknown[];
};
type AngleItem = { type?: string; hook?: string };
type CompetitorItem = { name?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      history?: MessageItem[];
      analyses?: AnalysisItem[];
      currentReport?: Record<string, unknown> | null;
      selectedProduct?: string;
    };
    const { message = "", history = [], analyses = [], currentReport } = body;

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json({
        response: "AI Advisor is not configured. Please add your ANTHROPIC_API_KEY.",
      });
    }

    const analysesContext =
      analyses
        .slice(0, 5)
        .map(
          (a) =>
            `- ${a.product_name}: Score ${a.score}/100, ${a.verdict}, ${a.angles?.length ?? 0} angles, ${a.competitors?.length ?? 0} competitors`,
        )
        .join("\n") || "No products analyzed yet";

    const currentContext = currentReport
      ? `Currently viewing: ${String(currentReport.product_name ?? "")}
Score: ${String(currentReport.score ?? "N/A")}/100
Verdict: ${String(currentReport.verdict ?? "")}
Best untapped angle: ${String((currentReport.angles as AngleItem[] | undefined)?.find((a) => a.type === "UNTAPPED")?.hook ?? "None found")}
Competitors: ${(currentReport.competitors as CompetitorItem[] | undefined)?.map((c) => c.name).join(", ") ?? "None"}`
      : "No product currently selected";

    const needsSearch =
      /search|find|latest|trend|new product/i.test(message);

    let searchData = "";
    if (needsSearch) {
      const searchResult = await serpApiCall(message);
      const organic = searchResult.organic_results as Record<string, unknown>[] | undefined;
      searchData = `\nReal-time search results: ${JSON.stringify(organic?.slice(0, 3) ?? [])}`;
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 1000,
      system: `You are Alex — ProdIQ's expert ecommerce advisor. You've helped hundreds of sellers go from zero to profitable.

Your personality:
- Warm, direct, and encouraging — like a smart friend who knows ecom inside out
- You celebrate small wins and give honest reality checks
- You never overwhelm with information — you give ONE clear next step
- You ask follow-up questions to understand the user's situation better
- You reference their actual products when relevant

When someone asks what to do next, always end with ONE clear action they should take right now.
Keep responses under 150 words unless they ask for detail.
Never use bullet point lists for conversational responses — talk naturally.
Never say "I'm an AI" or refer to yourself as an AI.

User's products:
${analysesContext}

${currentContext}
${searchData}`,
      messages: [
        ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: message },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Advisor error";
    return NextResponse.json(
      { error: message, response: "Sorry, I ran into an issue. Please try again." },
      { status: 500 },
    );
  }
}
