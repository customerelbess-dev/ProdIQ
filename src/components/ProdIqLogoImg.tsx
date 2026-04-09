/* eslint-disable @next/next/no-img-element -- plain /public logo; next/image not used */

export type ProdIqLogoPreset = "navbar" | "footer" | "inline" | "hero" | "default" | "tab";

const LOGO_BY_PRESET: Record<ProdIqLogoPreset, { px: number; r: number }> = {
  navbar: { px: 36, r: 10 },
  footer: { px: 40, r: 10 },
  inline: { px: 48, r: 10 },
  hero: { px: 40, r: 10 },
  default: { px: 40, r: 10 },
  tab: { px: 24, r: 6 },
};

/**
 * Plain static logo — use instead of next/image for predictable /public serving.
 */
export function ProdIqLogoImg({ preset = "default" }: { preset?: ProdIqLogoPreset }) {
  const { px, r } = LOGO_BY_PRESET[preset];
  return (
    <img
      src="/logo.png"
      alt="ProdIQ logo"
      width={px}
      height={px}
      style={{ borderRadius: `${r}px`, display: "block", width: `${px}px`, height: `${px}px` }}
    />
  );
}
