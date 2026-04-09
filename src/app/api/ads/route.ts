import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const ADS_MODEL = "claude-haiku-4-5-20251001";

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

async function verifyAdsBatch(
  ads: AdRow[],
  productName: string,
  anthropic: Anthropic,
): Promise<AdRow[]> {
  if (ads.length === 0) return [];

  const verified: AdRow[] = [];
  const BATCH = 5;

  for (let i = 0; i < ads.length; i += BATCH) {
    const batch = ads.slice(i, i + BATCH);

    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "url"; url: string } };

    const content: ContentBlock[] = [
      {
        type: "text",
        text: `You are a strict ad verification assistant. Your job is to decide if each ad is RELATED or UNRELATED to this product: "${productName}".

An ad is RELATED if:
- It promotes the same product type, a near-identical product, or a direct competitor
- The image shows the product category or a similar product being advertised

An ad is UNRELATED if:
- It is clearly about a completely different product or service
- The image has nothing to do with the product category

For each ad below, respond ONLY with a JSON array of exactly ${batch.length} strings, each "RELATED" or "UNRELATED" in the same order.
Example: ["RELATED","UNRELATED","RELATED"]`,
      },
    ];

    batch.forEach((ad, idx) => {
      const imgUrl = String(ad.image ?? "").trim();
      const headline = String(ad.headline ?? "").substring(0, 120);
      const body = String(ad.body ?? "").substring(0, 80);
      content.push({
        type: "text",
        text: `\nAd ${idx + 1} — Platform: ${String(ad.platform ?? "")}, Brand: "${String(ad.brand ?? "")}", Headline: "${headline}", Body: "${body}"`,
      });
      if (imgUrl.startsWith("http")) {
        content.push({ type: "image", source: { type: "url", url: imgUrl } });
      }
    });

    try {
      const resp = await anthropic.messages.create({
        model: ADS_MODEL,
        max_tokens: 120,
        messages: [{ role: "user", content }],
      });
      const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
      const m = text.match(/\[[\s\S]*?\]/);
      if (m) {
        const results = JSON.parse(m[0]) as string[];
        batch.forEach((ad, idx) => {
          if ((results[idx] ?? "UNRELATED").toUpperCase().trim() === "RELATED") {
            verified.push(ad);
          }
        });
      } else {
        // Claude couldn't parse — keep the batch to avoid empty results
        verified.push(...batch);
      }
    } catch {
      // On error, keep the batch (fail-open)
      verified.push(...batch);
    }
  }

  return verified;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      competitors?: CompetitorIn[];
      product_name?: string;
    };
    const competitors = body.competitors ?? [];
    const product_name = String(body.product_name ?? "").trim();
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

    const candidateAds = relevantAds.slice(0, 30);

    // Triple-verify every ad with Claude vision before showing it
    const anthropic = getAnthropic();
    let workingAds: AdRow[];
    if (anthropic && candidateAds.length > 0) {
      workingAds = await verifyAdsBatch(candidateAds, product_name, anthropic);
      // If verification removes everything, fall back gracefully
      if (workingAds.length === 0) workingAds = candidateAds.slice(0, 10);
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
