import type { ProdIQReport } from "./types";

export const EXAMPLE_REPORT: ProdIQReport = {
  product_name: "Ergonomic Desk Mat with Cable Channel",
  score: 72,
  verdict: "GO",
  verdict_reason:
    "Strong search demand and clear differentiation angle; margins are workable for DTC if you avoid race-to-bottom Amazon pricing.",
  score_breakdown: {
    demand: 20,
    competition: 14,
    profit: 15,
    trend: 12,
    angle: 16,
  },
  market: {
    size: "~$180M–$240M global desk accessories segment (subset of office ergonomics)",
    trend: "Growing",
    best_platforms: ["Amazon", "Shopify DTC", "TikTok Shop"],
    seasonal: "Back-to-school and January ‘new setup’ spikes; steady year-round for remote workers",
  },
  competitors: [
    {
      name: "Grovemade Desk Shelf + Mat bundles",
      weakness: "Premium price excludes budget buyers; long lead times on drops",
      price_range: "$120–$200",
    },
    {
      name: "Generic PU leather desk pads (top Amazon SKUs)",
      weakness: "Commodity look; no cable management story; heavy ad fatigue",
      price_range: "$18–$35",
    },
    {
      name: "Felt + minimalist mat brands (Instagram-native)",
      weakness: "Thin value prop; relies on aesthetics without utility hook",
      price_range: "$35–$70",
    },
  ],
  psychology: {
    real_reason:
      "Buyers aren’t paying for a mat—they’re buying a calmer, more ‘in control’ workspace that photographs well on camera.",
    pain_points: [
      "Cables snaking across the desk feel chaotic on video calls",
      "Coffee rings and scratches make a cheap desk look worse on Zoom",
      "‘Gamer’ RGB mats feel wrong for professional remote workers",
    ],
    emotional_triggers: [
      "Control & order",
      "Quiet confidence on camera",
      "Small upgrade, big identity shift (‘I have my life together’)",
    ],
    customer_language: [
      "Finally stopped fighting my charger cable every morning",
      "Looks expensive but wasn’t",
      "My desk actually looks like an office now",
    ],
  },
  angles: [
    {
      name: "The Zoom Frame",
      message: "What people see behind your laptop matters more than your chair.",
      hook: "POV: your desk is in every meeting—here’s the 10-second fix.",
      why_it_works: "Targets status anxiety and visibility, not ‘desk accessories’.",
    },
    {
      name: "Cable Chaos → Calm",
      message: "One routed channel replaces the mental load of micro-frustrations.",
      hook: "Stop adjusting your cable 6 times a day.",
      why_it_works: "Pain aggregation beats feature lists for cold traffic.",
    },
    {
      name: "Anti-Gamer Professional",
      message: "Premium utility without RGB teenage energy.",
      hook: "Not a gamer pad. A grown-up workspace upgrade.",
      why_it_works: "Identity exclusion creates instant tribe for a broad demo.",
    },
  ],
  creative: {
    best_format: "UGC + tight product demo hybrid (9:16)",
    video_concepts: [
      "Before/after cable mess in a single top-down transition",
      "‘Desk audit’ creator rates setup, slips mat in as the hero fix",
      "ASMR unroll + channel close-up with satisfying cable tuck",
    ],
    visual_style:
      "Warm neutrals, natural window light, shallow depth of field—avoid neon or stock-office clichés",
  },
  summary:
    "Position as a workspace-calming upgrade with a visible cable story; win on creative and landing clarity, not on being the cheapest pad.",
};
