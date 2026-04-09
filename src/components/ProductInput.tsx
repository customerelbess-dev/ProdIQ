"use client";

import { useCallback, useRef } from "react";
import { ImageIcon, Link2, AlignLeft } from "lucide-react";

export type ProductInputTab = "image" | "url" | "text";

type ProductInputProps = {
  tab: ProductInputTab;
  onTabChange: (t: ProductInputTab) => void;
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onImageClear: () => void;
  url: string;
  onUrlChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
};

const tabs: { id: ProductInputTab; label: string; icon: typeof ImageIcon }[] = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "url", label: "URL / Link", icon: Link2 },
  { id: "text", label: "Describe", icon: AlignLeft },
];

export function ProductInput({
  tab,
  onTabChange,
  imagePreview,
  onImageSelect,
  onImageClear,
  url,
  onUrlChange,
  description,
  onDescriptionChange,
}: ProductInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f?.type.startsWith("image/")) onImageSelect(f);
    },
    [onImageSelect],
  );

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="flex gap-1 rounded-lg border border-[#222222] bg-[#111111] p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition ${
              tab === id
                ? "bg-[#6c47ff] text-white"
                : "text-[#888888] hover:bg-[#1a1a1a] hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[220px]">
        {tab === "image" && (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#6c47ff]/50 bg-[#111111] px-6 py-12 transition hover:border-[#6c47ff] hover:bg-[#141414]"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImageSelect(f);
              }}
            />
            {imagePreview ? (
              <div className="flex w-full flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="max-h-40 rounded-lg border border-[#222222] object-contain"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageClear();
                  }}
                  className="text-sm text-[#ff4444] hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#6c47ff]/15 text-[#6c47ff]">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-center text-sm text-[#888888]">
                  Drop product image here or click to upload
                </p>
              </>
            )}
          </div>
        )}

        {tab === "url" && (
          <div className="rounded-xl border border-[#222222] bg-[#111111] p-4">
            <label htmlFor="product-url" className="mb-2 block text-sm text-[#888888]">
              Product link
            </label>
            <input
              id="product-url"
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="Amazon, AliExpress, Shopify…"
              className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-4 py-3 text-white placeholder:text-[#555555] focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff]"
            />
          </div>
        )}

        {tab === "text" && (
          <div className="rounded-xl border border-[#222222] bg-[#111111] p-4">
            <label htmlFor="product-desc" className="mb-2 block text-sm text-[#888888]">
              Product name & description
            </label>
            <textarea
              id="product-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={8}
              placeholder="e.g. Wireless earbuds with 40hr battery, ANC, under $80…"
              className="w-full resize-none rounded-lg border border-[#222222] bg-[#0a0a0a] px-4 py-3 text-white placeholder:text-[#555555] focus:border-[#6c47ff] focus:outline-none focus:ring-1 focus:ring-[#6c47ff]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
