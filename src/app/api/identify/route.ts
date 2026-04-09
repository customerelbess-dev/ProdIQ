import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { identifyProduct, type IdentifyInput } from "@/lib/analyze-pipeline";

export const maxDuration = 120;

const OPUS_MODEL = process.env.ANTHROPIC_IDENTIFY_MODEL ?? "claude-opus-4-5-20251101";

// ─── API key helpers ──────────────────────────────────────────────────────────

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}
function serpKey() { return process.env.SERPAPI_KEY?.trim() || ""; }
function rainforestKey() { return process.env.RAINFOREST_API_KEY?.trim() || ""; }
function scraperKey() { return process.env.SCRAPER_API_KEY?.trim() || ""; }
function serperKey() { return process.env.SERPER_API_KEY?.trim() || ""; }
function apifyKey() { return process.env.APIFY_API_KEY?.trim() || ""; }
function scrapeCreatorsKey() { return process.env.SCRAPE_CREATORS_API_KEY?.trim() || ""; }

// ─── SerpAPI ─────────────────────────────────────────────────────────────────

async function serpApiGoogleLensBase64(base64: string, mediaType: string): Promise<Record<string, unknown>> {
  const key = serpKey();
  if (!key) return {};
  try {
    const formData = new FormData();
    const blob = new Blob([Buffer.from(base64, "base64")], { type: mediaType });
    formData.append("image", blob, "product.jpg");
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_reverse_image&api_key=${key}`,
      { method: "POST", body: formData, signal: AbortSignal.timeout(12000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch { return {}; }
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
  } catch { return {}; }
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
  } catch { return {}; }
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
  } catch { return {}; }
}

// ─── Serper API ───────────────────────────────────────────────────────────────

async function serperWebSearch(query: string): Promise<Record<string, unknown>> {
  const k = serperKey();
  if (!k) return {};
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": k, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 10 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch { return {}; }
}

async function serperShoppingSearch(query: string): Promise<Record<string, unknown>> {
  const k = serperKey();
  if (!k) return {};
  try {
    const res = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: { "X-API-KEY": k, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 10 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch { return {}; }
}

async function serperImages(productName: string): Promise<string> {
  const k = serperKey();
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
      (img) => img.imageUrl?.startsWith("http") && !img.imageUrl.startsWith("data:") && !img.imageUrl.includes("base64"),
    );
    return clean?.imageUrl || "";
  } catch { return ""; }
}

// ─── Rainforest API ───────────────────────────────────────────────────────────

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
  } catch { return {}; }
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
  } catch { return {}; }
}

// ─── ScraperAPI ───────────────────────────────────────────────────────────────

async function scrapeUrl(url: string): Promise<Record<string, unknown>> {
  const apiKey = scraperKey();
  if (!apiKey) return {};
  try {
    const res = await fetch(
      `http://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}&autoparse=true&follow_redirect=true`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, unknown>;
  } catch { return {}; }
}

// ─── Apify ────────────────────────────────────────────────────────────────────

async function apifyScrape(url: string): Promise<Record<string, unknown>> {
  const key = apifyKey();
  if (!key) return {};
  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(key)}&timeout=20`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxPagesPerCrawl: 1,
          pageFunction: `async function pageFunction(context) {
            const { $ } = context;
            return {
              name: $("[itemprop='name']").first().text().trim() || $("h1").first().text().trim(),
              price: $("[itemprop='price']").attr("content") || $(".price, [class*='price']").first().text().trim(),
              description: $("[itemprop='description']").first().text().trim().slice(0, 500),
              image: $("[itemprop='image']").attr("content") || $("meta[property='og:image']").attr("content") || "",
              brand: $("[itemprop='brand']").text().trim(),
              title: $("title").text().trim(),
              url: context.request.url,
            };
          }`,
        }),
        signal: AbortSignal.timeout(28000),
      },
    );
    if (!res.ok) return {};
    const data = (await res.json()) as unknown[];
    return Array.isArray(data) && data.length > 0 ? (data[0] as Record<string, unknown>) : {};
  } catch { return {}; }
}

// ─── ScrapeCreators ───────────────────────────────────────────────────────────

type SocialVideo = { videoUrl?: string; description?: string; author?: string; platform?: string };

async function scrapeCreatorsSearch(query: string): Promise<SocialVideo[]> {
  const key = scrapeCreatorsKey();
  if (!key) return [];
  try {
    // ScrapeCreators TikTok video search
    const res = await fetch(
      `https://api.scrapecreators.com/v1/tiktok/search/videos?query=${encodeURIComponent(query)}&limit=5`,
      {
        headers: { "x-api-key": key },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: { video_url?: string; desc?: string; author?: { nickname?: string } }[];
    };
    return (data.data || []).map((v) => ({
      videoUrl: v.video_url,
      description: v.desc,
      author: v.author?.nickname,
      platform: "tiktok",
    }));
  } catch { return []; }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function getCleanImage(productName: string, existingImg?: string): Promise<string> {
  if (existingImg && existingImg.startsWith("http") && !existingImg.startsWith("data:")) {
    return existingImg;
  }
  try {
    const res = await serpApiImages(productName);
    const imgs = (res.images_results as { original?: string; thumbnail?: string }[]) || [];
    const clean = imgs.find((img) => img.original?.startsWith("http") && !img.original.startsWith("data:"));
    if (clean?.original) return clean.original;
    if (clean?.thumbnail?.startsWith("http")) return clean.thumbnail;
  } catch { /* fall through */ }
  return serperImages(productName);
}

