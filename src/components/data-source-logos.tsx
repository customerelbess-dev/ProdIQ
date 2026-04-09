import type { ReactNode } from "react";

const svgProps = {
  width: 32,
  height: 32,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "white",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** White outline logos — same stroke style as homepage partner row; includes full set for Resources grid. */
export const DATA_SOURCE_LOGOS: { name: string; svg: ReactNode }[] = [
  {
    name: "Google",
    svg: (
      <svg {...svgProps}>
        <path d="M21 12.5c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C20.8 18.9 21 15.86 21 12.5z" />
        <path d="M12 22c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    name: "Amazon",
    svg: (
      <svg {...svgProps}>
        <path d="M4.5 15.5C8 17.5 15 18 19.5 15.5" />
        <path d="M17.5 17c.5.5 1.5 1 2 1.5" />
        <path d="M6.5 7.5c0-2.5 2-4 5.5-4s5.5 1.5 5.5 4v5c0 2.5-2 4-5.5 4s-5.5-1.5-5.5-4v-5z" />
      </svg>
    ),
  },
  {
    name: "Reddit",
    svg: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="10" />
        <path d="M16.5 9.5c.5-.5 1-.5 1.5 0s.5 1.5-.5 2" />
        <path d="M7.5 9.5c-.5-.5-1-.5-1.5 0s-.5 1.5.5 2" />
        <circle cx="12" cy="7" r="1.5" />
        <path d="M12 7v2" />
        <path d="M9 13.5c0 1.7 1.3 3 3 3s3-1.3 3-3" />
        <circle cx="9.5" cy="12" r="1" />
        <circle cx="14.5" cy="12" r="1" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    svg: (
      <svg {...svgProps}>
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    ),
  },
  {
    name: "Meta",
    svg: (
      <svg {...svgProps}>
        <path d="M2 12.5c0-2.5 1.5-5 4-6.5s5.5-1.5 8 0 4 4 4 6.5-1.5 5-4 6.5-5.5 1.5-8 0-4-4-4-6.5z" />
        <path d="M8 12.5c0-1.5.5-3 1.5-4s2.5-1 3.5 0 1.5 2.5 1.5 4-.5 3-1.5 4-2.5 1-3.5 0-1.5-2.5-1.5-4z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    svg: (
      <svg {...svgProps}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M10 9l5 3-5 3V9z" />
      </svg>
    ),
  },
  {
    name: "Shopify",
    svg: (
      <svg {...svgProps}>
        <path d="M15.5 5.5c-.5-2-2-3.5-3.5-3.5-1 0-2 .5-2.5 1.5" />
        <path d="M17 6l-1 12H8L7 6" />
        <path d="M4 6h16" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="14" cy="20" r="1" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    svg: (
      <svg {...svgProps}>
        <path d="M12 2C8.5 2 6 4.5 6 8c0 3 2 6 4 6v2l3-3c2.5 0 5-2.2 5-5 0-3.5-2.5-6-6-6z" />
        <path d="M9 18l1-4" />
      </svg>
    ),
  },
  {
    name: "AliExpress",
    svg: (
      <svg {...svgProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        <path d="M8 8h8v8H8z" />
      </svg>
    ),
  },
  {
    name: "eBay",
    svg: (
      <svg {...svgProps}>
        <path d="M4 6l6-2 10 8-8 8L4 18V6z" />
        <circle cx="9" cy="9" r="1.5" />
      </svg>
    ),
  },
  {
    name: "Etsy",
    svg: (
      <svg {...svgProps}>
        <path d="M12 21s-7-4-10-8a5.5 5.5 0 0 1 9.5-4.5A5.5 5.5 0 0 1 22 13c-3 4-10 8-10 8z" />
      </svg>
    ),
  },
  {
    name: "Jungle Scout",
    svg: (
      <svg {...svgProps}>
        <path d="M6 19c9-5 11-14 11-17 0 7-3 14-11 17z" />
        <path d="M6 19V9c2 3 5 5 9 6" />
        <circle cx="17" cy="7" r="2" />
      </svg>
    ),
  },
];

/** Same seven logos as the original homepage partner row (order preserved). */
export const DATA_SOURCE_LOGOS_HERO = DATA_SOURCE_LOGOS.slice(0, 7);

/** Full partner row set for Resources: Google → … → Jungle Scout (same SVGs as homepage). */
export const DATA_SOURCE_LOGOS_RESOURCES = DATA_SOURCE_LOGOS;

/** One-line blurbs for Resources grid (gray, 12px). */
export const DATA_SOURCE_BLURBS: Record<string, string> = {
  Google: "Search trends, market size, and seasonality.",
  Amazon: "Reviews, pricing, and live demand signals.",
  Reddit: "Pain points, angles, and buyer psychology.",
  TikTok: "Viral trends, hooks, and engagement.",
  Meta: "Competitor ads, angles, and spend signals.",
  YouTube: "Reviews, demos, and sentiment.",
  Shopify: "Store signals and conversion benchmarks.",
  Pinterest: "Visual trends and seasonal demand.",
  AliExpress: "Supplier data and price benchmarks.",
  eBay: "Pricing history and demand cycles.",
  Etsy: "Niche trends and audience signals.",
  "Jungle Scout": "Sales estimates and keyword intel.",
};
