import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { identifyProduct, type IdentifyInput } from "@/lib/analyze-pipeline";

export const maxDuration = 120;

const OPUS_MODEL = process.env.ANTHROPIC_IDENTIFY_MODEL ?? "claude-opus-4-5-20251101";

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

function serpKey() {
  return process.env.SERPAPI_KEY?.trim() || "";
}

function rainforestKey() {
  return process.env.RAINFOREST_API_KEY?.trim() || "";
}

// SerpApi — Google reverse image (POST base64)
async function serpApiGoogleLensBase64(base64: string, mediaType: string): Promise<Record<string, unknown>> {
  const key = serpKey();
  if (!key) return {};
  try {
    const formData = new FormData();
    const blob = new Blob([Buffer.from(base64, "base64")], { type: mediaType });
    formData.append("image", blob, "product.jpg");
    const res = await fetch(`https://serpapi.com/search.json?engine=google_reverse_image&api_key=${key}`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function serpApiShopping(query: string): Promise<Record<string, unknown>> {
  const key = serpKey();
  if (!key) return {};
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${key}&num=10`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function serpApiAmazon(query: string): Promise<Record<string, unknown>> {
  const key = serpKey();
  if (!key) return {};
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=amazon&q=${encodeURIComponent(query)}&api_key=${key}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function serpApiImages(query: string): Promise<Record<string, unknown>> {
  const key = serpKey();
  if (!key) return {};
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(`${query} product`)}&api_key=${key}&num=5`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function rainforestProduct(asin: string): Promise<Record<string, unknown>> {
  const key = rainforestKey();
  if (!key) return {};
  try {
    const u = new URL("https://api.rainforestapi.com/request");
    u.searchParams.set("api_key", key);
    u.searchParams.set("type", "product");
    u.searchParams.set("asin", asin);
    u.searchParams.set("amazon_domain", "amazon.com");
    const res = await fetch(u.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function rainforestSearch(query: string): Promise<Record<string, unknown>> {
  const key = rainforestKey();
  if (!key) return {};
  try {
    const u = new URL("https://api.rainforestapi.com/request");
    u.searchParams.set("api_key", key);
    u.searchParams.set("type", "search");
    u.searchParams.set("search_term", query);
    u.searchParams.set("amazon_domain", "amazon.com");
    u.searchParams.set("sort_by", "featured");
    const res = await fetch(u.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function scrapeUrl(url: string): Promise<Record<string, unknown>> {
  const apiKey = process.env.SCRAPER_API_KEY?.trim();
  if (!apiKey) return {};
  try {
    const res = await fetch(
      `http://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}&autoparse=true&follow_redirect=true`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function serperImages(productName: string): Promise<string> {
  const k = process.env.SERPER_API_KEY?.trim();
  if (!k) return "";
  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": k, "Content-Type": "application/json" },
      body: JSON.stringify({ q: `${productName} product official`, num: 5 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { images?: { imageUrl?: string }[] };
    const imgs = data.images || [];
    const clean = imgs.find(
      (img) =>
        img.imageUrl?.startsWith("http") && !img.imageUrl.startsWith("data:") && !img.imageUrl.includes("base64"),
    );
    return clean?.imageUrl || "";
  } catch {
    return "";
  }
}

async function getCleanImage(productName: string, existingImg?: string): Promise<string> {
  if (existingImg && existingImg.startsWith("http") && !existingImg.startsWith("data:")) {
    return existingImg;
  }
  try {
    const res = await serpApiImages(productName);
    const imgs = (res.images_results as { original?: string; thumbnail?: string }[]) || [];
    const clean = imgs.find(
      (img) => img.original?.startsWith("http") && !img.original.startsWith("data:"),
    );
    if (clean?.original) return clean.original;
    if (clean?.thumbnail?.startsWith("http")) return clean.thumbnail;
  } catch {
    /* fall through */
  }
  return serperImages(productName);
}

function stripDataUrlBase64(raw: string): string {
  const idx = raw.indexOf(",");
  return idx >= 0 ? raw.slice(idx + 1).replace(/\s/g, "") : raw.replace(/\s/g, "");
}

function safeJsonParse<T>(raw: string): T | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Visually compare the uploaded product image against a found product image.
 * Returns true if they are the EXACT same product (same item, variant, size).
 * Falls back to true on any error so we never accidentally reject a good match.
 */
async function verifyProductImageMatch(
  anthropic: Anthropic,
  uploadedBase64: string,
  uploadedMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
  foundImageUrl: string,
  foundProductName: string,
): Promise<boolean> {
  if (!foundImageUrl.startsWith("http")) return true;
  try {
    const res = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: uploadedMediaType, data: uploadedBase64 } },
            { type: "image", source: { type: "url", url: foundImageUrl } },
            {
              type: "text",
              text: `Image 1: product uploaded by the user.
Image 2: "${foundProductName}" found online.

Are these EXACTLY the same product — same item, same variant, same size/flavor/strength?
If the brand matches but it is a different product, different size, or different variant, answer false.

Reply ONLY JSON: {"same": true} or {"same": false}`,
            },
          ],
        },
      ],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    const parsed = safeJsonParse<{ same?: boolean }>(text);
    // If we can't parse, default to true (don't reject valid matches)
    return parsed?.same !== false;
  } catch {
    return true;
  }
}

function guessMediaTypeFromBase64(base64: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  try {
    const buf = Buffer.from(base64.slice(0, 48), "base64");
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
    if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
    if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image/gif";
    if (buf.length >= 4 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return "image/webp";
  } catch {
    /* ignore */
  }
  return "image/jpeg";
}

type Candidate = {
  title?: string;
  price?: string;
  image?: string;
  source: string;
  link?: string;
  asin?: string;
  rating?: number;
  reviews?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (body.inputType && ["image", "url", "text"].includes(String(body.inputType))) {
      const inputType = body.inputType as IdentifyInput["inputType"];
      if (inputType === "image" && !body.imageBase64) {
        return NextResponse.json({ error: "imageBase64 is required for image input" }, { status: 400 });
      }
      if (inputType === "url" && !String(body.url ?? "").trim()) {
        return NextResponse.json({ error: "url is required for url input" }, { status: 400 });
      }
      if (inputType === "text" && !String(body.description ?? "").trim()) {
        return NextResponse.json({ error: "description is required for text input" }, { status: 400 });
      }
      const input: IdentifyInput = {
        inputType,
        imageBase64: typeof body.imageBase64 === "string" ? body.imageBase64 : undefined,
        url: typeof body.url === "string" ? body.url : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
      };
      const r = await identifyProduct(input);
      const product_image = await getCleanImage(r.product_name, undefined);
      return NextResponse.json({
        product_name: r.product_name,
        search_query: r.search_query,
        category: r.category,
        confidence: r.confidence_score,
        product_image,
      });
    }

    const { image: imageField, url, text, mediaType: mediaTypeBody } = body as {
      image?: string;
      url?: string;
      text?: string;
      mediaType?: string;
    };

    const imageRaw = typeof imageField === "string" ? imageField : undefined;
    const image = imageRaw ? stripDataUrlBase64(imageRaw) : undefined;
    const urlStr = typeof url === "string" ? url.trim() : "";
    const textStr = typeof text === "string" ? text.trim() : "";

    if (!image && !urlStr && !textStr) {
      return NextResponse.json({ error: "Please upload an image, paste a link, or describe your product." }, { status: 400 });
    }

    if (urlStr) {
      let realUrl = urlStr;
      try {
        const followed = await fetch(urlStr, {
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" },
        });
        realUrl = followed.url;
      } catch {
        /* keep original */
      }

      const asinMatch = realUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/i);
      const asin = asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;

      if (asin) {
        const rfData = await rainforestProduct(asin);
        const product = rfData.product as Record<string, unknown> | undefined;
        if (product?.title) {
          const title = String(product.title);
          const mainImg = product.main_image as { link?: string } | undefined;
          const images = product.images as { link?: string }[] | undefined;
          const buybox = product.buybox_winner as { price?: { value?: number; raw?: string } } | undefined;
          const priceObj = product.price as { value?: number; raw?: string } | undefined;
          const img = await getCleanImage(title, mainImg?.link || images?.[0]?.link);
          const priceVal = buybox?.price?.value ?? priceObj?.value;
          const priceRaw = buybox?.price?.raw ?? priceObj?.raw;
          return NextResponse.json({
            product_name: title,
            brand: String(product.brand ?? (product.a_plus_content as { company_description?: string })?.company_description ?? ""),
            search_query: title,
            confidence: 99,
            product_image: img,
            price: priceVal != null ? `$${priceVal}` : priceRaw ? String(priceRaw) : "",
            asin,
            rating: product.rating,
            reviews_count: product.ratings_total,
            source: "rainforest_api",
            description: product.description,
          });
        }
      }

      const scraped = await scrapeUrl(asin ? `https://www.amazon.com/dp/${asin}` : realUrl);
      const name = String(scraped.name ?? scraped.title ?? "").trim();
      if (name) {
        const img = await getCleanImage(name, String(scraped.main_image ?? ""));
        return NextResponse.json({
          product_name: name,
          brand: String(scraped.brand ?? ""),
          search_query: name,
          confidence: 95,
          product_image: img,
          price: String(scraped.price ?? ""),
          source: "scraper_fallback",
          asin: asin || String(scraped.asin ?? ""),
        });
      }
    }

    const anthropic = getAnthropic();
    if (!anthropic) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 503 });
    }

    if (image) {
      const mediaTypeRaw = typeof mediaTypeBody === "string" && mediaTypeBody.startsWith("image/") ? mediaTypeBody : "";
      const mediaType = (mediaTypeRaw || guessMediaTypeFromBase64(image)) as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp";

      void serpApiGoogleLensBase64(image, mediaType);

      const claudeRes = await anthropic.messages.create({
        model: OPUS_MODEL,
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image },
              },
              {
                type: "text",
                text: `You are the world's best product identification expert.

Read EVERY single piece of text visible on this product:
- Brand name (exact spelling)
- Product name (exact spelling)
- Variant/flavor/color/size/strength
- Weight or volume
- Any numbers, model codes
- Any certifications or badges

Create search queries from most to least specific.

Return ONLY JSON:
{
  "brand": "exact brand",
  "product_name": "exact product name",
  "variant": "variant or null",
  "weight": "weight or null",
  "full_name": "brand + product + variant + weight combined",
  "queries": ["most specific", "medium", "broad"],
  "confidence": 95,
  "category": "category",
  "is_supplement": boolean,
  "is_food": boolean,
  "is_gadget": boolean
}`,
              },
            ],
          },
        ],
      });

      const vText = claudeRes.content[0]?.type === "text" ? claudeRes.content[0].text : "";
      const details = safeJsonParse<{
        brand?: string;
        product_name?: string;
        variant?: string | null;
        weight?: string | null;
        full_name?: string;
        queries?: string[];
        confidence?: number;
        category?: string;
      }>(vText);

      if (!details?.brand && !details?.product_name) {
        return NextResponse.json({ error: "Could not read product details. Please try a clearer image." }, { status: 400 });
      }

      const q0 = details.queries?.[0] || details.full_name || `${details.brand} ${details.product_name}`;

      const [shoppingResults, amazonResults, rainforestResults, imageResults] = await Promise.all([
        serpApiShopping(q0),
        serpApiAmazon(q0),
        rainforestSearch(details.full_name || q0),
        serpApiImages(details.full_name || q0),
      ]);

      let allCandidates: Candidate[] = [
        ...((shoppingResults.shopping_results as Record<string, unknown>[]) || []).map((r) => ({
          title: String(r.title ?? ""),
          price: String(r.price ?? ""),
          image: String(r.thumbnail ?? ""),
          source: "google_shopping",
          link: String(r.link ?? ""),
        })),
        ...((amazonResults.organic_results as Record<string, unknown>[]) || []).map((r) => ({
          title: String(r.title ?? ""),
          price: String((r.price as { raw?: string })?.raw ?? ""),
          image: String(r.thumbnail ?? ""),
          source: "amazon",
          asin: String(r.asin ?? ""),
          link: String(r.link ?? ""),
        })),
        ...((rainforestResults.search_results as Record<string, unknown>[]) || []).map((r) => ({
          title: String(r.title ?? ""),
          price: r.price && typeof r.price === "object" && "value" in (r.price as object)
            ? `$${(r.price as { value?: number }).value}`
            : "",
          image: String(r.image ?? ""),
          source: "rainforest",
          asin: String(r.asin ?? ""),
          rating: Number(r.rating) || undefined,
          reviews: Number(r.ratings_total) || undefined,
        })),
      ];

      if (allCandidates.length === 0) {
        const broadResults = await serpApiShopping(details.queries?.[2] || `${details.brand} ${details.product_name}`);
        allCandidates = [
          ...allCandidates,
          ...((broadResults.shopping_results as Record<string, unknown>[]) || []).map((r) => ({
            title: String(r.title ?? ""),
            price: String(r.price ?? ""),
            image: String(r.thumbnail ?? ""),
            source: "google_shopping_broad",
          })),
        ];
      }

      let bestMatch: Candidate | null = null;
      let exactName = details.full_name || `${details.brand} ${details.product_name}`.trim();
      let confOut = details.confidence ?? 92;

      if (allCandidates.length > 0) {
        const candidateText = allCandidates
          .slice(0, 8)
          .map((c, i) => `${i + 1}. "${c.title}" — ${c.price || ""} [${c.source}] ASIN:${c.asin || "N/A"}`)
          .join("\n");

        const verifyRes = await anthropic.messages.create({
          model: OPUS_MODEL,
          max_tokens: 250,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
                {
                  type: "text",
                  text: `Look at this product image carefully.

These are products found online — which is the EXACT same product?
Match by: brand name, product name, variant, packaging.

${candidateText}

Return ONLY JSON:
{
  "best_index": 1,
  "exact_name": "full product name",
  "confidence": 97,
  "asin": "if found"
}`,
                },
              ],
            },
          ],
        });

        const verText = verifyRes.content[0]?.type === "text" ? verifyRes.content[0].text : "";
        const verify = safeJsonParse<{
          best_index?: number;
          exact_name?: string;
          confidence?: number;
          asin?: string;
        }>(verText);

        if (verify && typeof verify.best_index === "number" && verify.best_index > 0) {
          bestMatch = allCandidates[verify.best_index - 1] ?? null;
          if (verify.exact_name) exactName = verify.exact_name;
          if (typeof verify.confidence === "number") confOut = verify.confidence;

          // Build an ordered list of candidates to try: Claude's pick first, then others
          const orderedCandidates: Candidate[] = [
            ...(bestMatch ? [bestMatch] : []),
            ...allCandidates.filter((c) => c !== bestMatch),
          ];

          for (const candidate of orderedCandidates.slice(0, 4)) {
            const candidateAsin = candidate === bestMatch
              ? (verify.asin && verify.asin !== "N/A" ? verify.asin : candidate.asin)
              : candidate.asin;

            if (candidateAsin) {
              const rfProduct = await rainforestProduct(candidateAsin);
              const p = rfProduct.product as Record<string, unknown> | undefined;
              if (p?.title) {
                const title = String(p.title);
                const mainImg = p.main_image as { link?: string } | undefined;
                const imgs = p.images as { link?: string }[] | undefined;
                const rfImg = await getCleanImage(title, mainImg?.link || imgs?.[0]?.link);

                // Visual confirmation: is this actually the same product?
                const isSame = await verifyProductImageMatch(anthropic, image, mediaType, rfImg, title);
                if (!isSame) continue; // Try next candidate

                const buybox = p.buybox_winner as { price?: { value?: number } } | undefined;
                return NextResponse.json({
                  brand: details.brand,
                  product_name: title,
                  variant: details.variant ?? "",
                  weight: details.weight ?? "",
                  search_query: title,
                  confidence: 99,
                  product_image: rfImg,
                  price: buybox?.price?.value != null ? `$${buybox.price.value}` : "",
                  asin: candidateAsin,
                  rating: p.rating,
                  reviews_count: p.ratings_total,
                  source: "rainforest_verified",
                  category: details.category,
                });
              }
            }

            // No ASIN — verify using the candidate's thumbnail image
            if (candidate.image?.startsWith("http")) {
              const isSame = await verifyProductImageMatch(anthropic, image, mediaType, candidate.image, String(candidate.title ?? exactName));
              if (isSame) {
                bestMatch = candidate;
                exactName = String(candidate.title ?? exactName);
                break;
              }
            }
          }
        }
      }

      // If bestMatch has an image, do a final visual sanity check
      if (bestMatch?.image?.startsWith("http")) {
        const isSame = await verifyProductImageMatch(anthropic, image, mediaType, bestMatch.image, String(bestMatch.title ?? exactName));
        if (!isSame) {
          // The selected match is the wrong product — clear it and use Claude's extracted name only
          bestMatch = null;
          confOut = Math.min(confOut, 80);
        }
      }

      let productImage = "";
      if (bestMatch?.image?.startsWith("http") && !bestMatch.image.startsWith("data:")) {
        productImage = bestMatch.image;
      }
      if (!productImage) {
        const imgResults2 = (imageResults.images_results as { original?: string; thumbnail?: string }[]) || [];
        const cleanImg = imgResults2.find((im) => im.original?.startsWith("http"));
        productImage = cleanImg?.original || cleanImg?.thumbnail || "";
      }
      if (!productImage) {
        productImage = await getCleanImage(exactName);
      }

      return NextResponse.json({
        brand: details.brand,
        product_name: exactName,
        variant: details.variant ?? "",
        weight: details.weight ?? "",
        search_query: details.queries?.[0] || exactName,
        confidence: confOut,
        product_image: productImage,
        price: bestMatch?.price || "",
        asin: bestMatch?.asin || "",
        rating: bestMatch?.rating,
        reviews_count: bestMatch?.reviews,
        category: details.category,
        source: "multi_layer_ai",
      });
    }

    if (textStr) {
      const [shoppingRes, amazonRes, rfRes] = await Promise.all([
        serpApiShopping(textStr),
        serpApiAmazon(textStr),
        rainforestSearch(textStr),
      ]);

      const top = (shoppingRes.shopping_results as Record<string, unknown>[])?.[0];
      const rfResults = (rfRes.search_results as Record<string, unknown>[]) || [];
      const rfTop = rfResults[0];
      const amazonTop = (amazonRes.organic_results as Record<string, unknown>[])?.[0];

      const productName =
        String(rfTop?.title ?? top?.title ?? amazonTop?.title ?? textStr) || textStr;

      let img = String(rfTop?.image ?? top?.thumbnail ?? amazonTop?.thumbnail ?? "");
      if (!img || img.startsWith("data:")) {
        img = await getCleanImage(productName);
      }

      const asin = String(rfTop?.asin ?? amazonTop?.asin ?? "").trim();
      if (asin) {
        const rfProduct = await rainforestProduct(asin);
        const p = rfProduct.product as Record<string, unknown> | undefined;
        if (p?.title) {
          const title = String(p.title);
          const mainImg = p.main_image as { link?: string } | undefined;
          const rfImg = await getCleanImage(title, mainImg?.link);
          const buybox = p.buybox_winner as { price?: { value?: number } } | undefined;
          return NextResponse.json({
            product_name: title,
            brand: String(p.brand ?? ""),
            search_query: title,
            confidence: 95,
            product_image: rfImg,
            price: buybox?.price?.value != null ? `$${buybox.price.value}` : "",
            asin,
            rating: p.rating,
            reviews_count: p.ratings_total,
            source: "text_rainforest",
          });
        }
      }

      return NextResponse.json({
        product_name: productName,
        search_query: textStr,
        confidence: top ? 82 : 65,
        product_image: img,
        price: String(top?.price ?? ""),
        source: "text_search",
      });
    }

    return NextResponse.json({ error: "Please upload an image, paste a link, or describe your product." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Identify error:", error);
    return NextResponse.json({ error: "Could not identify product. Please try again." }, { status: 500 });
  }
}