function stripDataUrlBase64(raw: string): string {
  const idx = raw.indexOf(",");
  return idx >= 0 ? raw.slice(idx + 1).replace(/\s/g, "") : raw.replace(/\s/g, "");
}

function safeJsonParse<T>(raw: string): T | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]) as T; } catch { return null; }
}

function guessMediaTypeFromBase64(base64: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  try {
    const buf = Buffer.from(base64.slice(0, 48), "base64");
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
    if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
    if (buf.length >= 3 && buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
    if (buf.length >= 4 && buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  } catch { /* ignore */ }
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

// ─── Visual verification ─────────────────────────────────────────────────────

type VisualProfile = {
  container_shape?: string;
  material?: string;
  cap_type?: string;
  cap_color?: string;
  label_bg_color?: string;
  label_text_colors?: string[];
  unique_elements?: string[];
};

/**
 * Ask Claude to compare the uploaded image with a found product image.
 * Uses the visual profile for precise, element-by-element comparison.
 * Returns: "exact" | "variant" | "different"
 * Falls back to "exact" on any error so we never wrongly discard a good match.
 */
async function verifyVisualMatch(
  anthropic: Anthropic,
  uploadedBase64: string,
  uploadedMediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp",
  foundImageUrl: string,
  foundProductName: string,
  visualProfile?: VisualProfile,
): Promise<{ match: "exact" | "variant" | "different"; confidence: number; mismatches: string[] }> {
  if (!foundImageUrl.startsWith("http")) return { match: "exact", confidence: 90, mismatches: [] };
  try {
    const vpChecklist = visualProfile ? [
      visualProfile.container_shape && `- Container shape: should be "${visualProfile.container_shape}"`,
      visualProfile.material && `- Material: should be "${visualProfile.material}"`,
      visualProfile.cap_type && `- Cap type: should be "${visualProfile.cap_type}"`,
      visualProfile.cap_color && `- Cap color: should be "${visualProfile.cap_color}"`,
      visualProfile.label_bg_color && `- Label background: should be "${visualProfile.label_bg_color}"`,
      visualProfile.label_text_colors?.length && `- Label text colors: should include ${visualProfile.label_text_colors.join(", ")}`,
      visualProfile.unique_elements?.length && `- Unique elements: should have ${visualProfile.unique_elements.join(", ")}`,
    ].filter(Boolean).join("\n") : "";

    const res = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: uploadedMediaType, data: uploadedBase64 } },
            { type: "image", source: { type: "url", url: foundImageUrl } },
            {
              type: "text",
              text: `You are a precise visual product matcher. Compare Image 1 (uploaded) with Image 2 ("${foundProductName}").

${vpChecklist ? `CHECK EACH OF THESE VISUAL CRITERIA FOR IMAGE 2:\n${vpChecklist}\n` : ""}
CHECK:
1. Same container shape and size
2. Same cap type AND cap color
3. Same label layout and background color
4. Same brand name and font style
5. Same variant/flavor/scent (if visible)
6. Same volume/weight markings (if visible)

A VARIANT means: same brand + product but different size, flavor, or color.
DIFFERENT means: wrong product entirely, or different brand.

Reply ONLY JSON:
{
  "match": "exact" | "variant" | "different",
  "confidence": 0-100,
  "mismatches": ["list any specific differences found, empty if exact match"]
}`,
            },
          ],
        },
      ],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    const parsed = safeJsonParse<{ match?: string; confidence?: number; mismatches?: string[] }>(text);
    const match = (parsed?.match === "variant" ? "variant" : parsed?.match === "different" ? "different" : "exact") as "exact" | "variant" | "different";
    return {
      match,
      confidence: typeof parsed?.confidence === "number" ? parsed.confidence : 90,
      mismatches: Array.isArray(parsed?.mismatches) ? parsed.mismatches : [],
    };
  } catch {
    return { match: "exact", confidence: 80, mismatches: [] };
  }
}

