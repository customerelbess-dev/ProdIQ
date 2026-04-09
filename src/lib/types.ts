export type Verdict = "GO" | "NO-GO" | "TEST CAREFULLY";

export type Trend = "Growing" | "Stable" | "Declining";

export interface ProdIQReport {
  product_name: string;
  score: number;
  /** % chance of profitability in 60 days if launched with best untapped angle (15–92); not the same as score. */
  potential_success?: number;
  verdict: Verdict;
  verdict_reason: string;
  /** Overall confidence label from the analysis model (optional). */
  confidence?: string;
  score_breakdown: {
    demand: number;
    pain_point?: number;
    wow_factor?: number;
    emotion?: number;
    competition_angle?: number;
    profit_potential?: number;
    competition?: number;
    profit?: number;
    trend?: number;
    angle?: number;
    angle_potential?: number;
  };
  market: {
    size: string;
    trend: Trend;
    best_platforms: string[];
    seasonal: string;
    trend_reason?: string;
    price_range?: string;
  };
  competitors: Array<{
    name: string;
    weakness: string;
    price_range: string;
    url?: string;
    opportunity?: string;
  }>;
  psychology: {
    real_reason: string;
    pain_points: string[];
    emotional_triggers: string[];
    customer_language: string[];
    before_pain?: string;
    after_feeling?: string;
  };
  angles: Array<{
    name: string;
    message: string;
    hook: string;
    why_it_works: string;
    target_emotion?: string;
    platform?: string;
  }>;
  creative: {
    best_format: string;
    video_concepts: string[];
    visual_style: string;
    do_not_do?: string[];
  };
  summary: string;
  action_items?: string[];
}
