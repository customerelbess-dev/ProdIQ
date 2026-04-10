import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const ADS_MODEL = "claude-haiku-4-5-20251001";
// Use a smarter model for the visual gatekeeper pass
const VISION_MODEL = process.env.ANTHROPIC_IDENTIFY_MODEL ?? "claude-opus-4-5-20251101";

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function serpApi(params: Record<string, string>): Promise<Record<string, unknown>> {
  const apiKey = process.env.SERPAPI_KEY?.trim();
  if (!apiKey) return {};
  try {
    const query = new URLSearchParams({ ...params, api_key: apiKey }).toString();
    const res = await fetch(`https://serpapi.com/search.json?${query}`, { signal: AbortSignal.timeout(10000) });
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

async function apifyRun(actorId: string, input: Record<string, unknown>): Promise<unknown[]> {
  const token = process.env.APIFY_API_KEY?.trim();
  if (!token) return [];
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=30`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(35000),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

type CompetitorIn = { name?: string; website?: string; main_angle?: string; weakness?: string };
type AdRow = Record<string, unknown>;

/**
 * PASS 1 — Fast text + category pre-filter (batched, cheap).
 * Removes ads that are clearly off-topic based on text and non-product images.
 */
async function textPreFilter(
  ads: AdRow[],
  productName: string,
  anthropic: Anthropic,
): Promise<AdRow[]> {
  if (ads.length === 0) return [];
  const verified: AdRow[] = [];
  const BATCH = 6;

  for (let i = 0; i < ads.length; i += BATCH) {
    const batch = ads.slice(i, i + BATCH);
    type CB = { type: "text"; text: string } | { type: "image"; source: { type: "url"; url: string } };
    const content: CB[] = [
      {
        type: "text",
        text: `You are a strict ad relevance filter. Product we are researching: "${productName}".

For each ad below, decide KEEP or REMOVE.
KEEP if: the ad promotes this exact product, a direct competitor selling the same type of product, or is clearly in the same product category.
REMOVE if: the ad is for a completely unrelated product/service, or the image shows something with no connection to "${productName}".

Reply ONLY a JSON array of exactly ${batch.length} strings: "KEEP" or "REMOVE".`,
      },
    ];

    batch.forEach((ad, idx) => {
      const imgUrl = String(ad.image ?? "").trim();
      content.push({
        type: "text",
        text: `\nAd ${idx + 1} — Brand: "${String(ad.brand ?? "")}", Headline: "${String(ad.headline ?? "").substring(0, 120)}", Body: "${String(ad.body ?? "").substring(0, 80)}"`,
      });
      if (imgUrl.startsWith("http")) {
        content.push({ type: "image", source: { type: "url", url: imgUrl } });
      }
    });

    try {
      const resp = await anthropic.messages.create({
        model: ADS_MODEL,
        max_tokens: 100,
        messages: [{ role: "user", content }],
      });
      const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
      const m = text.match(/\[[\s\S]*?\]/);
      if (m) {
        const results = JSON.parse(m[0]) as string[];
        batch.forEach((ad, idx) => {
          if ((results[idx] ?? "KEEP").toUpperCase().trim() !== "REMOVE") verified.push(ad);
        });
      } else {
        verified.push(...batch); // parse failed — keep (fail-open)
      }
    } catch {
      verified.push(...batch); // error — keep (fail-open)
    }
  }
  return verified;
}

/**
 * PASS 2 — Visual gatekeeper (one-by-one, uses product reference image).
 * Compares each ad image directly against the original product image.
 * Only passes ads where Claude confirms the same product/packaging is shown.
 * For ads without an image, they pass through unless text filter already removed them.
 */
async function visualGatekeeper(
  ads: AdRow[],
  productName: string,
  productImageUrl: string,
  anthropic: Anthropic,
): Promise<AdRow[]> {
  if (!productImageUrl.startsWith("http")) {
    // No reference image available — fall back to text-only pass
    return ads;
  }

  const verified: AdRow[] = [];

  await Promise.all(
    ads.map(async (ad) => {
      const adImageUrl = String(ad.image ?? "").trim();

      // Ads with no image pass through — can't visually reject what we can't see
      if (!adImageUrl.startsWith("http")) {
        verified.push(ad);
        return;
      }

      try {
        const resp = await anthropic.messages.create({
          model: VISION_MODEL,
          max_tokens: 80,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "url", url: productImageUrl } },
                { type: "image", source: { type: "url", url: adImageUrl } },
                {
                  type: "text",
                  text: `Image 1: the reference product ("${productName}").
Image 2: an ad image.

Does Image 2 show the SAME product or the same TYPE of product as Image 1?

PASS if:
- Image 2 shows the exact same product or packaging
- Image 2 shows a competing product of the same type (e.g. same product category)
- Image 2 is an ad creative for this product type

FAIL if:
- Image 2 shows a completely unrelated product or service
- Image 2 is clearly for a different product category

Reply ONLY JSON: {"verdict": "PASS"|"FAIL", "confidence": 0-100, "reason": "one sentence"}`,
                },
              ],
            },
          ],
        });

        const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
        const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
          verdict?: string;
          confidence?: number;
          reason?: string;
        };

        const passes = parsed.verdict !== "FAIL" || (parsed.confidence ?? 100) < 80;
        if (passes) {
          // Attach verification metadata to the ad
          verified.push({ ...ad, _visual_verified: true, _visual_confidence: parsed.confidence ?? 90 });
        } else {
          console.log(`[ads] Visual reject (${parsed.confidence}%): "${String(ad.headline ?? "").substring(0, 60)}" — ${parsed.reason ?? ""}`);
        }
      } catch {
        // On error, keep the ad (fail-open)
        verified.push(ad);
      }
    }),
  );

  return verified;
}

/**
 * Full verification pipeline: text pre-filter → visual gatekeeper.
 */
async function verifyAdsFull(
  ads: AdRow[],
  productName: string,
  productImageUrl: string,
  anthropic: Anthropic,
): Promise<AdRow[]> {
  if (ads.length === 0) return [];

  // Pass 1: cheap text + category filter
  const afterText = await textPreFilter(ads, productName, anthropic);
  if (afterText.length === 0) return ads.slice(0, 8); // fail-safe: if everything removed, keep first 8

  // Pass 2: visual comparison against reference product image
  const afterVisual = await visualGatekeeper(afterText, productName, productImageUrl, anthropic);

  // Safety: never return zero ads
  return afterVisual.length > 0 ? afterVisual : afterText.slice(0, 8);
}

/**
 * Resolve the calling user's plan from their Bearer token.
 * Returns "free" if the token is absent, invalid, or Supabase is not configured.
 * Fails open so a misconfigured env never blocks legitimate paid users.
 */
async function resolveCallerPlan(req: NextRequest): Promise<string> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return "free";

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder")) return "free";

  try {
    const client = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await client.auth.getUser();
    if (!user?.id) return "free";

    const { data: profile } = await client
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    return String(profile?.plan ?? "free");
  } catch {
    return "free"; // fail open — don't block paid users on infra errors
  }
}

export async function POST(req: NextRequest) {
  // ── Plan gate: Ads intelligence is Starter+ only ──────────────────────────
  const callerPlan = await resolveCallerPlan(req);
  const FREE_PLANS = ["free"];
  if (FREE_PLANS.includes(callerPlan)) {
    return NextResponse.json(
      {
        error: "PLAN_REQUIRED",
        message: "Competitor Ads Intelligence requires a Starter plan or above.",
        plan: callerPlan,
        required_plan: "starter",
      },
      { status: 403 },
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const body = (await req.json()) as {
      competitors?: CompetitorIn[];
      product_name?: string;
      product_image?: string; // URL of the confirmed product image — used as visual reference
    };
    const competitors = body.competitors ?? [];
    const product_name = String(body.product_name ?? "").trim();
    const product_image = String(body.product_image ?? "").trim();
    const allAds: AdRow[] = [];

    const competitorNames = competitors.slice(0, 5).map((c) => String(c.name ?? "").trim()).filter(Boolean);
    const searchTerms = [product_name, ...competitorNames.slice(0, 3)].filter((t) => t.length > 0);

    if (searchTerms.length === 0) {
      return NextResponse.json({
        ads: [],
        competitor_angles: [],
        untapped_angles: [],
        market_insight: "",
        total_found: 0,
      });
    }

    await Promise.all(
      searchTerms.map(async (term) => {
        const comp =
          competitors.find((c) => String(c.name ?? "").trim() === term) ??
          ({ name: term, website: "", main_angle: "", weakness: "" } as CompetitorIn);

        const [
          tiktokSearch,
          fbSearch,
          serpTiktok,
          serpFbAds,
          googleImages,
          youtubeSearch,
        ] = await Promise.all([
          apifyRun("clockworks~tiktok-ads-scraper", { searchQueries: [term], maxItems: 8, country: "US" }),
          apifyRun("apify~facebook-posts-scraper", { searchQueries: [term], maxItems: 5 }),
          serpApi({ engine: "google", q: `${term} site:tiktok.com`, num: "8" }),
          serpApi({
            engine: "google",
            q: `"${term}" site:facebook.com/ads/library OR site:fb.watch`,
            num: "6",
          }),
          serpApi({ engine: "google_images", q: `${term} advertisement ad`, num: "8" }),
          serpApi({ engine: "youtube", q: `${term} review ad sponsored`, num: "5" }),
        ]);

        if (Array.isArray(tiktokSearch) && tiktokSearch.length > 0) {
          tiktokSearch.slice(0, 8).forEach((raw) => {
            const ad = raw as Record<string, unknown>;
            const postId = String(ad.id ?? (ad as { videoId?: string }).videoId ?? "").trim();
            const authorMeta = ad.authorMeta as { name?: string; uniqueId?: string } | undefined;
            const authorObj = ad.author as { uniqueId?: string } | undefined;
            const authorName = String(
              authorMeta?.name ?? authorObj?.uniqueId ?? (ad as { uniqueId?: string }).uniqueId ?? "",
            )
              .replace(/^@/, "")
              .trim();
            const specificUrl =
              postId && authorName
                ? `https://www.tiktok.com/@${authorName}/video/${postId}`
                : postId
                  ? `https://www.tiktok.com/video/${postId}`
                  : String(ad.webVideoUrl ?? ad.url ?? "").trim() ||
                    `https://www.tiktok.com/search?q=${encodeURIComponent(`${comp.name} ${product_name}`.trim())}`;
            const covers = ad.covers as string[] | undefined;
            const thumbnail = String(
              ad.videoThumbnail ?? covers?.[0] ?? ad.cover ?? ad.thumbnail ?? "",
            ).trim();
            allAds.push({
              brand: comp.name,
              website: comp.website,
              platform: "TikTok",
              platformColor: "#010101",
              image: thumbnail,
              video: null,
              headline: String(ad.text ?? ad.desc ?? ad.title ?? ad.description ?? comp.main_angle ?? term),
              body: String(ad.description ?? ad.text ?? ""),
              views: Number(ad.playCount ?? (ad.stats as { playCount?: number })?.playCount ?? ad.viewCount ?? 0) || 0,
              likes: Number(ad.diggCount ?? (ad.stats as { diggCount?: number })?.diggCount ?? ad.likeCount ?? 0) || 0,
              ad_url: specificUrl,
              is_video: true,
              source: "apify_tiktok",
            });
          });
        }

        if (Array.isArray(fbSearch) && fbSearch.length > 0) {
          fbSearch.slice(0, 5).forEach((raw) => {
            const ad = raw as Record<string, unknown>;
            const media = ad.media as { photo_image?: { uri?: string } }[] | undefined;
            const attachments = ad.attachments as { media?: { image?: { src?: string } } }[] | undefined;
            const likes = ad.likes as { summary?: { total_count?: number } } | undefined;
            const msg = typeof ad.message === "string" ? ad.message : "";
            const fbVideo = ad.video as { hd_src?: string; sd_src?: string } | undefined;
            const videoSrc = String(fbVideo?.hd_src ?? fbVideo?.sd_src ?? "").trim();
            allAds.push({
              brand: comp.name,
              website: comp.website,
              platform: "Meta",
              platformColor: "#1877f2",
              image: String(
                media?.[0]?.photo_image?.uri ??
                  ad.full_picture ??
                  attachments?.[0]?.media?.image?.src ??
                  ad.picture ??
                  "",
              ),
              video: videoSrc,
              headline: (msg ? msg.substring(0, 100) : "") || String(ad.story ?? comp.main_angle ?? term),
              body: String(ad.description ?? "") || (msg ? msg.substring(0, 200) : ""),
              likes: likes?.summary?.total_count ?? 0,
              views: Number((ad.video_insights as { total_video_views?: number })?.total_video_views ?? 0) || 0,
              ad_url:
                String(ad.permalink_url ?? ad.url ?? "").trim() ||
                `https://www.facebook.com/ads/library/?q=${encodeURIComponent(term)}&search_type=keyword_unordered`,
              source: "apify_facebook",
            });
          });
        }

        const tiktokOrg = (serpTiktok.organic_results as Record<string, unknown>[]) || [];
        tiktokOrg.slice(0, 3).forEach((r) => {
          allAds.push({
            brand: comp.name || term,
            website: comp.website,
            platform: "TikTok",
            platformColor: "#010101",
            image: String(r.thumbnail ?? ""),
            video: null,
            is_video: true,
            headline: String(r.title ?? "").substring(0, 100) || term,
            body: String(r.snippet ?? "").substring(0, 150),
            views: 0,
            ad_url: String(r.link ?? `https://www.tiktok.com/search?q=${encodeURIComponent(term)}`),
            source: "serp_tiktok",
          });
        });

        const fbOrg = (serpFbAds.organic_results as Record<string, unknown>[]) || [];
        fbOrg.slice(0, 3).forEach((r) => {
          allAds.push({
            brand: comp.name || term,
            website: comp.website,
            platform: "Meta",
            platformColor: "#1877f2",
            image: String(r.thumbnail ?? ""),
            headline: String(r.title ?? "").substring(0, 100) || term,
            body: String(r.snippet ?? "").substring(0, 150),
            ad_url: String(
              r.link ??
                `https://www.facebook.com/ads/library/?q=${encodeURIComponent(term)}&search_type=keyword_unordered`,
            ),
            source: "serp_fb",
          });
        });

        const imgResults = (googleImages.images_results as Record<string, unknown>[]) || [];
        imgResults.slice(0, 3).forEach((r) => {
          const orig = String(r.original ?? "");
          if (orig.startsWith("http")) {
            allAds.push({
              brand: comp.name || term,
              website: comp.website,
              platform: "Meta",
              platformColor: "#1877f2",
              image: orig || String(r.thumbnail ?? ""),
              headline: String(r.title ?? "").substring(0, 100) || term,
              body: String(comp.main_angle ?? ""),
              ad_url: `https://www.facebook.com/ads/library/?q=${encodeURIComponent(term)}&search_type=keyword_unordered`,
              source: "google_images",
            });
          }
        });

        const ytResults = (youtubeSearch.video_results as Record<string, unknown>[]) || [];
        ytResults.slice(0, 2).forEach((r) => {
          const thumb = r.thumbnail as { static?: string } | string | undefined;
          const thumbStr = typeof thumb === "object" && thumb?.static ? thumb.static : String(thumb ?? "");
          allAds.push({
            brand: comp.name || term,
            website: comp.website,
            platform: "YouTube",
            platformColor: "#FF0000",
            image: thumbStr,
            video: null,
            is_video: true,
            headline: String(r.title ?? "").substring(0, 100) || term,
            body: String(r.description ?? "").substring(0, 150),
            views: Number(r.views ?? 0) || 0,
            ad_url: String(r.link ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`),
            source: "youtube",
          });
        });
      }),
    );

    const meaningfulAds = allAds.filter((ad) => ad.headline || ad.image);

    const productWords = product_name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    let relevantAds = meaningfulAds.filter((ad: AdRow) => {
      const adText = [String(ad.headline ?? ""), String(ad.body ?? ""), String(ad.brand ?? "")]
        .join(" ")
        .toLowerCase();
      const isFromKnownCompetitor = competitors.some((c) => {
        const n = String(c.name ?? "").toLowerCase();
        const first = n.split(/\s+/)[0];
        return Boolean(first && first.length > 1 && adText.includes(first));
      });
      const hasProductKeyword = productWords.some((word) => adText.includes(word));
      return isFromKnownCompetitor || hasProductKeyword;
    });

    const adKey = (a: AdRow) => `${String(a.ad_url ?? "")}-${String(a.headline ?? "")}`;
    const seenKeys = new Set(relevantAds.map(adKey));

    if (relevantAds.length < 20 && product_name) {
      const needed = 20 - relevantAds.length;
      const [moreImages, moreTikTok, moreYT] = await Promise.all([
        serpApi({ engine: "google_images", q: `${product_name} advertisement sponsored ad`, num: "10" }),
        serpApi({ engine: "google", q: `${product_name} tiktok review viral`, num: "8" }),
        serpApi({ engine: "youtube", q: `${product_name} review sponsored`, num: "6" }),
      ]);

      const brandFirst = product_name.split(/\s+/)[0] || "Product";

      const imgSlice = Math.min(Math.ceil(needed / 2), 8);
      ((moreImages.images_results as Record<string, unknown>[]) || []).slice(0, imgSlice).forEach((r) => {
        const orig = String(r.original ?? "");
        if (!orig.startsWith("http") || orig.startsWith("data:")) return;
        const row: AdRow = {
          brand: brandFirst,
          website: "",
          platform: "Meta",
          platformColor: "#1877f2",
          image: orig || String(r.thumbnail ?? ""),
          video: null,
          is_video: false,
          headline: String(r.title ?? "").substring(0, 100) || product_name,
          body: "",
          ad_url: `https://www.facebook.com/ads/library/?q=${encodeURIComponent(product_name)}&search_type=keyword_unordered`,
          source: "serp_image_fill",
        };
        const k = adKey(row);
        if (!seenKeys.has(k)) {
          seenKeys.add(k);
          relevantAds.push(row);
        }
      });

      const ttSlice = Math.min(Math.floor(needed / 2), 8);
      ((moreTikTok.organic_results as Record<string, unknown>[]) || []).slice(0, ttSlice).forEach((r) => {
        const row: AdRow = {
          brand: brandFirst,
          website: "",
          platform: "TikTok",
          platformColor: "#010101",
          image: String(r.thumbnail ?? ""),
          video: null,
          is_video: true,
          headline: String(r.title ?? "").substring(0, 100) || product_name,
          body: String(r.snippet ?? "").substring(0, 150) || "",
          views: 0,
          ad_url: String(r.link ?? `https://www.tiktok.com/search?q=${encodeURIComponent(product_name)}`),
          source: "serp_tiktok_fill",
        };
        const k = adKey(row);
        if (!seenKeys.has(k)) {
          seenKeys.add(k);
          relevantAds.push(row);
        }
      });

      if (relevantAds.length < 20) {
        const still = 20 - relevantAds.length;
        ((moreYT.video_results as Record<string, unknown>[]) || []).slice(0, still).forEach((r) => {
          const thumb = r.thumbnail as { static?: string } | string | undefined;
          const thumbStr = typeof thumb === "object" && thumb?.static ? thumb.static : String(thumb ?? "");
          const row: AdRow = {
            brand: brandFirst,
            website: "",
            platform: "YouTube",
            platformColor: "#FF0000",
            image: thumbStr,
            video: null,
            is_video: true,
            headline: String(r.title ?? "").substring(0, 100) || product_name,
            body: String(r.description ?? "").substring(0, 150),
            views: Number(r.views ?? 0) || 0,
            ad_url: String(r.link ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(product_name)}`),
            source: "serp_youtube_fill",
          };
          const k = adKey(row);
          if (!seenKeys.has(k)) {
            seenKeys.add(k);
            relevantAds.push(row);
          }
        });
      }
    }

    const candidateAds = relevantAds.slice(0, 40);

    // Two-pass verification: text pre-filter → visual gatekeeper
    const anthropic = getAnthropic();
    let workingAds: AdRow[];
    if (anthropic && candidateAds.length > 0) {
      console.log(`[ads] Running two-pass verification on ${candidateAds.length} candidates (product_image: ${product_image ? "yes" : "no"})`);
      workingAds = await verifyAdsFull(candidateAds, product_name, product_image, anthropic);
    } else {
      workingAds = candidateAds;
    }
    workingAds = workingAds.slice(0, 20);

    let competitor_angles: unknown[] = [];
    let untapped_angles: unknown[] = [];
    let market_insight = "";

    const adsWithContent = workingAds.filter((ad) => String(ad.headline ?? "").length > 5).slice(0, 12);

    if (adsWithContent.length > 0 && anthropic) {
      const adSummary = adsWithContent
        .map(
          (ad, i) =>
            `[${ad.platform}] ${ad.brand}: "${ad.headline}" — ${String(ad.body ?? "").substring(0, 100)}`,
        )
        .join("\n");

      const claudeRes = await anthropic.messages.create({
        model: ADS_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Analyze competitor ads for "${product_name || "this product"}":

${adSummary}

Return ONLY JSON:
{
  "competitor_angles": [
    {"brand": string, "angle_name": string, "angle_type": string, "saturation_level": "HIGH"|"MEDIUM"|"LOW", "hook_used": string, "why_it_works": string}
  ],
  "untapped_angles": [
    {"name": string, "hook": string, "why_untapped": string, "emotional_trigger": string, "success_potential": number, "platform": string, "script_opening": string}
  ],
  "market_insight": string
}`,
          },
        ],
      });

      const ct = claudeRes.content[0]?.type === "text" ? claudeRes.content[0].text : "";
      const cm = ct.match(/\{[\s\S]*\}/);
      if (cm) {
        try {
          const analysis = JSON.parse(cm[0]) as {
            competitor_angles?: unknown[];
            untapped_angles?: unknown[];
            market_insight?: string;
          };
          competitor_angles = analysis.competitor_angles ?? [];
          untapped_angles = analysis.untapped_angles ?? [];
          market_insight = analysis.market_insight ?? "";
        } catch {
          /* ignore */
        }
      }
    }

    return NextResponse.json({
      ads: workingAds.slice(0, 20),
      competitor_angles,
      untapped_angles,
      market_insight,
      total_found: workingAds.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ads error";
    console.error("Ads error:", error);
    return NextResponse.json(
      { error: message, ads: [], competitor_angles: [], untapped_angles: [], market_insight: "" },
      { status: 500 },
    );
  }
}
