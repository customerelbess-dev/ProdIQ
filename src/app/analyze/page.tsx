"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ProductInput, type ProductInputTab } from "@/components/ProductInput";
import { LoadingState } from "@/components/LoadingState";

const MARKETS = [
  "General Consumer",
  "Women 25-45",
  "Men 18-35",
  "Parents",
  "Fitness Enthusiasts",
  "Pet Owners",
  "Home Owners",
] as const;

const STEP_MS = 2600;

export default function AnalyzePage() {
  const router = useRouter();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [tab, setTab] = useState<ProductInputTab>("image");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [targetMarket, setTargetMarket] = useState<string>(MARKETS[0]);
  const [price, setPrice] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [error, setError] = useState<string | null>(null);

  const clearStepTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const onImageSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      setImageDataUrl(r);
      setImagePreview(r);
    };
    reader.readAsDataURL(file);
  }, []);

  const onImageClear = useCallback(() => {
    setImageDataUrl(null);
    setImagePreview(null);
  }, []);

  function validate(): string | null {
    if (tab === "image" && !imageDataUrl) return "Please upload a product image.";
    if (tab === "url" && !url.trim()) return "Please paste a product URL.";
    if (tab === "text" && !description.trim()) return "Please describe your product.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setLoading(true);
    setCompletedSteps([false, false, false, false]);
    clearStepTimers();

    for (let i = 0; i < 4; i++) {
      const t = setTimeout(() => {
        setCompletedSteps((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, STEP_MS * (i + 1));
      timersRef.current.push(t);
    }

    const priceNum = price.trim() === "" ? null : Number.parseFloat(price.replace(/,/g, ""));
    const body =
      tab === "image"
        ? {
            inputType: "image" as const,
            imageBase64: imageDataUrl!,
            targetMarket,
            pricePoint: priceNum != null && !Number.isNaN(priceNum) ? priceNum : null,
          }
        : tab === "url"
          ? {
              inputType: "url" as const,
              url: url.trim(),
              targetMarket,
              pricePoint: priceNum != null && !Number.isNaN(priceNum) ? priceNum : null,
            }
          : {
              inputType: "text" as const,
              description: description.trim(),
              targetMarket,
              pricePoint: priceNum != null && !Number.isNaN(priceNum) ? priceNum : null,
            };

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Analysis failed");
      }
      clearStepTimers();
      setCompletedSteps([true, true, true, true]);
      sessionStorage.setItem("prodiq_report", JSON.stringify(data));
      router.push("/report");
    } catch (err) {
      clearStepTimers();
      setCompletedSteps([false, false, false, false]);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-10 pt-[72px] sm:px-6 sm:pb-14 sm:pt-[84px]">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 self-start text-sm text-[#888888] transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {!loading ? (
          <>
            <h1 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Analyze Your Product
            </h1>
            <p className="mt-2 text-center text-[#888888]">
              Upload an image, paste a link, or describe your product
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-10 w-full space-y-8">
              <ProductInput
                tab={tab}
                onTabChange={setTab}
                imagePreview={imagePreview}
                onImageSelect={onImageSelect}
                onImageClear={onImageClear}
                url={url}
                onUrlChange={setUrl}
                description={description}
                onDescriptionChange={setDescription}
              />

              <div>
                <p className="mb-3 text-sm font-medium text-white">Who are you selling to?</p>
                <div className="flex flex-wrap gap-2">
                  {MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTargetMarket(m)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        targetMarket === m
                          ? "border-[#6c47ff] bg-[#6c47ff]/15 text-white"
                          : "border-[#222222] bg-[#111111] text-[#888888] hover:border-[#333333] hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="price" className="mb-2 block text-sm font-medium text-white">
                  What price will you sell at?
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]">
                    $
                  </span>
                  <input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="29.99"
                    className="w-full rounded-lg border border-[#222222] bg-[#111111] py-3 pl-8 pr-4 text-white placeholder:text-[#555555] focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff]"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-lg border border-[#ff4444]/40 bg-[#ff4444]/10 px-4 py-3 text-sm text-[#ff8888]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="flex h-14 w-full items-center justify-center rounded-lg bg-[#6c47ff] text-base font-semibold text-white transition hover:bg-[#5a3ad4]"
              >
                Get My Verdict →
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center py-8">
            <LoadingState completedSteps={completedSteps} />
          </div>
        )}
      </div>
    </div>
  );
}