// ─── Main route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // ── Legacy inputType path (used by analyze pipeline) ─────────────────────
    if (body.inputType && ["image", "url", "text"].includes(String(body.inputType))) {
      const inputType = body.inputType as IdentifyInput["inputType"];
      if (inputType === "image" && !body.imageBase64)
        return NextResponse.json({ error: "imageBase64 is required for image input" }, { status: 400 });
      if (inputType === "url" && !String(body.url ?? "").trim())
        return NextResponse.json({ error: "url is required for url input" }, { status: 400 });
      if (inputType === "text" && !String(body.description ?? "").trim())
        return NextResponse.json({ error: "description is required for text input" }, { status: 400 });
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
      image?: string; url?: string; text?: string; mediaType?: string;
    };

    const imageRaw = typeof imageField === "string" ? imageField : undefined;
    const image = imageRaw ? stripDataUrlBase64(imageRaw) : undefined;
    const urlStr = typeof url === "string" ? url.trim() : "";
    const textStr = typeof text === "string" ? text.trim() : "";

    if (!image && !urlStr && !textStr)
      return NextResponse.json({ error: "Please upload an image, paste a link, or describe your product." }, { status: 400 });

    // ── URL path ──────────────────────────────────────────────────────────────
    if (urlStr) {
      let realUrl = urlStr;
      try {
        const followed = await fetch(urlStr, {
          redirect: "follow",
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" },
        });
        realUrl = followed.url;
      } catch { /* keep original */ }

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
            brand: String(product.brand ?? ""),
            search_query: title,
            confidence: 99,
            product_image: img,
            price: priceVal != null ? `$${priceVal}` : priceRaw ? String(priceRaw) : "",
            amazon_link: `https://www.amazon.com/dp/${asin}`,
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
          amazon_link: asin ? `https://www.amazon.com/dp/${asin}` : "",
          source: "scraper_fallback",
          asin: asin || String(scraped.asin ?? ""),
        });
      }
    }

    // ── TEXT path ─────────────────────────────────────────────────────────────
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
      const productName = String(rfTop?.title ?? top?.title ?? amazonTop?.title ?? textStr) || textStr;
      let img = String(rfTop?.image ?? top?.thumbnail ?? amazonTop?.thumbnail ?? "");
      if (!img || img.startsWith("data:")) img = await getCleanImage(productName);
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
            amazon_link: `https://www.amazon.com/dp/${asin}`,
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
        amazon_link: asin ? `https://www.amazon.com/dp/${asin}` : "",
        source: "text_search",
      });
    }

    // ── IMAGE path — full multi-source pipeline ───────────────────────────────
    if (!image)
      return NextResponse.json({ error: "Please upload an image, paste a link, or describe your product." }, { status: 400 });

    const anthropic = getAnthropic();
    if (!anthropic)
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 503 });

    const mediaTypeRaw = typeof mediaTypeBody === "string" && mediaTypeBody.startsWith("image/") ? mediaTypeBody : "";
    const mediaType = (mediaTypeRaw || guessMediaTypeFromBase64(image)) as
      | "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    // ── STEP 1: Claude visual extraction — full visual profile ───────────────
    // Extract every visual detail: text, shape, cap, label, colors, material, etc.
    console.log("[identify] Step 1: Claude deep visual extraction");
    const claudeRes = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            {
              type: "text",
              text: `You are the world's most precise product identification expert. Analyze this product image with extreme attention to detail.

READ EVERY PIECE OF TEXT VISIBLE:
- Brand name (exact spelling, case, punctuation)
- Product name (exact spelling)
- Variant / flavor / scent / color / strength / formulation
- Weight, volume, count (e.g. "500ml", "16oz", "60 capsules")
- Model number, SKU, batch code
- Any barcode numbers visible
- Every slogan, certification, badge, or claim on packaging

DESCRIBE THE PACKAGING PRECISELY:
- Container shape: round cylinder / square / oval / irregular / flat pouch / box / tube / sachet
- Container material: glass / rigid plastic / soft plastic / metal / cardboard / paper
- Cap/closure type: screw cap / pump / spray / dropper / flip-top / press-top / no cap / pull tab / zip / twist-off
- Cap color (exact): e.g. "matte black", "chrome silver", "white plastic"
- Label type: full wrap / front panel only / top + front / no label (printed directly)
- Label background color (exact): e.g. "white", "dark navy", "kraft brown"
- Label text colors: list all colors used
- Primary font style: serif / sans-serif / script / bold / condensed
- Logo: describe position (top-left, centered, bottom) and style
- Dominant color palette: list 3–5 main colors with approximate hex if possible
- Unique visual elements: foil, embossing, gradient, pattern, transparent window, etc.
- Product color if visible through packaging

Return ONLY JSON:
{
  "brand": "exact brand name",
  "product_name": "exact product name",
  "model": "model/SKU or null",
  "variant": "variant/flavor/color or null",
  "weight": "weight/volume or null",
  "color": "product color if visible or null",
  "visible_text": ["every", "readable", "word"],
  "full_name": "brand + product_name + variant + weight as one search string",
  "visual_profile": {
    "container_shape": "e.g. round cylinder",
    "material": "e.g. glass",
    "cap_type": "e.g. screw cap",
    "cap_color": "e.g. matte black",
    "label_type": "e.g. full wrap",
    "label_bg_color": "e.g. white",
    "label_text_colors": ["black", "gold"],
    "font_style": "e.g. sans-serif bold",
    "logo_position": "e.g. top center",
    "dominant_colors": ["#ffffff", "#000000"],
    "unique_elements": ["foil logo", "embossed border"]
  },
  "queries": [
    "most specific: brand + full name + variant + weight + packaging detail",
    "medium: brand + product name + variant",
    "broad: brand + product name"
  ],
  "confidence": 95,
  "category": "product category",
  "is_supplement": false,
  "is_food": false,
  "is_gadget": false
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
      model?: string | null;
      variant?: string | null;
      weight?: string | null;
      color?: string | null;
      visible_text?: string[];
      full_name?: string;
      visual_profile?: {
        container_shape?: string;
        material?: string;
        cap_type?: string;
        cap_color?: string;
        label_type?: string;
        label_bg_color?: string;
        label_text_colors?: string[];
        font_style?: string;
        logo_position?: string;
        dominant_colors?: string[];
        unique_elements?: string[];
      };
      queries?: string[];
      confidence?: number;
      category?: string;
    }>(vText);

    if (!details?.brand && !details?.product_name)
      return NextResponse.json({ error: "Could not read product details. Please try a clearer image." }, { status: 400 });

    const vp = details.visual_profile ?? {};

    // Build enriched queries that include visual/packaging details for more precise results
    const packagingDetail = [vp.cap_color, vp.material, vp.container_shape]
      .filter(Boolean)
      .join(" ");
    const visualQuery = `${details.brand ?? ""} ${details.product_name ?? ""} ${details.variant ?? ""} ${packagingDetail}`.trim().replace(/\s+/g, " ");

    const q0 = details.queries?.[0] || details.full_name || `${details.brand} ${details.product_name}`.trim();
    const qVisual = visualQuery || q0;
    const qBroad = details.queries?.[2] || `${details.brand} ${details.product_name}`.trim();

    // ── STEP 2: Serper Google search — web + shopping ────────────────────────
    // Serper gives us Google organic results + Google Shopping with real links.
    console.log("[identify] Step 2: Serper web + shopping search");
    const [serperWeb, serperShop] = await Promise.all([
      serperWebSearch(q0),
      serperShoppingSearch(q0),
    ]);

    // ── STEP 3: SerpAPI cross-reference — shopping + Amazon + images ─────────
    // SerpAPI is a second Google data source to cross-reference.
    // We also fire the visual (packaging-enriched) query for more precise matching.
    console.log("[identify] Step 3: SerpAPI cross-reference + Rainforest");
    void serpApiGoogleLensBase64(image, mediaType); // fire & forget — reverse image search

    const [serpShop, serpAmazon, rfSearch, serpImgs, serpShopVisual] = await Promise.all([
      serpApiShopping(q0),
      serpApiAmazon(q0),
      rainforestSearch(details.full_name || q0),
      serpApiImages(details.full_name || q0),
      // Extra: search using packaging-specific query for exact variant match
      qVisual !== q0 ? serpApiShopping(qVisual) : Promise.resolve({} as Record<string, unknown>),
    ]);

    // ── STEP 4: Collect & deduplicate candidates from all sources ─────────────
    console.log("[identify] Step 4: Collecting candidates");

    // Serper shopping results
    const serperShopItems = (serperShop.shopping as Record<string, unknown>[]) || [];
    // Serper organic — extract Google Shopping links from organic results
    const serperOrganic = (serperWeb.organic as Record<string, unknown>[]) || [];
    const serperShoppingLink = serperShopItems[0]?.link as string | undefined;
    const googleShoppingLink = serperShopItems[0]
      ? `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q0)}`
      : "";

    let allCandidates: Candidate[] = [
      // Serper Shopping
      ...serperShopItems.slice(0, 5).map((r) => ({
        title: String(r.title ?? ""),
        price: String(r.price ?? ""),
        image: String(r.imageUrl ?? r.thumbnailUrl ?? ""),
        source: "serper_shopping",
        link: String(r.link ?? ""),
      })),
      // Serper organic (product pages)
      ...serperOrganic.slice(0, 3).map((r) => ({
        title: String(r.title ?? ""),
        price: "",
        image: "",
        source: "serper_organic",
        link: String(r.link ?? ""),
      })),
      // SerpAPI Shopping
      ...((serpShop.shopping_results as Record<string, unknown>[]) || []).slice(0, 5).map((r) => ({
        title: String(r.title ?? ""),
        price: String(r.price ?? ""),
        image: String(r.thumbnail ?? ""),
        source: "serpapi_shopping",
        link: String(r.link ?? ""),
      })),
      // SerpAPI Amazon
      ...((serpAmazon.organic_results as Record<string, unknown>[]) || []).slice(0, 5).map((r) => ({
        title: String(r.title ?? ""),
        price: String((r.price as { raw?: string })?.raw ?? ""),
        image: String(r.thumbnail ?? ""),
        source: "amazon_serpapi",
        asin: String(r.asin ?? ""),
        link: String(r.link ?? ""),
      })),
      // Rainforest Amazon
      ...((rfSearch.search_results as Record<string, unknown>[]) || []).slice(0, 5).map((r) => ({
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
      // Packaging-visual query results (highest specificity — exact variant match)
      ...((serpShopVisual.shopping_results as Record<string, unknown>[]) || []).slice(0, 4).map((r) => ({
        title: String(r.title ?? ""),
        price: String(r.price ?? ""),
        image: String(r.thumbnail ?? ""),
        source: "serpapi_visual_query",
        link: String(r.link ?? ""),
      })),
    ];

    // Broad fallback if no candidates yet
    if (allCandidates.length < 3) {
      const [broadShop, broadRf] = await Promise.all([
        serpApiShopping(qBroad),
        rainforestSearch(qBroad),
      ]);
      allCandidates = [
        ...allCandidates,
        ...((broadShop.shopping_results as Record<string, unknown>[]) || []).slice(0, 4).map((r) => ({
          title: String(r.title ?? ""),
          price: String(r.price ?? ""),
          image: String(r.thumbnail ?? ""),
          source: "serpapi_shopping_broad",
          link: String(r.link ?? ""),
        })),
        ...((broadRf.search_results as Record<string, unknown>[]) || []).slice(0, 3).map((r) => ({
          title: String(r.title ?? ""),
          price: "",
          image: String(r.image ?? ""),
          source: "rainforest_broad",
          asin: String(r.asin ?? ""),
        })),
      ];
    }

    // ── STEP 5: ScraperAPI + Apify — scrape top product pages ────────────────
    // We scrape the top 3 non-Amazon URLs in parallel for full product details.
    // Amazon URLs are handled by Rainforest (richer data, no scraping needed).
    console.log("[identify] Step 5: Scraping top product pages");

    const topUrls = allCandidates
      .map((c) => c.link)
      .filter((l): l is string => !!l && l.startsWith("http"))
      .slice(0, 4);

    const [amazonUrls, otherUrls] = topUrls.reduce<[string[], string[]]>(
      ([amz, oth], u) => (u.includes("amazon.com") ? [[...amz, u], oth] : [amz, [...oth, u]]),
      [[], []],
    );

    // ScraperAPI handles Amazon well; Apify handles general product pages
    const scraperPromises = amazonUrls.slice(0, 2).map((u) => scrapeUrl(u));
    const apifyPromises = otherUrls.slice(0, 2).map((u) => apifyScrape(u));

    const [scraperResults, apifyResults] = await Promise.all([
      Promise.all(scraperPromises),
      Promise.all(apifyPromises),
    ]);

    // Merge scraped data into candidates — enrich with full descriptions/images
    const scrapedData: Record<string, unknown>[] = [...scraperResults, ...apifyResults].filter(
      (d) => d && (d.name || d.title),
    );

    // ── STEP 6: ScrapeCreators — social content verification ─────────────────
    // Find TikTok creator content about the product for additional signals.
    console.log("[identify] Step 6: ScrapeCreators social search");
    const socialContent = await scrapeCreatorsSearch(q0);

    // ── STEP 7: Claude selects best match ─────────────────────────────────────
    // Give Claude the uploaded image + full candidate list + scraped details.
    console.log("[identify] Step 7: Claude selects best match");

    let bestMatch: Candidate | null = null;
    let exactName = details.full_name || `${details.brand} ${details.product_name}`.trim();
    let confOut = details.confidence ?? 92;
    let bestAsin = "";

    if (allCandidates.length > 0) {
      const candidateText = allCandidates
        .slice(0, 10)
        .map(
          (c, i) =>
            `${i + 1}. "${c.title}" — ${c.price || "price unknown"} [${c.source}]${c.asin ? ` ASIN:${c.asin}` : ""}${c.link ? ` URL:${c.link}` : ""}`,
        )
        .join("\n");

      const scrapedSummary = scrapedData
        .slice(0, 3)
        .map((d, i) => `Scraped ${i + 1}: name="${d.name || d.title}" brand="${d.brand}" price="${d.price}" desc="${String(d.description ?? "").slice(0, 120)}"`)
        .join("\n");

      // Build a visual profile summary string to anchor Claude's comparison
      const vpSummary = [
        vp.container_shape && `Shape: ${vp.container_shape}`,
        vp.material && `Material: ${vp.material}`,
        vp.cap_type && `Cap: ${vp.cap_type}${vp.cap_color ? ` (${vp.cap_color})` : ""}`,
        vp.label_bg_color && `Label bg: ${vp.label_bg_color}`,
        vp.label_text_colors?.length && `Label colors: ${vp.label_text_colors.join(", ")}`,
        vp.unique_elements?.length && `Unique: ${vp.unique_elements.join(", ")}`,
        details.weight && `Volume/weight: ${details.weight}`,
        details.variant && `Variant: ${details.variant}`,
      ].filter(Boolean).join(" | ");

      const verifyRes = await anthropic.messages.create({
        model: OPUS_MODEL,
        max_tokens: 320,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
              {
                type: "text",
                text: `You are a precision product matching expert. Your job is to find the EXACT same product — same bottle shape, same cap, same label design, same variant, same size.

