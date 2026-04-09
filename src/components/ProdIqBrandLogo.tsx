import Link from "next/link";
import type { CSSProperties } from "react";
import { ProdIqLogoImg, type ProdIqLogoPreset } from "@/components/ProdIqLogoImg";

type Variant = "navbar" | "inline" | "hero" | "footer";

const VARIANT_STYLES: Record<
  Variant,
  { preset: ProdIqLogoPreset; gap: number; fontSize: number; container?: CSSProperties }
> = {
  navbar: { preset: "navbar", gap: 8, fontSize: 20 },
  footer: { preset: "footer", gap: 8, fontSize: 22 },
  inline: { preset: "inline", gap: 10, fontSize: 22 },
  hero: {
    preset: "hero",
    gap: 12,
    fontSize: 36,
    container: { justifyContent: "center", marginBottom: "24px" },
  },
};

export function ProdIqBrandLogo({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const v = VARIANT_STYLES[variant];
  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${v.gap}px`,
        ...v.container,
      }}
    >
      <ProdIqLogoImg preset={v.preset} />
      <span style={{ fontSize: `${v.fontSize}px`, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px" }}>
        Prod<span style={{ color: "#6c47ff" }}>IQ</span>
      </span>
    </div>
  );
}

export function ProdIqBrandLogoLink({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  return (
    <Link href="/" className={className} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
      <ProdIqBrandLogo variant={variant} />
    </Link>
  );
}