VISUAL PROFILE OF UPLOADED PRODUCT:
${vpSummary || "(see image)"}

PRODUCTS FOUND ONLINE — pick the one that matches ALL visual details above:
${candidateText}

${scrapedSummary ? `Additional scraped data:\n${scrapedSummary}\n` : ""}
STRICT MATCHING RULES:
- Cap color must match (black cap ≠ white cap)
- Container shape must match (round bottle ≠ flat pouch)
- Variant must match (lemon flavor ≠ original)
- Size/volume must match (500ml ≠ 250ml) if visible
- Label design must be recognizably the same

If multiple candidates match, pick the one with highest visual similarity.
If NO candidate matches all visual criteria, still return the closest one but lower confidence.

Return ONLY JSON:
{
  "best_index": 1,
  "exact_name": "full confirmed product name",
  "brand": "confirmed brand",
  "confidence": 97,
  "asin": "ASIN if found or empty string",
  "best_url": "product page URL or empty string",
  "visual_match_notes": "brief note on what matched"
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
        brand?: string;
        confidence?: number;
        asin?: string;
        best_url?: string;
      }>(verText);

      if (verify?.best_index && verify.best_index > 0) {
        bestMatch = allCandidates[verify.best_index - 1] ?? null;
        if (verify.exact_name) exactName = verify.exact_name;
        if (verify.brand && !details.brand) details.brand = verify.brand;
        if (typeof verify.confidence === "number") confOut = verify.confidence;
        bestAsin = (verify.asin && verify.asin !== "N/A" ? verify.asin : bestMatch?.asin) || "";
      }
    }

    // ── STEP 8: Rainforest enrichment — get full Amazon product details ───────
    console.log("[identify] Step 8: Rainforest enrichment");

    let amazonLink = bestAsin ? `https://www.amazon.com/dp/${bestAsin}` : "";
    let finalPrice = bestMatch?.price || "";
    let finalImage = "";
    let finalRating: unknown = null;
    let finalReviews: unknown = null;
    let finalDescription = "";

    if (bestAsin) {
      // Try Rainforest candidates in order: best ASIN first, then others
      const candidateAsins = [
        bestAsin,
        ...allCandidates.map((c) => c.asin).filter((a): a is string => !!a && a !== bestAsin),
      ].slice(0, 3);

      for (const asin of candidateAsins) {
        const rfProduct = await rainforestProduct(asin);
        const p = rfProduct.product as Record<string, unknown> | undefined;
        if (!p?.title) continue;

        const title = String(p.title);
        const mainImg = p.main_image as { link?: string } | undefined;
        const imgs = p.images as { link?: string }[] | undefined;
        const rfImgUrl = mainImg?.link || imgs?.[0]?.link || "";
        const rfImg = await getCleanImage(title, rfImgUrl);

        // ── STEP 9 (inner): Claude visual verification ────────────────────────
        // Compare uploaded image vs Rainforest product image element by element.
        const { match: visualMatch, confidence: visualConfidence, mismatches: vmm } = await verifyVisualMatch(
          anthropic, image, mediaType, rfImg, title, details.visual_profile,
        );
        console.log(`[identify] Visual check for ASIN ${asin}: ${visualMatch} (${visualConfidence}%) — mismatches: ${vmm.join(", ") || "none"}`);

        // Reject if wrong product OR confidence below 70%
        if (visualMatch === "different" || visualConfidence < 70) continue;

        const buybox = p.buybox_winner as { price?: { value?: number; raw?: string } } | undefined;
        const priceObj = p.price as { value?: number; raw?: string } | undefined;

        return NextResponse.json({
          // ── Product identity ─────────────────────────────────────────────
          product_name: title,
          brand: String(p.brand ?? details.brand ?? ""),
          variant: details.variant ?? "",
          weight: details.weight ?? "",
          model: details.model ?? "",
          color: details.color ?? "",
          category: details.category ?? "",

          // ── Purchase info ────────────────────────────────────────────────
          price: buybox?.price?.value != null
            ? `$${buybox.price.value}`
            : buybox?.price?.raw ?? priceObj?.raw ?? finalPrice,
          amazon_link: `https://www.amazon.com/dp/${asin}`,
          google_shopping_link: googleShoppingLink || serperShoppingLink || "",
          asin,

          // ── Product media ────────────────────────────────────────────────
          product_image: rfImg,

          // ── Ratings ──────────────────────────────────────────────────────
          rating: p.rating,
          reviews_count: p.ratings_total,

          // ── Confidence ───────────────────────────────────────────────────
          confidence: 99,
          visual_match: visualMatch,
          visual_confidence: visualConfidence,

          // ── Source & extras ──────────────────────────────────────────────
          source: "rainforest_verified",
          description: String(p.description ?? "").slice(0, 500),
          social_content: socialContent.slice(0, 3),
          sources_checked: [
            "claude_vision",
            "serper_web",
            "serper_shopping",
            "serpapi_shopping",
            "serpapi_amazon",
            "rainforest",
            "scraperapi",
            "apify",
            "scrapecreators",
          ].filter((s) => {
            if (s === "scrapecreators" && !scrapeCreatorsKey()) return false;
            if (s === "apify" && !apifyKey()) return false;
            if (s === "scraperapi" && !scraperKey()) return false;
            return true;
          }),
        });
      }
    }

    // ── STEP 9: Claude final visual confirmation (no ASIN path) ──────────────
    // If we never got a verified Rainforest result, do a final visual check
    // against the best candidate thumbnail we have.
    console.log("[identify] Step 9: Final visual confirmation (no-ASIN path)");

    let visualMatch: "exact" | "variant" | "different" = "exact";
    let visualConfidence = 85;

    if (bestMatch?.image?.startsWith("http")) {
      const check = await verifyVisualMatch(
        anthropic, image, mediaType, bestMatch.image, String(bestMatch.title ?? exactName), details.visual_profile,
      );
      visualMatch = check.match;
      visualConfidence = check.confidence;
      console.log(`[identify] Final visual check: ${visualMatch} (${visualConfidence}%) — ${check.mismatches.join(", ") || "no mismatches"}`);
      if (visualMatch === "different" || visualConfidence < 65) {
        bestMatch = null;
        confOut = Math.min(confOut, 70);
      }
    }

    // ── Retry with broad query if confidence is still low ────────────────────
    if (!bestMatch || confOut < 75) {
      console.log("[identify] Low confidence — retrying with alternate queries");
      const altQueries = [
        details.queries?.[1] || `${details.brand} ${details.product_name}`,
        `${details.brand} ${details.product_name} ${details.weight ?? ""}`.trim(),
        details.full_name || "",
      ].filter((q) => q && q !== q0 && q !== qBroad);

      for (const altQ of altQueries.slice(0, 2)) {
        const [retryShop, retryRf] = await Promise.all([
          serpApiShopping(altQ),
          rainforestSearch(altQ),
        ]);
        const retryCandidates: Candidate[] = [
          ...((retryShop.shopping_results as Record<string, unknown>[]) || []).slice(0, 5).map((r) => ({
            title: String(r.title ?? ""),
            price: String(r.price ?? ""),
            image: String(r.thumbnail ?? ""),
            source: "retry_shop",
            link: String(r.link ?? ""),
          })),
          ...((retryRf.search_results as Record<string, unknown>[]) || []).slice(0, 4).map((r) => ({
            title: String(r.title ?? ""),
            price: "",
            image: String(r.image ?? ""),
            source: "retry_rf",
            asin: String(r.asin ?? ""),
          })),
        ];

        for (const c of retryCandidates.slice(0, 5)) {
          if (!c.image?.startsWith("http")) continue;
          const { match: rm, confidence: rc } = await verifyVisualMatch(
            anthropic, image, mediaType, c.image, String(c.title ?? exactName), details.visual_profile,
          );
          if (rm === "exact" && rc >= 75) {
            bestMatch = c;
            exactName = String(c.title ?? exactName);
            confOut = rc;
            visualMatch = rm;
            visualConfidence = rc;
            console.log(`[identify] Retry found match: "${exactName}" (${rc}%)`);
            break;
          }
        }
        if (bestMatch) break;
      }
    }

    // Resolve final product image
    if (bestMatch?.image?.startsWith("http") && !bestMatch.image.startsWith("data:")) {
      finalImage = bestMatch.image;
    }
    if (!finalImage) {
      const imgRes = (serpImgs.images_results as { original?: string; thumbnail?: string }[]) || [];
      const clean = imgRes.find((im) => im.original?.startsWith("http"));
      finalImage = clean?.original || clean?.thumbnail || "";
    }
    if (!finalImage) finalImage = await getCleanImage(exactName);

    return NextResponse.json({
      product_name: exactName,
      brand: details.brand ?? "",
      variant: details.variant ?? "",
      weight: details.weight ?? "",
      model: details.model ?? "",
      color: details.color ?? "",
      category: details.category ?? "",
      price: finalPrice,
      amazon_link: amazonLink,
      google_shopping_link: googleShoppingLink || serperShoppingLink || "",
      asin: bestAsin || bestMatch?.asin || "",
      product_image: finalImage,
      rating: finalRating,
      reviews_count: finalReviews,
      confidence: confOut,
      visual_match: visualMatch,
      visual_confidence: visualConfidence,
      source: "multi_layer_ai",
      description: finalDescription,
      social_content: socialContent.slice(0, 3),
      sources_checked: [
        "claude_vision",
        "serper_web",
        "serper_shopping",
        "serpapi_shopping",
        "serpapi_amazon",
        "rainforest",
        ...(scraperKey() ? ["scraperapi"] : []),
        ...(apifyKey() ? ["apify"] : []),
        ...(scrapeCreatorsKey() ? ["scrapecreators"] : []),
      ],
    });
  } catch (error: unknown) {
    console.error("Identify error:", error);
    return NextResponse.json({ error: "Could not identify product. Please try again." }, { status: 500 });
  }
}
