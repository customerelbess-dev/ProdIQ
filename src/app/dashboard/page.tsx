/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ProdIqLogoImg } from "@/components/ProdIqLogoImg";
import { DashboardMarketPremium } from "@/components/dashboard/DashboardMarketPremium";
import { DashboardAdsIntelligence } from "@/components/dashboard/DashboardAdsIntelligence";
import { DashboardAnglesPanel } from "@/components/dashboard/DashboardAnglesPanel";
import { DashboardExecutionPanel } from "@/components/dashboard/DashboardExecutionPanel";
import {
  DashboardSettingsModal,
  type SettingsTabKey,
} from "@/components/dashboard/DashboardSettingsModal";
import AnimatedBackground from "@/components/AnimatedBackground";
import { CampaignsTab } from "@/components/dashboard/CampaignsTab";
import { SuppliersTab } from "@/components/dashboard/SuppliersTab";
import { AdvisorTab } from "@/components/dashboard/AdvisorTab";
import { AnglesTabMindMap } from "@/components/dashboard/AnglesTabMindMap";
import {
  fallbackPotentialSuccess,
  getSuccessRate,
  getVerdictBg,
  getVerdictBorder,
  getVerdictColor,
} from "@/lib/dashboard-helpers";
import { AnimatedBadge } from "@/components/LandingHeroClient";

const supabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

const BG = "#040406";
const PURPLE = "#6c47ff";
const LOCAL_ANALYSES_KEY = "prodiq_dashboard_analyses_v1";

const RESEARCH_STEP_LABELS = [
  "🔍 Identifying product details...",
  "📦 Searching Amazon reviews...",
  "💬 Analyzing Reddit discussions...",
  "📱 Finding TikTok viral content...",
  "🕵️ Mapping competitors...",
  "🎯 Extracting winning angles...",
  "📊 Calculating market size...",
  "✨ Building your report...",
] as const;

type AnalysisRow = {
  id: string;
  user_id?: string | null;
  product_name: string;
  product_image: string | null;
  score: number | null;
  potential_success?: number | null;
  verdict: string | null;
  status?: string | null;
  market_data?: { size?: string } | null;
  angles?: unknown[] | null;
  competitors?: unknown[] | null;
  full_report: Record<string, unknown> | null;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Module-level store so analysis survives client-side navigation
// ---------------------------------------------------------------------------
type AnalysisStore = {
  inFlight: boolean;
  identifiedProduct: Record<string, unknown> | null;
  steps: boolean[];
  payload: { report: Record<string, unknown>; identifiedProduct: Record<string, unknown> } | null;
  errMsg: string | null;
  stepCb: ((s: boolean[]) => void) | null;
  doneCb: (() => void) | null;
  intervalId: ReturnType<typeof setInterval> | null;
};
const ANALYSIS_STORE: AnalysisStore = {
  inFlight: false,
  identifiedProduct: null,
  steps: new Array(8).fill(false) as boolean[],
  payload: null,
  errMsg: null,
  stepCb: null,
  doneCb: null,
  intervalId: null,
};
function resetAnalysisStore() {
  ANALYSIS_STORE.inFlight = false;
  ANALYSIS_STORE.identifiedProduct = null;
  ANALYSIS_STORE.steps = new Array(8).fill(false);
  ANALYSIS_STORE.payload = null;
  ANALYSIS_STORE.errMsg = null;
  if (ANALYSIS_STORE.intervalId) { clearInterval(ANALYSIS_STORE.intervalId); ANALYSIS_STORE.intervalId = null; }
}
// ---------------------------------------------------------------------------

function normalizeReport(raw: Record<string, unknown>, productImage: string): Record<string, unknown> {
  const sb = (raw.score_breakdown ?? {}) as Record<string, number>;
  const legacyShape =
    sb.pain_point == null &&
    sb.wow_factor == null &&
    sb.emotion == null &&
    sb.angle_opportunity == null;
  const demand = sb.demand ?? 0;
  const pain = legacyShape ? (sb.profit ?? 0) : (sb.pain_point ?? 0);
  const wow = sb.wow_factor ?? sb.angle_potential ?? sb.angle ?? 0;
  const emotion = sb.emotion ?? sb.trend ?? 0;
  const angleOpp = sb.angle_opportunity ?? sb.competition ?? sb.competition_angle ?? 0;
  const profitMargin = legacyShape ? (sb.profit_potential ?? 0) : (typeof sb.profit === "number" ? sb.profit : sb.profit_potential ?? 0);
  return {
    ...raw,
    product_image: productImage || (raw.product_image as string) || "",
    potential_success:
      typeof raw.potential_success === "number" && Number.isFinite(raw.potential_success)
        ? raw.potential_success
        : undefined,
    score_breakdown: {
      demand,
      pain_point: pain,
      wow_factor: wow,
      emotion,
      angle_opportunity: angleOpp,
      profit_potential: profitMargin,
      profit: legacyShape ? pain : profitMargin,
      angle_potential: wow,
      trend: emotion,
      competition: angleOpp,
      competition_angle: angleOpp,
      angle: wow,
    },
  };
}

function stripBase64(dataUrlOrB64: string): string {
  const i = dataUrlOrB64.indexOf(",");
  return i >= 0 ? dataUrlOrB64.slice(i + 1).replace(/\s/g, "") : dataUrlOrB64.replace(/\s/g, "");
}

function mediaTypeFromDataUrl(dataUrl: string): string {
  const m = dataUrl.match(/^data:([^;]+);/i);
  return m?.[1]?.trim() || "image/jpeg";
}

function ShopifyGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="#96BF48" aria-hidden>
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.116-.192-.213-.192-.098 0-1.89-.038-1.89-.038s-1.254-1.215-1.389-1.35v-.019L15.337 23.98zm-2.99.021L13.726.506C13.707.21 13.478 0 13.176 0c-.019 0-3.332.659-3.332.659L5.45 22.418l6.897 1.582zM12 7.172s-.892-.241-1.979-.241c-1.6 0-1.679.997-1.679 1.255 0 1.371 3.578 1.893 3.578 5.109 0 2.524-1.601 4.151-3.757 4.151-2.584 0-3.9-1.602-3.9-1.602l.69-2.28s1.358 1.163 2.504 1.163c.748 0 1.052-.586 1.052-1.014 0-1.774-2.935-1.851-2.935-4.8 0-2.466 1.774-4.858 5.352-4.858 1.372 0 2.072.397 2.072.397L12 7.172z" />
    </svg>
  );
}

function competitorAvgOrder(priceStr: unknown, avgFromApi: unknown): string {
  if (typeof avgFromApi === "string" && avgFromApi.trim()) return avgFromApi;
  const s = String(priceStr ?? "");
  const nums = s.match(/[\d.]+/g)?.map((x) => parseFloat(x)).filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (nums.length === 0) return "$52";
  const base = nums.reduce((a, b) => a + b, 0) / nums.length;
  return `$${Math.round(base * 1.3)}`;
}

function estMonthlyKNum(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 20 + (h % 80);
}

function domainForFavicon(website: string): string {
  const s = String(website ?? "").trim();
  if (!s) return "example.com";
  try {
    const u = /^https?:\/\//i.test(s) ? new URL(s) : new URL(`https://${s}`);
    return u.hostname.replace(/^www\./, "") || "example.com";
  } catch {
    const stripped = s.replace(/^https?:\/\//i, "").split("/")[0] ?? "";
    return stripped.replace(/^www\./, "") || "example.com";
  }
}

const TABS = [
  { id: "market", label: "Market Analysis" },
  { id: "angles", label: "Angles & Ads" },
  { id: "launch", label: "Launch" },
  { id: "advisor", label: "AI Advisor" },
  { id: "discover", label: "Suppliers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SubTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "#6c47ff" : "#111",
        border: `1px solid ${active ? "#6c47ff" : "#1a1a1a"}`,
        borderRadius: "10px",
        padding: "10px 20px",
        color: active ? "white" : "#555",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.2s",
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [ready, setReady] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Usage limiting
  const [userPlan, setUserPlan] = useState<"free" | "starter" | "pro" | "agency" | "enterprise">("free");
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabKey>("account");

  const [activeTab, setActiveTab] = useState<TabId>("market");
  const [selectedProduct, setSelectedProduct] = useState<AnalysisRow | null>(null);
  const [launchSubTab, setLaunchSubTab] = useState<"execution" | "campaigns">("execution");
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [startNewUpload, setStartNewUpload] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [idImageFailed, setIdImageFailed] = useState(false);

  const [identifiedProduct, setIdentifiedProduct] = useState<Record<string, unknown> | null>(null);
  const [analysisReport, setAnalysisReport] = useState<Record<string, unknown> | null>(null);
  const [researchSteps, setResearchSteps] = useState<boolean[]>(() => new Array(8).fill(false));
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [revenueFilter, setRevenueFilter] = useState("90");
  const [selectedCompetitor, setSelectedCompetitor] = useState<Record<string, unknown> | null>(null);
  const [competitorAdsMap, setCompetitorAdsMap] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loadingCompAds, setLoadingCompAds] = useState("");
  const [showAllAdsFor, setShowAllAdsFor] = useState("");
  const [compDetailFaviconOk, setCompDetailFaviconOk] = useState(true);

  const [realAds, setRealAds] = useState<Record<string, unknown>[]>([]);
  const [competitorAngles, setCompetitorAngles] = useState<Record<string, unknown>[]>([]);
  const [untappedAnglesFromAds, setUntappedAnglesFromAds] = useState<Record<string, unknown>[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsMarketInsight, setAdsMarketInsight] = useState("");
  const adsFetchedForProductRef = useRef<string | null>(null);
  const adsInFlightRef = useRef(false);

  const researchTickers = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearResearchTickers = useCallback(() => {
    researchTickers.current.forEach(clearInterval);
    researchTickers.current = [];
  }, []);

  const fetchAnalyses = useCallback(async () => {
    if (!supabaseConfigured) {
      try {
        const raw = localStorage.getItem(LOCAL_ANALYSES_KEY);
        if (raw) setAnalyses(JSON.parse(raw) as AnalysisRow[]);
      } catch { /* ignore */ }
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log("No session — clearing analyses");
        setAnalyses([]);
        return;
      }
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Fetch analyses error:", error);
        setAnalyses([]);
        return;
      }
      console.log(`Fetched ${data?.length ?? 0} analyses for user ${session.user.id}`);
      setAnalyses((data as AnalysisRow[]) ?? []);
    } catch (err) {
      console.error("fetchAnalyses error:", err);
      setAnalyses([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabaseConfigured) {
        setUser(null);
        setAuthChecked(true);
        setReady(true);
        try {
          const raw = localStorage.getItem(LOCAL_ANALYSES_KEY);
          if (raw) setAnalyses(JSON.parse(raw) as AnalysisRow[]);
        } catch { /* ignore */ }
        setInitialLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setAuthChecked(true);
      setReady(true);

      // Fetch plan and analyses in parallel
      const [analysesResult, profileResult] = await Promise.all([
        supabase
          .from("analyses")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);

      // Set plan
      const fetchedPlan = (profileResult.data?.plan as string) || "free";
      setUserPlan(fetchedPlan as "free" | "starter" | "pro" | "agency");

      const { data, error } = analysesResult;

      if (error) {
        console.error("Fetch error:", error);
      } else {
        console.log("Loaded analyses:", data?.length);
        const rows = (data ?? []) as AnalysisRow[];
        setAnalyses(rows);

        // Restore last active tab and selected product from localStorage
        try {
          const savedTab = localStorage.getItem("prodiq_active_tab") as TabId | null;
          const savedProductId = localStorage.getItem("prodiq_selected_product");
          if (savedTab && TABS.some((t) => t.id === savedTab)) {
            setActiveTab(savedTab);
          }
          if (savedProductId && rows.length > 0) {
            const savedProduct = rows.find((a) => a.id === savedProductId);
            if (savedProduct) {
              setSelectedProduct(savedProduct);
              const fr = (savedProduct.full_report ?? {}) as Record<string, unknown>;
              setAnalysisReport(fr);
              const savedAds = (fr.saved_ads ?? fr.cached_ads) as Record<string, unknown>[] | undefined;
              if (Array.isArray(savedAds) && savedAds.length > 0) {
                setRealAds(savedAds);
                setCompetitorAngles(((fr.saved_competitor_angles ?? fr.cached_competitor_angles) ?? []) as Record<string, unknown>[]);
                setUntappedAnglesFromAds(((fr.saved_untapped_angles ?? fr.cached_untapped_angles) ?? []) as Record<string, unknown>[]);
                setAdsMarketInsight(String(fr.saved_market_insight ?? fr.cached_ads_market_insight ?? ""));
              }
            }
          }
        } catch { /* ignore */ }
      }

      setInitialLoading(false);
    };

    void init();

    if (!supabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setAnalyses([]);
        setSelectedProduct(null);
        setAnalysisReport(null);
        setUser(null);
        setAuthChecked(false);
        setReady(false);
        setCurrentStep(0);
        setIdentifiedProduct(null);
        setRealAds([]);
        setCompetitorAngles([]);
        setUntappedAnglesFromAds([]);
        router.replace("/login");
      } else if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setAuthChecked(true);
        setReady(true);
        setAnalyses([]);
        setSelectedProduct(null);
        setAnalysisReport(null);
        setRealAds([]);
        void fetchAnalyses();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, fetchAnalyses]);

  // Persist active tab to localStorage
  useEffect(() => {
    if (authChecked && activeTab) {
      localStorage.setItem("prodiq_active_tab", activeTab);
    }
  }, [activeTab, authChecked]);

  // Persist selected product id to localStorage
  useEffect(() => {
    if (selectedProduct?.id) {
      localStorage.setItem("prodiq_selected_product", selectedProduct.id);
    }
  }, [selectedProduct]);

  // Re-sync active tab when user switches back to this browser tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const savedTab = localStorage.getItem("prodiq_active_tab") as TabId | null;
        if (savedTab && TABS.some((t) => t.id === savedTab)) {
          setActiveTab(savedTab);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Restore / subscribe to any analysis that survived navigation
  useEffect(() => {
    // Register step updates so the interval (running in background) can drive UI
    ANALYSIS_STORE.stepCb = (s) => setResearchSteps([...s]);

    if (ANALYSIS_STORE.inFlight && ANALYSIS_STORE.identifiedProduct) {
      // Analysis is still running — restore the loading UI
      setIdentifiedProduct(ANALYSIS_STORE.identifiedProduct);
      setResearchSteps([...ANALYSIS_STORE.steps]);
      setCurrentStep(2);
      setBusy(true);
      setStartNewUpload(false);
    } else if (ANALYSIS_STORE.payload) {
      // Analysis finished while we were away — apply result now
      ANALYSIS_STORE.doneCb?.();
    } else if (ANALYSIS_STORE.errMsg) {
      setErrorMsg(ANALYSIS_STORE.errMsg);
      setCurrentStep(1);
      resetAnalysisStore();
    }

    // Register done callback so the running fetch can notify us when it finishes
    ANALYSIS_STORE.doneCb = () => {
      if (ANALYSIS_STORE.errMsg) {
        setErrorMsg(ANALYSIS_STORE.errMsg);
        setCurrentStep(1);
        resetAnalysisStore();
      }
      // If payload is set, handleConfirmProduct's own state-setters will fire
      // (they were still registered in the closure — React setters are stable across remounts).
      // Nothing extra needed here; the store is cleared at the end of handleConfirmProduct.
    };

    // Warn before closing tab while analysis is running
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (ANALYSIS_STORE.inFlight) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      ANALYSIS_STORE.stepCb = null;
      ANALYSIS_STORE.doneCb = null;
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedProduct?.full_report) {
      setAnalysisReport(selectedProduct.full_report);
    }
  }, [selectedProduct]);

  useEffect(() => {
    setSelectedCompetitor(null);
  }, [selectedProduct?.id, activeTab]);

  useEffect(() => {
    setCompetitorAdsMap({});
    setShowAllAdsFor("");
  }, [selectedProduct?.id]);

  useEffect(() => {
    setCompDetailFaviconOk(true);
  }, [selectedCompetitor?.name]);

  useEffect(() => {
    adsFetchedForProductRef.current = null;
    adsInFlightRef.current = false;
    // Restore saved ads immediately when product changes (avoid re-fetching)
    const fr = (selectedProduct?.full_report ?? {}) as Record<string, unknown>;
    const savedAds = (fr.saved_ads ?? fr.cached_ads) as Record<string, unknown>[] | undefined;
    if (Array.isArray(savedAds) && savedAds.length > 0) {
      setRealAds(savedAds);
      setCompetitorAngles(((fr.saved_competitor_angles ?? fr.cached_competitor_angles) ?? []) as Record<string, unknown>[]);
      setUntappedAnglesFromAds(((fr.saved_untapped_angles ?? fr.cached_untapped_angles) ?? []) as Record<string, unknown>[]);
      setAdsMarketInsight(String(fr.saved_market_insight ?? fr.cached_ads_market_insight ?? ""));
      adsFetchedForProductRef.current = selectedProduct?.id ?? null;
    } else {
      setRealAds([]);
      setCompetitorAngles([]);
      setUntappedAnglesFromAds([]);
      setAdsMarketInsight("");
    }
  }, [selectedProduct?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRealAds = useCallback(async () => {
    const comps = analysisReport?.competitors;
    if (!Array.isArray(comps) || comps.length === 0 || !selectedProduct) return;
    if (adsFetchedForProductRef.current === selectedProduct.id) return;
    if (adsInFlightRef.current) return;

    // STEP 1: Query Supabase fresh for the latest full_report (may have ads saved since last load)
    if (supabaseConfigured) {
      const { data: existing } = await supabase
        .from("analyses")
        .select("full_report")
        .eq("id", selectedProduct.id)
        .single();
      const fr = (existing?.full_report ?? {}) as Record<string, unknown>;
      // Support both new (saved_ads) and legacy (cached_ads) field names
      const savedAds = (fr.saved_ads ?? fr.cached_ads) as Record<string, unknown>[] | undefined;
      if (Array.isArray(savedAds) && savedAds.length > 0) {
        console.log("Loading saved ads from Supabase:", savedAds.length);
        setRealAds(savedAds);
        setCompetitorAngles(((fr.saved_competitor_angles ?? fr.cached_competitor_angles) ?? []) as Record<string, unknown>[]);
        setUntappedAnglesFromAds(((fr.saved_untapped_angles ?? fr.cached_untapped_angles) ?? []) as Record<string, unknown>[]);
        setAdsMarketInsight(String(fr.saved_market_insight ?? fr.cached_ads_market_insight ?? ""));
        adsFetchedForProductRef.current = selectedProduct.id;
        return;
      }
    } else {
      // No Supabase — check in-memory full_report
      const fr = (selectedProduct.full_report ?? {}) as Record<string, unknown>;
      const savedAds = (fr.saved_ads ?? fr.cached_ads) as Record<string, unknown>[] | undefined;
      if (Array.isArray(savedAds) && savedAds.length > 0) {
        setRealAds(savedAds);
        setCompetitorAngles(((fr.saved_competitor_angles ?? fr.cached_competitor_angles) ?? []) as Record<string, unknown>[]);
        setUntappedAnglesFromAds(((fr.saved_untapped_angles ?? fr.cached_untapped_angles) ?? []) as Record<string, unknown>[]);
        setAdsMarketInsight(String(fr.saved_market_insight ?? fr.cached_ads_market_insight ?? ""));
        adsFetchedForProductRef.current = selectedProduct.id;
        return;
      }
    }

    // STEP 2: Not saved yet — fetch from API
    adsInFlightRef.current = true;
    setAdsLoading(true);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitors: comps,
          product_name: analysisReport?.product_name || selectedProduct.product_name,
          // Pass the confirmed product image as visual reference for the gatekeeper
          product_image: selectedProduct.product_image || "",
        }),
      });
      const data = (await res.json()) as {
        ads?: Record<string, unknown>[];
        competitor_angles?: Record<string, unknown>[];
        untapped_angles?: Record<string, unknown>[];
        market_insight?: string;
      };
      const fetchedAds = data.ads ?? [];
      const fetchedAngles = data.competitor_angles ?? [];
      const fetchedUntapped = data.untapped_angles ?? [];
      const fetchedInsight = data.market_insight ?? "";

      setRealAds(fetchedAds);
      setCompetitorAngles(fetchedAngles);
      setUntappedAnglesFromAds(fetchedUntapped);
      setAdsMarketInsight(fetchedInsight);
      adsFetchedForProductRef.current = selectedProduct.id;

      // STEP 3: Persist to Supabase so next visit loads instantly
      if (supabaseConfigured && fetchedAds.length > 0) {
        const newFr = {
          ...(selectedProduct.full_report ?? {}),
          saved_ads: fetchedAds,
          saved_competitor_angles: fetchedAngles,
          saved_untapped_angles: fetchedUntapped,
          saved_market_insight: fetchedInsight,
        };
        const { error } = await supabase.from("analyses").update({ full_report: newFr }).eq("id", selectedProduct.id);
        if (error) {
          console.error("Failed to save ads:", error);
        } else {
          console.log("Ads saved to Supabase for instant loading next time");
          setSelectedProduct((p) => (p ? { ...p, full_report: newFr } : p));
          setAnalyses((prev) => prev.map((a) => (a.id === selectedProduct.id ? { ...a, full_report: newFr } : a)));
        }
      }
    } catch (err) {
      console.error("Failed to fetch ads:", err);
      adsFetchedForProductRef.current = null;
    } finally {
      adsInFlightRef.current = false;
      setAdsLoading(false);
    }
  }, [analysisReport, selectedProduct]);

  const fetchCompetitorAds = useCallback(
    async (competitor: Record<string, unknown>) => {
      if (!selectedProduct?.id) return;
      const name = String(competitor.name ?? "").trim();
      if (!name) return;
      // Already in memory — skip
      if (competitorAdsMap[name]?.length ?? 0 > 0) return;

      // Check Supabase cache first (fresh query so we pick up saves from other sessions)
      if (supabaseConfigured) {
        const { data: existing } = await supabase
          .from("analyses")
          .select("full_report")
          .eq("id", selectedProduct.id)
          .single();
        const fr = (existing?.full_report ?? {}) as Record<string, unknown>;
        // Support both new (competitor_ads_cache) and legacy (cached_competitor_ads_map) field names
        const cache = ((fr.competitor_ads_cache ?? fr.cached_competitor_ads_map) ?? {}) as Record<string, Record<string, unknown>[]>;
        if (Array.isArray(cache[name]) && (cache[name]?.length ?? 0) > 0) {
          console.log("Loading cached competitor ads for:", name);
          setCompetitorAdsMap((prev) => ({ ...prev, [name]: cache[name]! }));
          return;
        }
      }

      // Fetch from API
      setLoadingCompAds(name);
      try {
        const res = await fetch("/api/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            competitors: [competitor],
            product_name: String(analysisReport?.product_name ?? selectedProduct?.product_name ?? ""),
          }),
        });
        const data = (await res.json()) as { ads?: Record<string, unknown>[] };
        const fetchedAds = data.ads ?? [];
        setCompetitorAdsMap((prev) => ({ ...prev, [name]: fetchedAds }));

        // Save to Supabase
        if (supabaseConfigured && fetchedAds.length > 0) {
          // Re-fetch latest full_report to avoid clobbering other cached data
          const { data: latest } = await supabase.from("analyses").select("full_report").eq("id", selectedProduct.id).single();
          const latestFr = (latest?.full_report ?? selectedProduct.full_report ?? {}) as Record<string, unknown>;
          const existingCache = ((latestFr.competitor_ads_cache ?? latestFr.cached_competitor_ads_map) ?? {}) as Record<string, unknown>;
          const newFr = {
            ...latestFr,
            competitor_ads_cache: { ...existingCache, [name]: fetchedAds },
          };
          await supabase.from("analyses").update({ full_report: newFr }).eq("id", selectedProduct.id);
          console.log("Saved competitor ads for:", name);
          setSelectedProduct((p) => (p ? { ...p, full_report: newFr } : p));
          setAnalyses((prev) => prev.map((a) => (a.id === selectedProduct.id ? { ...a, full_report: newFr } : a)));
        }
      } catch (err) {
        console.error("Competitor ads error:", err);
      } finally {
        setLoadingCompAds("");
      }
    },
    [competitorAdsMap, analysisReport?.product_name, selectedProduct],
  );

  useEffect(() => {
    if (!selectedProduct || !analysisReport) return;
    if (activeTab !== "angles" && activeTab !== "market") return;
    const comps = analysisReport.competitors;
    if (!Array.isArray(comps) || comps.length === 0) return;
    // fetchRealAds checks cache first — safe to always call
    void fetchRealAds();
  }, [activeTab, selectedProduct?.id, analysisReport, fetchRealAds]);

  function persistLocal(rows: AnalysisRow[]) {
    try {
      localStorage.setItem(LOCAL_ANALYSES_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }

  const handleCompetitorClick = (comp: Record<string, unknown>) => {
    const isSame = selectedCompetitor != null && String(selectedCompetitor.name ?? "") === String(comp.name ?? "");
    if (isSame) {
      setSelectedCompetitor(null);
    } else {
      setSelectedCompetitor(comp);
      setCompDetailFaviconOk(true);
      void fetchCompetitorAds(comp);
    }
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setCurrentStep(0);
    setActiveTab("market");
    setIdentifiedProduct(null);
    setAnalysisReport(null);
    setUploadFile(null);
    setUploadUrl("");
    setUploadText("");
    setErrorMsg(null);
    setStartNewUpload(true);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleProductSelect = (analysis: AnalysisRow, tab?: TabId) => {
    setSelectedProduct(analysis);
    const report = (analysis.full_report ?? {}) as Record<string, unknown>;
    setAnalysisReport(report);

    // Restore saved ads immediately — supports both new and legacy field names
    const savedAds = (report.saved_ads ?? report.cached_ads) as Record<string, unknown>[] | undefined;
    if (Array.isArray(savedAds) && savedAds.length > 0) {
      setRealAds(savedAds);
      setCompetitorAngles(((report.saved_competitor_angles ?? report.cached_competitor_angles) ?? []) as Record<string, unknown>[]);
      setUntappedAnglesFromAds(((report.saved_untapped_angles ?? report.cached_untapped_angles) ?? []) as Record<string, unknown>[]);
      setAdsMarketInsight(String(report.saved_market_insight ?? report.cached_ads_market_insight ?? ""));
    } else {
      setRealAds([]);
      setCompetitorAngles([]);
      setUntappedAnglesFromAds([]);
      setAdsMarketInsight("");
    }

    if (tab) setActiveTab(tab as TabId);
  };

  function renderAnalysisHorizontalRow(analysis: AnalysisRow, persistTab: TabId) {
    const fr = analysis.full_report as Record<string, unknown> | null;
    const score = Number(analysis.score ?? fr?.score ?? 0);
    const psRaw =
      (typeof fr?.potential_success === "number" && Number.isFinite(fr.potential_success) ? fr.potential_success : null) ??
      (typeof analysis.potential_success === "number" && Number.isFinite(analysis.potential_success)
        ? analysis.potential_success
        : null);
    const successDisplay =
      psRaw != null
        ? `${psRaw}`
        : score
          ? `${fallbackPotentialSuccess(analysis.id, score)}`
          : "--";
    const vStr = String(analysis.verdict ?? "");
    const mkt = (analysis.market_data ?? fr?.market) as { size?: string } | undefined;
    const angles = (analysis.angles ?? fr?.angles) as { type?: string }[] | undefined;
    const comps = (analysis.competitors ?? fr?.competitors) as unknown[] | undefined;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleProductSelect(analysis, persistTab)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleProductSelect(analysis, persistTab);
          }
        }}
        style={{
          background: "#0c0c14",
          borderRadius: 14,
          border: "1px solid rgba(108,71,255,0.12)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          transition: "all 0.2s",
          marginBottom: 10,
          flexWrap: "wrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6c47ff";
          e.currentTarget.style.background = "#0e0e1a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(108,71,255,0.12)";
          e.currentTarget.style.background = "#0c0c14";
        }}
      >
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <div style={{ textAlign: "center", background: "#111", borderRadius: "8px", padding: "8px 14px", minWidth: "64px" }}>
            <div
              style={{
                color: "#555",
                fontSize: "8px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                marginBottom: "3px",
              }}
            >
              SCORE
            </div>
            <div style={{ color: "#6c47ff", fontWeight: 900, fontSize: "20px", lineHeight: 1 }}>{score}</div>
          </div>
          <div style={{ textAlign: "center", background: "#111", borderRadius: "8px", padding: "8px 14px", minWidth: "64px" }}>
            <div
              style={{
                color: "#555",
                fontSize: "8px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                marginBottom: "3px",
              }}
            >
              SUCCESS
            </div>
            <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: "20px", lineHeight: 1 }}>
              {successDisplay === "--" ? "--" : `${successDisplay}%`}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{analysis.product_name}</span>
            <span
              style={{
                background: getVerdictBg(vStr),
                color: getVerdictColor(vStr),
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 10px",
                borderRadius: 20,
              }}
            >
              {analysis.verdict}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ color: "#555", fontSize: 12 }}>📊 {mkt?.size ?? "--"}</span>
            <span style={{ color: "#555", fontSize: 12 }}>🕵️ {comps?.length ?? 0} competitors</span>
            <span style={{ color: "#555", fontSize: 12 }}>
              🎯 {angles?.filter((a) => a.type === "UNTAPPED").length ?? 0} untapped angles
            </span>
            <span style={{ color: "#555", fontSize: 12 }}>
              📅 {new Date(analysis.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ color: "#333", fontSize: 18, flexShrink: 0 }}>→</div>
      </div>
    );
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadFile(f);
    setIdImageFailed(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  const canSubmit =
    Boolean(uploadFile || imagePreview || uploadUrl.trim() || uploadText.trim()) && !busy;

  async function handleUpload() {
    if (!uploadFile && !imagePreview && !uploadUrl.trim() && !uploadText.trim()) return;
    setErrorMsg(null);
    setIdentifiedProduct(null);
    setIdImageFailed(false);
    setCurrentStep(1);
    setBusy(true);

    try {
      let imageBase64 = "";
      let mediaType = "image/jpeg";

      if (uploadFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            const base64 = result.includes(",") ? result.split(",")[1] ?? "" : stripBase64(result);
            mediaType = uploadFile.type || "image/jpeg";
            resolve(base64);
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(uploadFile);
        });
      } else if (imagePreview) {
        imageBase64 = stripBase64(imagePreview);
        mediaType = mediaTypeFromDataUrl(imagePreview);
      }

      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64 || undefined,
          url: uploadUrl.trim() || undefined,
          text: uploadText.trim() || undefined,
          mediaType,
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;
      console.log("Identified product:", data);

      if (!res.ok || data.error || !String(data.product_name ?? "").trim()) {
        setErrorMsg(
          String(data.error ?? "Could not identify this product. Please try again with a clearer image or more details."),
        );
        setCurrentStep(0);
        return;
      }

      setIdImageFailed(false);
      setIdentifiedProduct(data);
      setCurrentStep(1);
    } catch (err: unknown) {
      console.error("Upload error:", err);
      setErrorMsg("Something went wrong. Please try again.");
      setCurrentStep(0);
    } finally {
      setBusy(false);
    }
  }

  const handleLogout = async () => {
    setAnalyses([]);
    setSelectedProduct(null);
    setAnalysisReport(null);
    setUser(null);
    setRealAds([]);
    setCurrentStep(0);
    setIdentifiedProduct(null);
    setAuthChecked(false);
    setReady(false);
    setCompetitorAngles([]);
    setUntappedAnglesFromAds([]);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const subscribeToPlan = async (planKey: string) => {
    const priceIds: Record<string, string> = {
      starter:    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER    ?? "",
      pro:        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO        ?? "",
      enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "",
    };
    const priceId = priceIds[planKey];
    if (!priceId) { router.push("/pricing"); return; }
    setSubscribingPlan(planKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token ?? "";
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId }),
      });
      const json = (await res.json()) as { url?: string };
      if (json.url) { window.location.href = json.url; } else { router.push("/pricing"); }
    } catch {
      setSubscribingPlan(null);
      router.push("/pricing");
    }
  };

  async function handleConfirmProduct() {
    if (!identifiedProduct) return;
    setErrorMsg(null);
    setBusy(true);
    setCurrentStep(2);
    setResearchSteps(new Array(8).fill(false));
    setElapsed(0);
    const t0 = performance.now();

    // Initialise store so navigation away doesn't kill the analysis
    ANALYSIS_STORE.inFlight = true;
    ANALYSIS_STORE.identifiedProduct = identifiedProduct;
    ANALYSIS_STORE.steps = new Array(8).fill(false);
    ANALYSIS_STORE.payload = null;
    ANALYSIS_STORE.errMsg = null;

    const tick = setInterval(() => {
      const i = ANALYSIS_STORE.steps.findIndex((x) => !x);
      // Stop auto-ticking at step 6 — last 2 steps complete only when analysis finishes
      if (i !== -1 && i < 6) {
        const n = [...ANALYSIS_STORE.steps];
        n[i] = true;
        ANALYSIS_STORE.steps = n;
        ANALYSIS_STORE.stepCb?.(n);
      }
    }, 3500);
    ANALYSIS_STORE.intervalId = tick;
    researchTickers.current.push(tick);

    try {
      const idJson = identifiedProduct;
      const product_name = String(idJson.product_name ?? "").trim();
      const search_query = String(idJson.search_query ?? product_name).trim();
      if (!product_name) throw new Error("Could not identify product name");

      const asin = String(idJson.asin ?? "").trim();

      // ── Client-side pre-check (instant UX feedback before hitting the API) ──
      const isPaidPlan = ["starter", "pro", "agency", "enterprise"].includes(userPlan);
      if (!isPaidPlan && analyses.length >= 1) {
        clearResearchTickers();
        setBusy(false);
        setCurrentStep(1);
        router.push("/pricing");
        return;
      }

      // Pass auth token so server can enforce the limit server-side
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? "";

      const anRes = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          product_name,
          search_query,
          ...(asin ? { asin } : {}),
        }),
      });

      // ── Handle server-side limit rejection ─────────────────────────────────
      if (anRes.status === 402) {
        clearResearchTickers();
        ANALYSIS_STORE.inFlight = false;
        setBusy(false);
        setCurrentStep(1);
        router.push("/pricing");
        return;
      }

      const anJson = (await anRes.json()) as Record<string, unknown>;
      const reportOk =
        anRes.ok &&
        anJson.success !== false &&
        anJson.report != null &&
        typeof anJson.report === "object";
      if (!reportOk) {
        const errMsg = String(anJson.error ?? "Analysis failed");
        console.error("Analysis failed:", errMsg);
        clearResearchTickers();
        setResearchSteps(new Array(8).fill(false));
        setErrorMsg(errMsg);
        setCurrentStep(1);
        return;
      }
      const reportRaw = anJson.report as Record<string, unknown>;
      const img = String(idJson.product_image ?? "") || "/massager.jpg";
      const report = normalizeReport(reportRaw, img);

      clearResearchTickers();
      ANALYSIS_STORE.steps = new Array(8).fill(true);
      ANALYSIS_STORE.stepCb?.(ANALYSIS_STORE.steps);
      setResearchSteps(new Array(8).fill(true));
      setElapsed((performance.now() - t0) / 1000);

      // Save to store so remounted component can apply the result
      ANALYSIS_STORE.payload = { report, identifiedProduct: idJson };
      ANALYSIS_STORE.inFlight = false;

      const saveAnalysis = async (rep: Record<string, unknown>, identified: Record<string, unknown>) => {
        try {
          const { data: authData, error: authError } = await supabase.auth.getSession();
          if (authError || !authData.session) {
            console.error("No auth session:", authError);
            return null;
          }
          const userId = authData.session.user.id;
          console.log("Saving for user:", userId);
          console.log("Product:", identified.product_name);
          const { data: saved, error } = await supabase
            .from("analyses")
            .insert({
              user_id: userId,
              product_name: String(identified.product_name ?? "Unknown Product"),
              product_image: String(identified.product_image ?? ""),
              input_type: uploadFile ? "image" : uploadUrl ? "url" : "text",
              raw_input: String(uploadText || uploadUrl || identified.product_name || ""),
              score: Number(rep.score) || 0,
              verdict: String(rep.verdict ?? "TEST CAREFULLY"),
              market_data: (rep.market as object) ?? {},
              angles: Array.isArray(rep.angles) ? rep.angles : [],
              competitors: Array.isArray(rep.competitors) ? rep.competitors : [],
              full_report: rep,
              status: "complete",
            })
            .select()
            .single();
          if (error) {
            console.error("Save error code:", error.code);
            console.error("Save error message:", error.message);
            console.error("Save error details:", error.details);
            return null;
          }
          console.log("Saved successfully with ID:", (saved as AnalysisRow)?.id);
          return saved as AnalysisRow;
        } catch (err: unknown) {
          console.error("Save exception:", err instanceof Error ? err.message : err);
          return null;
        }
      };

      if (supabaseConfigured) {
        const saved = await saveAnalysis(report, idJson);
        if (saved) {
          setAnalyses((prev) => [saved, ...prev]);
          setSelectedProduct(saved);
          const fr = saved.full_report as Record<string, unknown> | null;
          setAnalysisReport(fr ?? { ...report });
        } else {
          // Still show the report even if save failed — store locally
          const row: AnalysisRow = {
            id: crypto.randomUUID(),
            product_name,
            product_image: img,
            score: typeof report.score === "number" ? report.score : null,
            verdict: String(report.verdict ?? ""),
            status: "complete",
            market_data: report.market as object,
            angles: report.angles as unknown[],
            competitors: report.competitors as unknown[],
            full_report: { ...report },
            created_at: new Date().toISOString(),
          };
          setAnalyses((p) => { const n = [row, ...p]; persistLocal(n); return n; });
          setSelectedProduct(row);
          setAnalysisReport({ ...report });
          console.warn("Analysis completed but could not be saved to Supabase");
        }
      } else {
        const row: AnalysisRow = {
          id: crypto.randomUUID(),
          product_name,
          product_image: img,
          score: typeof report.score === "number" ? report.score : null,
          verdict: String(report.verdict ?? ""),
          status: "complete",
          market_data: report.market as object,
          angles: report.angles as unknown[],
          competitors: report.competitors as unknown[],
          full_report: { ...report },
          created_at: new Date().toISOString(),
        };
        setAnalyses((p) => { const n = [row, ...p]; persistLocal(n); return n; });
        setSelectedProduct(row);
        setAnalysisReport({ ...report });
      }

      setCurrentStep(0);
      setStartNewUpload(false);
      setActiveTab("market");
      setUploadUrl("");
      setUploadText("");
      setUploadFile(null);
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setIdentifiedProduct(null);
      resetAnalysisStore();

      // Show upgrade wall immediately after their one free analysis finishes
      if (anJson.free_limit_reached === true) {
        setTimeout(() => setShowUpgradeWall(true), 700);
      }
    } catch (e: unknown) {
      clearResearchTickers();
      ANALYSIS_STORE.inFlight = false;
      ANALYSIS_STORE.errMsg = e instanceof Error ? e.message : "Something went wrong";
      ANALYSIS_STORE.doneCb?.();
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setCurrentStep(1);
      setResearchSteps(new Array(8).fill(false));
    } finally {
      clearResearchTickers();
      ANALYSIS_STORE.intervalId = null;
      setBusy(false);
    }
  }

  const report = analysisReport;

  // Show futuristic loading screen until auth + analyses are resolved
  if (!authChecked || initialLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#040406", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px" }}>
        <style>{`
          @keyframes prodiq-spin { to { transform: rotate(360deg); } }
          @keyframes prodiq-pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        `}</style>
        <div style={{ position: "relative", width: 64, height: 64 }}>
          <div style={{ position: "absolute", inset: -4, borderRadius: 20, background: "conic-gradient(from 0deg, transparent, #6c47ff, transparent)", animation: "prodiq-spin 1.5s linear infinite", zIndex: 0 }} />
          <div style={{ position: "relative", zIndex: 1, width: 64, height: 64, borderRadius: 16, background: "#0c0c14", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <ProdIqLogoImg preset="tab" />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
            Prod<span style={{ color: "#6c47ff" }}>IQ</span>
          </div>
          <div style={{ color: "#444", fontSize: 13 }}>Loading your workspace...</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6c47ff", animation: `prodiq-pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  function formatRevenue(value: string | number | undefined | null): string {
    if (value == null || value === "") return "--";
    const str = String(value);
    const num = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return str;
    if (num >= 1_000_000) return "$" + (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return "$" + Math.round(num / 1_000) + "k";
    return "$" + Math.round(num);
  }

  function renderSelectProductPrompt(forTab: TabId) {
    return (
      <div>
        <div
          style={{
            background: "rgba(108,71,255,0.08)",
            border: "1px solid rgba(108,71,255,0.2)",
            borderRadius: 12,
            padding: "14px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ color: "#a78bfa", fontSize: "14px", fontWeight: 500 }}>
            👇 Select a product below to view {forTab.charAt(0).toUpperCase() + forTab.slice(1)}
          </span>
        </div>
        <div>
          {analyses.map((analysis) => (
            <Fragment key={analysis.id}>{renderAnalysisHorizontalRow(analysis, forTab)}</Fragment>
          ))}
        </div>
      </div>
    );
  }

  function renderProductContextBanner() {
    if (!selectedProduct) return null;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "24px",
          padding: "10px 14px",
          background: "rgba(108,71,255,0.06)",
          border: "1px solid rgba(108,71,255,0.15)",
          borderRadius: "10px",
          flexWrap: "wrap",
        }}
      >
        <img
          src={selectedProduct.product_image || "/massager.jpg"}
          alt={selectedProduct.product_name}
          style={{ width: "28px", height: "28px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
          onError={(e) => { e.currentTarget.src = "/massager.jpg"; }}
        />
        <span style={{ color: "#888", fontSize: "12px", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <strong style={{ color: "#a78bfa", fontWeight: 700 }}>{selectedProduct.product_name}</strong>
        </span>
        <button
          type="button"
          onClick={() => setSelectedProduct(null)}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "1px solid #222",
            borderRadius: "6px",
            padding: "4px 10px",
            color: "#555",
            fontSize: "11px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Change
        </button>
      </div>
    );
  }

  function renderDashboardProductListHorizontal() {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>Your Products</h2>
            <p style={{ color: "#555", fontSize: 13, margin: "4px 0 0" }}>{analyses.length} products analyzed</p>
          </div>
          <button
            type="button"
            onClick={handleNewProduct}
            style={{
              background: "#6c47ff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Analyze New Product
          </button>
        </div>
        {analyses.map((analysis) => (
          <Fragment key={analysis.id}>{renderAnalysisHorizontalRow(analysis, "market")}</Fragment>
        ))}
      </div>
    );
  }

  function renderDashboardOverview() {
    if (!report || !selectedProduct) return null;
    const verdictStr = String(report.verdict ?? "—");
    const verdictBorder = getVerdictBorder(verdictStr);
    const verdictBg = getVerdictBg(verdictStr);
    const verdictColor = getVerdictColor(verdictStr);

    const anglesAll = (report.angles ?? []) as { type?: string; hook?: string; name?: string }[];
    const angleType = (a: { type?: string }) => String(a.type ?? "").toUpperCase();
    const saturatedN = anglesAll.filter((a) => angleType(a) === "SATURATED").length;
    const untappedN = anglesAll.filter((a) => angleType(a) === "UNTAPPED").length;
    const topUntapped = anglesAll.find((a) => angleType(a) === "UNTAPPED");
    const topUntappedLine =
      String(topUntapped?.hook ?? topUntapped?.name ?? "").trim() || "Tap the button below to unlock it";

    const market = (report.market ?? {}) as {
      size?: string;
      trend?: string;
      trend_reason?: string;
      price_range?: string;
      best_platforms?: string[];
    };
    const competitors = (report.competitors ?? []) as {
      name?: string;
      main_angle?: string;
      weakness?: string;
    }[];
    const c0 = competitors[0];
    const weaknessHint =
      typeof c0?.weakness === "string" && c0.weakness.length > 0
        ? c0.weakness.toLowerCase()
        : "their content strategy";
    const analysisProductName = report.product_name ?? selectedProduct?.product_name;
    const productLabel =
      analysisProductName != null && String(analysisProductName).trim() !== ""
        ? String(analysisProductName)
        : "your product";

    const scoreDisplay = typeof report.score === "number" ? report.score : String(report.score ?? "—");
    const potentialSuccess = getSuccessRate(selectedProduct, report);
    const successBarWidth = potentialSuccess ?? 0;

    return (
      <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setAnalysisReport(null);
            setCurrentStep(0);
          }}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "1px solid #222",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#555",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          ← All Products
        </button>

        {/* Verdict banner */}
        <div style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 36, flexShrink: 0 }}>
            {verdictStr === "GO" ? "✅" : verdictStr === "NO-GO" ? "❌" : "⚠️"}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: verdictColor, fontWeight: 900, fontSize: 22, marginBottom: 6 }}>{verdictStr}</div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{String(report.verdict_reason ?? "—")}</div>
            <div style={{ color: "#555", fontSize: 12 }}>
              Based on {market.size ?? "—"} market · {market.trend ?? "—"} trend
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 18px" }}>
              <div style={{ color: "#6c47ff", fontWeight: 900, fontSize: 32, lineHeight: 1 }}>{scoreDisplay}</div>
              <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>Score /100</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 18px" }}>
              <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 32, lineHeight: 1 }}>
                {potentialSuccess != null ? potentialSuccess : "—"}%
              </div>
              <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>Success rate</div>
            </div>
          </div>
        </div>

        {/* Product header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0" }}>
          <img
            src={selectedProduct.product_image ?? "/massager.jpg"}
            alt=""
            style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
            onError={(e) => { e.currentTarget.src = "/massager.jpg"; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{selectedProduct.product_name}</div>
            <div style={{ color: "#444", fontSize: 12, marginTop: 2 }}>Analyzed {new Date(selectedProduct.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* 4 action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button type="button" onClick={() => setActiveTab("market")}
            style={{ background: "#0c0c14", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 12, padding: "16px", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6c47ff"; e.currentTarget.style.background = "#0e0e1a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(108,71,255,0.2)"; e.currentTarget.style.background = "#0c0c14"; }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>📊</div>
            <div style={{ fontWeight: 700 }}>See Market Research</div>
            <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>Market size, trend, countries</div>
          </button>
          <button type="button" onClick={() => setActiveTab("angles")}
            style={{ background: "#0c0c14", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: "16px", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00d4aa"; e.currentTarget.style.background = "#0e0e1a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,170,0.2)"; e.currentTarget.style.background = "#0c0c14"; }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>🎯</div>
            <div style={{ fontWeight: 700 }}>See Winning Angles</div>
            <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{untappedN} untapped — launch these</div>
          </button>
          <button type="button" onClick={() => { setActiveTab("launch"); setLaunchSubTab("execution"); }}
            style={{ background: "#0c0c14", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 12, padding: "16px", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff6b6b"; e.currentTarget.style.background = "#0e0e1a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,107,107,0.2)"; e.currentTarget.style.background = "#0c0c14"; }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>🚀</div>
            <div style={{ fontWeight: 700 }}>See Execution Plan</div>
            <div style={{ color: "#555", fontSize: 12, marginTop: 2 }}>Ad scripts, 7-day launch plan</div>
          </button>
          <button type="button" onClick={() => { setActiveTab("launch"); setLaunchSubTab("campaigns"); }}
            style={{ background: "#6c47ff", border: "none", borderRadius: 12, padding: "16px", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>📣</div>
            <div style={{ fontWeight: 700 }}>Launch Campaign</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Build your Meta ads structure</div>
          </button>
        </div>

        {/* Ask AI button */}
        <button
          type="button"
          onClick={() => setActiveTab("advisor")}
          style={{ width: "100%", background: "transparent", border: "1px solid rgba(108,71,255,0.3)", borderRadius: 12, padding: 14, color: "#a78bfa", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(108,71,255,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          🧠 Ask AI — What should I do next?
        </button>
      </div>
    );
  }

  function renderTabBody() {
    // Tabs that don't require a selected product
    if (activeTab === "discover") {
      return <SuppliersTab isPro={true} />;
    }

    if (activeTab === "advisor") {
      return (
        <AdvisorTab
          analyses={analyses}
          analysisReport={analysisReport}
          selectedProductName={selectedProduct?.product_name}
        />
      );
    }

    if (activeTab === "launch") {
      if (!selectedProduct || !report) {
        if (analyses.length === 0) return renderUploadFlow();
        return (
          <div>
            <div style={{ background: "rgba(108,71,255,0.06)", border: "1px solid rgba(108,71,255,0.15)", borderRadius: "12px", padding: "14px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "18px" }}>👇</span>
              <span style={{ color: "#a78bfa", fontSize: "14px" }}>Select a product below to build your launch plan</span>
            </div>
            {analyses.map((analysis) => (
              <Fragment key={analysis.id}>{renderAnalysisHorizontalRow(analysis, "launch")}</Fragment>
            ))}
          </div>
        );
      }
      return (
        <div>
          {renderProductContextBanner()}
          <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
            <SubTabButton active={launchSubTab === "execution"} onClick={() => setLaunchSubTab("execution")}>🗺 Execution Plan</SubTabButton>
            <SubTabButton active={launchSubTab === "campaigns"} onClick={() => setLaunchSubTab("campaigns")}>📣 Campaign Builder</SubTabButton>
          </div>
          {launchSubTab === "execution" && (
            <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
              <DashboardExecutionPanel
                report={report}
                productImage={selectedProduct?.product_image}
                analysisSource={selectedProduct}
              />
            </div>
          )}
          {launchSubTab === "campaigns" && (
            <CampaignsTab
              analyses={analyses}
              analysisReport={analysisReport}
              setActiveTab={setActiveTab as (tab: string) => void}
              setAnalysisReport={setAnalysisReport}
              preselectedProduct={selectedProduct}
            />
          )}
        </div>
      );
    }

    if (!selectedProduct) {
      if (analyses.length === 0 || startNewUpload) return renderUploadFlow();
      if (activeTab === "market") return renderDashboardProductListHorizontal();
      return renderSelectProductPrompt(activeTab);
    }

    if (!report) {
      return renderDashboardProductListHorizontal();
    }

    if (activeTab === "market") {
      const marketReport =
        report.product_name != null && String(report.product_name).trim() !== ""
          ? report
          : { ...report, product_name: selectedProduct?.product_name ?? "" };
      const compsForMarket = (report.competitors as Record<string, unknown>[]) ?? [];

      // Show competitor detail/all-ads view if active
      if (showAllAdsFor || selectedCompetitor) {
        // reuse the same logic below via competitors block
      }
      if (showAllAdsFor) {
        const adsList = competitorAdsMap[showAllAdsFor] ?? [];
        const vidAds = adsList.filter((ad) => {
          const a = ad as Record<string, unknown>;
          if (a.is_video === true) return true;
          if (String(a.video ?? "").trim() !== "") return true;
          const p = String(a.platform ?? "");
          return p === "TikTok" || p === "YouTube";
        });
        const imgAds = adsList.filter((ad) => !vidAds.includes(ad));
        return (
          <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
            <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            {renderProductContextBanner()}
            <button type="button" onClick={() => setShowAllAdsFor("")} style={{ background: "transparent", border: "1px solid #222", borderRadius: 8, padding: "8px 16px", color: "#666", fontSize: 12, cursor: "pointer", marginBottom: 20 }}>← Back to {showAllAdsFor}</button>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>All ads by {showAllAdsFor}</div>
              <div style={{ color: "#555", fontSize: 13 }}>{adsList.length} ads found</div>
            </div>
            {imgAds.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>🖼 IMAGE ADS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="max-sm:grid-cols-1">
                  {imgAds.map((ad, i) => {
                    const a = ad as Record<string, unknown>;
                    return (
                      <div key={i} style={{ background: "#0c0c14", borderRadius: 12, overflow: "hidden", border: "1px solid #1a1a1a" }}>
                        {String(a.image ?? "") ? (
                          <a href={String(a.ad_url ?? "#")} target="_blank" rel="noopener noreferrer">
                            <img src={String(a.image ?? "")} alt="" style={{ width: "100%", height: "auto", display: "block", objectFit: "contain", minHeight: 150, background: "#0a0a12" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          </a>
                        ) : (
                          <a href={String(a.ad_url ?? `https://www.facebook.com/ads/library/?q=${encodeURIComponent(showAllAdsFor)}`)} target="_blank" rel="noopener noreferrer" style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a14", textDecoration: "none" }}><div style={{ color: "#333", fontSize: 11 }}>View Ad</div></a>
                        )}
                        <div style={{ padding: 10 }}>
                          <div style={{ color: "#666", fontSize: 11, marginBottom: 6, lineHeight: 1.4 }}>{String(a.headline ?? "").substring(0, 70)}</div>
                          <a href={String(a.ad_url ?? "#")} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "rgba(108,71,255,0.1)", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 6, padding: 6, fontSize: 10, color: "#6c47ff", fontWeight: 600, textDecoration: "none", textAlign: "center" }}>👁 See Full Post</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {vidAds.length > 0 && (
              <div>
                <div style={{ color: "#888", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>🎥 VIDEO ADS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {vidAds.map((ad, i) => {
                    const a = ad as Record<string, unknown>;
                    const headline = String(a.headline ?? "").substring(0, 100);
                    return (
                      <div key={i} role="button" tabIndex={0} onClick={() => { if (a.ad_url) window.open(String(a.ad_url), "_blank"); }} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && a.ad_url) window.open(String(a.ad_url), "_blank"); }} style={{ background: "#0c0c14", borderRadius: 12, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6c47ff"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; }}>
                        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0, background: "#000", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ProdIqLogoImg preset="tab" />
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>▶</div>
                        </div>
                        <div style={{ flex: 1, padding: "12px 16px", minWidth: 0 }}>
                          <div style={{ background: "#6c47ff22", border: "1px solid #6c47ff44", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "#a78bfa", fontWeight: 700, display: "inline-block", marginBottom: 6 }}>🎥 VIDEO AD</div>
                          {headline && <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.4, fontStyle: "italic", marginBottom: 6 }}>&ldquo;{headline}&rdquo;</div>}
                          <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 600 }}>Watch on TikTok ↗</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {adsList.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, background: "#0c0c14", borderRadius: 16, border: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ color: "white", fontWeight: 600, marginBottom: 16 }}>Search directly for their ads</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <a href={`https://www.facebook.com/ads/library/?q=${encodeURIComponent(showAllAdsFor)}&search_type=keyword_unordered`} target="_blank" rel="noopener noreferrer" style={{ background: "#1877f2", borderRadius: 8, padding: "10px 18px", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Meta Ads Library ↗</a>
                  <a href={`https://library.tiktok.com/ads?region=US&keyword=${encodeURIComponent(showAllAdsFor)}`} target="_blank" rel="noopener noreferrer" style={{ background: "#111", border: "1px solid #333", borderRadius: 8, padding: "10px 18px", color: "#888", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>TikTok Ads ↗</a>
                </div>
              </div>
            )}
          </div>
        );
      }

      if (selectedCompetitor) {
        const sc = selectedCompetitor;
        const siteRaw = String(sc.website ?? sc.url ?? "");
        const visitHref = siteRaw.startsWith("http") ? siteRaw : siteRaw ? `https://${siteRaw}` : "#";
        const dom = domainForFavicon(siteRaw);
        const nm = String(sc.name ?? "").trim() || "—";
        const adsForComp = competitorAdsMap[nm] ?? [];
        return (
          <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
            <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } } @keyframes compAdsSpin { to { transform: rotate(360deg); } }`}</style>
            {renderProductContextBanner()}
            <button type="button" onClick={() => { setSelectedCompetitor(null); setShowAllAdsFor(""); }} style={{ background: "transparent", border: "1px solid #222", borderRadius: 8, padding: "8px 16px", color: "#666", fontSize: 12, cursor: "pointer", marginBottom: 20 }}>← All Competitors</button>
            <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24, marginBottom: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {compDetailFaviconOk ? (
                <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=64`} alt="" style={{ width: 56, height: 56, borderRadius: 12, background: "#111", padding: 8, boxSizing: "border-box", flexShrink: 0 }} onError={() => setCompDetailFaviconOk(false)} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(108,71,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6c47ff", fontWeight: 800, fontSize: 24, flexShrink: 0 }}>{nm.charAt(0)}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "white", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{nm}</div>
                {siteRaw ? <a href={visitHref} target="_blank" rel="noopener noreferrer" style={{ color: "#6c47ff", fontSize: 13, textDecoration: "none" }}>↗ {siteRaw}</a> : null}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#00d4aa", fontWeight: 900, fontSize: 24 }}>{formatRevenue(sc.monthly_revenue as string | number | undefined)}</div>
                <div style={{ color: "#444", fontSize: 11 }}>est. monthly revenue</div>
              </div>
            </div>
            <div style={{ background: "#0c0c14", borderRadius: 14, border: "1px solid rgba(108,71,255,0.12)", padding: 20, marginBottom: 14 }}>
              <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>THEIR MAIN ANGLE</div>
              <div style={{ color: "white", fontSize: 15, fontStyle: "italic", marginBottom: 6 }}>&quot;{String(sc.main_angle ?? "—")}&quot;</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }} className="max-md:grid-cols-1">
              <div style={{ background: "rgba(255,68,68,0.05)", border: "1px solid rgba(255,68,68,0.2)", borderRadius: 14, padding: 20 }}>
                <div style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>⚠ THEIR WEAKNESS</div>
                <div style={{ color: "white", fontSize: 14, lineHeight: 1.5 }}>{String(sc.weakness ?? "—")}</div>
              </div>
              <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 14, padding: 20 }}>
                <div style={{ color: "#00d4aa", fontSize: 11, fontWeight: 700, marginBottom: 10 }}>✓ YOUR ADVANTAGE</div>
                <div style={{ color: "white", fontSize: 14, lineHeight: 1.5 }}>{String(sc.opportunity ?? "—")}</div>
              </div>
            </div>
            <div style={{ background: "#0c0c14", borderRadius: 14, border: "1px solid rgba(108,71,255,0.12)", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={{ color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>THEIR ADS</div>
                <button type="button" onClick={() => setShowAllAdsFor(nm)} style={{ background: "rgba(108,71,255,0.1)", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 8, padding: "6px 14px", color: "#6c47ff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>See All Ads →</button>
              </div>
              {loadingCompAds === nm ? (
                <div style={{ textAlign: "center", padding: 30 }}>
                  <div style={{ width: 30, height: 30, border: "2px solid rgba(108,71,255,0.2)", borderTop: "2px solid #6c47ff", borderRadius: "50%", animation: "compAdsSpin 1s linear infinite", margin: "0 auto 10px" }} />
                  <div style={{ color: "#444", fontSize: 12 }}>Finding their ads...</div>
                </div>
              ) : adsForComp.length === 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a href={`https://www.facebook.com/ads/library/?q=${encodeURIComponent(nm)}&search_type=keyword_unordered`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, background: "#1877f222", border: "1px solid #1877f244", borderRadius: 8, padding: 12, color: "#1877f2", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", display: "block" }}>📖 Meta Ads Library</a>
                  <a href={`https://library.tiktok.com/ads?region=US&keyword=${encodeURIComponent(nm)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 140, background: "#ffffff11", border: "1px solid #ffffff22", borderRadius: 8, padding: 12, color: "#888", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", display: "block" }}>🎵 TikTok Ads Library</a>
                </div>
              ) : (() => {
                const vidAds = adsForComp.slice(0, 6).filter((ad) => {
                  const a = ad as Record<string, unknown>;
                  return a.is_video === true || String(a.platform ?? "") === "TikTok" || String(a.platform ?? "") === "YouTube";
                });
                const imgAds = adsForComp.slice(0, 6).filter((ad) => !vidAds.includes(ad));
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {imgAds.length > 0 && (
                      <div>
                        <div style={{ color: "#555", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🖼 IMAGE ADS</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {imgAds.map((raw, i) => {
                            const ad = raw as Record<string, unknown>;
                            const img = String(ad.image ?? "");
                            const adUrl = String(ad.ad_url ?? "");
                            const headline = String(ad.headline ?? "").substring(0, 60);
                            return (
                              <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #1a1a1a", background: "#080810", display: "flex", flexDirection: "column" }}>
                                <a href={adUrl || `https://www.facebook.com/ads/library/?q=${encodeURIComponent(nm)}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", flexShrink: 0 }}>
                                  {img ? (
                                    <img src={img} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                  ) : (
                                    <div style={{ height: 140, background: "#0a0a14", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#333", fontSize: 11 }}>View Ad</span></div>
                                  )}
                                </a>
                                <div style={{ padding: "8px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                  {headline && <div style={{ color: "#666", fontSize: 11, lineHeight: 1.4 }}>{headline}</div>}
                                  <a href={adUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "rgba(108,71,255,0.1)", border: "1px solid rgba(108,71,255,0.2)", borderRadius: 5, padding: 5, fontSize: 10, color: "#6c47ff", fontWeight: 600, textDecoration: "none", textAlign: "center", marginTop: "auto" }}>👁 See Post</a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {vidAds.length > 0 && (
                      <div>
                        <div style={{ color: "#555", fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🎥 VIDEO ADS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {vidAds.map((raw, i) => {
                            const ad = raw as Record<string, unknown>;
                            const adUrl = String(ad.ad_url ?? "");
                            const headline = String(ad.headline ?? "").substring(0, 100);
                            return (
                              <div key={i} role="button" tabIndex={0} onClick={() => { if (adUrl) window.open(adUrl, "_blank"); }} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && adUrl) { e.preventDefault(); window.open(adUrl, "_blank"); } }} style={{ background: "#0c0c14", borderRadius: 12, border: "1px solid #1a1a1a", display: "flex", alignItems: "center", overflow: "hidden", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6c47ff"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; }}>
                                <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0, background: "#000", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <ProdIqLogoImg preset="tab" />
                                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 32, height: 32, borderRadius: "50%", background: "#6c47ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>▶</div>
                                </div>
                                <div style={{ flex: 1, padding: "12px 16px", minWidth: 0 }}>
                                  <div style={{ background: "#6c47ff22", border: "1px solid #6c47ff44", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: "#a78bfa", fontWeight: 700, display: "inline-block", marginBottom: 6 }}>🎥 VIDEO AD</div>
                                  {headline && <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.4, fontStyle: "italic", marginBottom: 6 }}>&ldquo;{headline}&rdquo;</div>}
                                  <div style={{ color: "#6c47ff", fontSize: 11, fontWeight: 600 }}>Watch on TikTok ↗</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      }

      return (
        <div>
          {renderProductContextBanner()}
          {/* Verdict banner */}
          <div style={{ background: "rgba(0,212,170,0.06)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24 }}>
              {String(report.verdict ?? "") === "GO" ? "✅" : String(report.verdict ?? "") === "NO-GO" ? "❌" : "⚠️"}
            </span>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{String(report.verdict_reason ?? "—")}</div>
              <div style={{ color: "#a78bfa", fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                {(() => {
                  const score = Number(report.score ?? 0);
                  const verdict = String(report.verdict ?? "");
                  if (verdict === "NO-GO") return "Your best move is to find a differentiated angle no one else is running.";
                  if (score >= 80) return "Success depends on running untapped angles your competitors haven't touched yet.";
                  if (score >= 65) return "Your best shot is running untapped angles before this market gets too crowded.";
                  return "Success here depends almost entirely on finding and running untapped angles your competitors ignore.";
                })()}
              </div>
              <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>
                Based on {String((report.market as Record<string, unknown>)?.size ?? "—")} market · {String((report.market as Record<string, unknown>)?.trend ?? "—")} trend
              </div>
            </div>
          </div>
          <DashboardMarketPremium
            report={marketReport}
            analysisSource={selectedProduct}
            revenueFilter={revenueFilter}
            setRevenueFilter={setRevenueFilter}
            elapsedSec={elapsed}
          />
          {/* Competitors section */}
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid #1a1a1a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>Competitors</span>
              <span style={{ background: "#111", color: "#555", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{compsForMarket.length} found</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {compsForMarket.map((comp, i) => {
                const nm = String(comp.name ?? "").trim() || "—";
                const site = String(comp.website ?? "").trim();
                const dom = domainForFavicon(site);
                const estRev = formatRevenue(comp.monthly_revenue as string | number | undefined);
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCompetitorClick(comp)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCompetitorClick(comp); } }}
                    style={{ background: "#0c0c14", borderRadius: 14, border: "1px solid rgba(108,71,255,0.1)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6c47ff"; e.currentTarget.style.background = "#0e0e1a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(108,71,255,0.1)"; e.currentTarget.style.background = "#0c0c14"; }}
                  >
                    <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=32`} alt="" style={{ width: 32, height: 32, borderRadius: 8, background: "#111", flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "white", fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{nm}</div>
                      <div style={{ color: "#555", fontSize: 12, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        &quot;{String(comp.main_angle ?? "").substring(0, 60)}&quot;
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14 }}>{estRev}</div>
                      <div style={{ color: "#444", fontSize: 10 }}>est. revenue</div>
                    </div>
                    <div style={{ color: "#444", fontSize: 16 }}>→</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }



    if (activeTab === "angles") {
      const anglesAll2 = (report.angles ?? []) as { type?: string }[];
      const untappedCount = anglesAll2.filter((a) => String(a.type ?? "").toUpperCase() === "UNTAPPED").length;
      const totalAngles = anglesAll2.length;
      const adsReport2 =
        report.product_name != null && String(report.product_name).trim() !== ""
          ? report
          : { ...report, product_name: selectedProduct?.product_name ?? "" };
      return (
        <div style={{ background: "#0c0c14", borderRadius: 16, border: "1px solid rgba(108,71,255,0.12)", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0, gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>{renderProductContextBanner()}</div>
            <button
              type="button"
              onClick={handleNewProduct}
              style={{
                background: "#6c47ff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                marginBottom: 24,
              }}
            >
              + New Product
            </button>
          </div>
          {/* Intro */}
          <div style={{ marginBottom: 20, padding: "14px 18px", background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 12 }}>
            <span style={{ color: "#888", fontSize: 14 }}>
              We found <strong style={{ color: "white" }}>{totalAngles} angles</strong> for this product.{" "}
              <strong style={{ color: "#00d4aa" }}>{untappedCount} are untapped</strong> — these are your best opportunities to run ads nobody else is running.
            </span>
          </div>
          <AnglesTabMindMap analysisReport={report} setActiveTab={setActiveTab as (tab: string) => void} />
          {/* Ads section */}
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid #1a1a1a" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 18 }}>Competitor Ads</span>
              {adsLoading ? (
                <div style={{ color: "#555", fontSize: 12 }}>Loading ads...</div>
              ) : (
                <div style={{ color: "#555", fontSize: 12 }}>{realAds.length} ads found</div>
              )}
            </div>
            <DashboardAdsIntelligence
              report={adsReport2}
              realAds={realAds}
              adsLoading={adsLoading}
              adsMarketInsight={adsMarketInsight}
            />
          </div>
        </div>
      );
    }

    return null;
  }

  function renderUploadFlow() {
    return (
      <div className="dash-fade mx-auto max-w-[640px] text-center" style={{ paddingTop: 16 }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <AnimatedBadge text="✦ Powered by ProdIQ AI" />
        </div>
        <h1 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 700, lineHeight: 1.1, margin: 0 }}>Drop your product.</h1>
        <h2 style={{ fontSize: "clamp(26px, 6vw, 40px)", fontWeight: 700, lineHeight: 1.1, color: PURPLE, margin: 0 }}>
          We handle everything else.
        </h2>
        {analyses.length > 0 ? (
          <button
            type="button"
            onClick={() => setStartNewUpload(false)}
            style={{
              marginTop: 16,
              background: "transparent",
              border: "1px solid #222",
              borderRadius: 8,
              padding: "8px 16px",
              color: "#666",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ← Back to products
          </button>
        ) : null}

        {currentStep === 0 && (
          <div
            style={{
              marginTop: 28,
              background: "#0c0c14",
              border: "2px dashed rgba(108,71,255,0.28)",
              borderRadius: 24,
              padding: "32px 24px",
            }}
          >
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                border: "1px dashed rgba(108,71,255,0.25)",
                background: "#08080c",
                borderRadius: 12,
                padding: "24px 16px",
                cursor: "pointer",
                color: "#888",
              }}
            >
              📷 Drop image or click to upload
            </button>
            {imagePreview ? (
              <img src={imagePreview} alt="" style={{ marginTop: 16, maxHeight: 160, borderRadius: 12 }} />
            ) : null}
            <input
              type="url"
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="Or paste Amazon / product URL"
              style={{
                marginTop: 16,
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #222",
                background: "#08080c",
                color: "white",
                fontSize: 14,
              }}
            />
            <textarea
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="Or describe the product in plain text"
              rows={3}
              style={{
                marginTop: 12,
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #222",
                background: "#08080c",
                color: "white",
                fontSize: 14,
                resize: "vertical",
              }}
            />
            {errorMsg ? (
              <div
                style={{
                  background: "rgba(255,68,68,0.1)",
                  border: "1px solid #ff444444",
                  borderRadius: 10,
                  padding: "14px 18px",
                  color: "#ff6b6b",
                  fontSize: 13,
                  marginTop: 16,
                  maxWidth: 580,
                  margin: "16px auto",
                }}
              >
                ⚠ {errorMsg}
              </div>
            ) : null}
            <button
              type="button"
              disabled={!canSubmit || busy}
              onClick={() => void handleUpload()}
              style={{
                marginTop: 20,
                width: "100%",
                background: canSubmit && !busy ? PURPLE : "#333",
                color: "white",
                fontWeight: 700,
                padding: "14px 24px",
                borderRadius: 12,
                border: "none",
                cursor: canSubmit && !busy ? "pointer" : "not-allowed",
                fontSize: 15,
              }}
            >
              {busy ? "Identifying…" : "Identify product"}
            </button>
          </div>
        )}

        {currentStep === 1 && busy && !identifiedProduct ? (
          <div style={{ marginTop: 32 }}>
            <p style={{ color: "#888" }}>Identifying product from your input…</p>
            <div
              className="mx-auto mt-4 h-9 w-9 rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${PURPLE}44`, borderTopColor: PURPLE, animation: "spin 0.9s linear infinite" }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : null}

        {currentStep === 1 && identifiedProduct ? (
          <div style={{ maxWidth: 580, margin: "0 auto", animation: "fadeSlideUp 0.4s ease" }}>
            <style>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div
                style={{
                  color: "#6c47ff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                PRODUCT IDENTIFIED
              </div>
              <h2 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Is this your product?</h2>
              <p style={{ color: "#555", fontSize: 14, margin: 0 }}>
                We found this based on your upload. Confirm before we start the full analysis.
              </p>
            </div>

            {errorMsg ? (
              <div
                style={{
                  background: "rgba(255,68,68,0.1)",
                  border: "1px solid rgba(255,68,68,0.3)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: "#ff6b6b",
                  fontSize: 13,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                ⚠ {errorMsg}
              </div>
            ) : null}

            {(() => {
              const id = identifiedProduct;
              const pname = String(id.product_name ?? "");
              const pimg = String(id.product_image ?? "");
              const conf = Number(id.confidence ?? 0);
              const srcRaw = String(id.source ?? "");
              const sourceLabel =
                srcRaw === "amazon_direct"
                  ? "Amazon"
                  : srcRaw === "image_ai_verified"
                    ? "AI Vision"
                    : srcRaw === "asin" || srcRaw === "asin_serper"
                      ? "Amazon ASIN"
                      : srcRaw === "amazon_scraped"
                        ? "Amazon"
                        : srcRaw === "multi_layer_ai"
                          ? "AI Vision"
                          : srcRaw === "text_ai"
                            ? "Web + AI"
                            : srcRaw
                              ? srcRaw.replace(/_/g, " ")
                              : "Web Search";
              return (
                <div
                  style={{
                    background: "#0c0c14",
                    borderRadius: 20,
                    border: "1px solid rgba(108,71,255,0.2)",
                    overflow: "hidden",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      height: 260,
                      background: "#080810",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {pimg && !idImageFailed ? (
                      <img
                        src={pimg}
                        alt={pname}
                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 20 }}
                        onError={() => setIdImageFailed(true)}
                      />
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 64, marginBottom: 12 }}>📦</div>
                        <div style={{ color: "#444", fontSize: 14 }}>{pimg ? "Image failed to load" : "No image found"}</div>
                        {pname ? (
                          <div style={{ color: "#555", fontSize: 13, marginTop: 8 }}>{pname}</div>
                        ) : null}
                      </div>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: conf >= 90 ? "rgba(0,212,170,0.9)" : "rgba(245,158,11,0.9)",
                        borderRadius: 8,
                        padding: "5px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: conf >= 90 ? "#003322" : "#1a0a00",
                      }}
                    >
                      {Number.isFinite(conf) ? `${Math.round(conf)}` : "—"}% match
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: 8,
                        padding: "5px 12px",
                        fontSize: 10,
                        color: "#888",
                      }}
                    >
                      via {sourceLabel}
                    </div>
                  </div>

                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{pname}</div>

                    {id.brand ? (
                      <div style={{ color: "#6c47ff", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                        by {String(id.brand)}
                      </div>
                    ) : null}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {id.variant ? (
                        <div
                          style={{
                            background: "#111",
                            border: "1px solid #1a1a1a",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 12,
                            color: "#888",
                          }}
                        >
                          {String(id.variant)}
                        </div>
                      ) : null}
                      {id.weight ? (
                        <div
                          style={{
                            background: "#111",
                            border: "1px solid #1a1a1a",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 12,
                            color: "#888",
                          }}
                        >
                          {String(id.weight)}
                        </div>
                      ) : null}
                      {id.price ? (
                        <div
                          style={{
                            background: "rgba(0,212,170,0.1)",
                            border: "1px solid rgba(0,212,170,0.2)",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 12,
                            color: "#00d4aa",
                            fontWeight: 600,
                          }}
                        >
                          {String(id.price)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ marginBottom: 16 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleConfirmProduct()}
                style={{
                  background: "linear-gradient(135deg, #00d4aa, #00b894)",
                  border: "none",
                  borderRadius: 12,
                  padding: 16,
                  color: "#003322",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!busy) e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = busy ? "0.7" : "1";
                }}
              >
                {busy ? "Analyzing…" : "✓ Yes, analyze this product"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setCurrentStep(0);
                  setIdentifiedProduct(null);
                  setUploadFile(null);
                  setImagePreview(null);
                  setIdImageFailed(false);
                  setUploadUrl("");
                  setUploadText("");
                  setErrorMsg(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 16,
                  color: "#888",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: busy ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!busy) {
                    e.currentTarget.style.borderColor = "#ff4444";
                    e.currentTarget.style.color = "#ff6b6b";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.color = "#888";
                }}
              >
                ✕ No, try again
              </button>
            </div>

            <div style={{ textAlign: "center", color: "#444", fontSize: 12 }}>
              Not the right product? Go back and upload a clearer image or paste the Amazon link directly.
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div style={{ marginTop: 32, textAlign: "left", maxWidth: 480, marginInline: "auto" }}>
            <style>{`
              @keyframes stepPulse {
                0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(108,71,255,0.7), 0 0 6px 2px rgba(108,71,255,0.4); }
                50%       { opacity: 0.6; box-shadow: 0 0 0 4px rgba(108,71,255,0), 0 0 12px 4px rgba(108,71,255,0.15); }
              }
              @keyframes stepSweep {
                0%   { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
            `}</style>
            <p style={{ color: "#888", marginBottom: 8 }}>
              Deep research in progress
              {identifiedProduct?.product_name ? ` · ${String(identifiedProduct.product_name)}` : ""}…
            </p>
            {(() => {
              const activeIdx = researchSteps.findIndex((x) => !x);
              return RESEARCH_STEP_LABELS.map((label, i) => {
                const done = researchSteps[i];
                const active = i === activeIdx;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13 }}>
                    {done ? (
                      <span style={{ color: "#00d4aa", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>✓</span>
                    ) : active ? (
                      <span style={{
                        display: "inline-block",
                        width: 10, height: 10,
                        borderRadius: "50%",
                        background: "#6c47ff",
                        flexShrink: 0,
                        animation: "stepPulse 1.4s ease-in-out infinite",
                      }} />
                    ) : (
                      <span style={{ color: "#333", fontSize: 14, lineHeight: 1 }}>○</span>
                    )}
                    {active ? (
                      <span style={{
                        background: "linear-gradient(90deg, #555 0%, #a78bfa 40%, #6c47ff 55%, #555 100%)",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        animation: "stepSweep 1.8s linear infinite",
                        fontWeight: 600,
                      }}>{label}</span>
                    ) : (
                      <span style={{ color: done ? "#ccc" : "#444" }}>{label}</span>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : null}
      </div>
    );
  }

  if (!ready || !authChecked) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: BG, color: "#888", fontFamily: "system-ui, sans-serif" }}
      >
        <div
          className="h-9 w-9 rounded-full border-2 border-t-transparent"
          style={{ borderColor: `${PURPLE}44`, borderTopColor: PURPLE, animation: "spin 0.9s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Upgrade wall ────────────────────────────────────────────────────────────
  // Shown immediately after a free user finishes their 1 free analysis.
  // Cannot be dismissed — only pick a plan or sign out.
  if (showUpgradeWall) {
    const UPGRADE_PLANS = [
      {
        key: "starter",
        label: "Starter",
        price: "$29.90",
        tagline: "Perfect for solo sellers",
        color: "#888888",
        features: [
          "15 analyses / day",
          "Market research & demand score",
          "Go or No-Go verdict",
          "Top 3 competitors",
          "Basic angle suggestions",
        ],
      },
      {
        key: "pro",
        label: "Pro",
        price: "$59.90",
        tagline: "For serious sellers",
        color: "#6c47ff",
        popular: true,
        features: [
          "30 analyses / day",
          "Everything in Starter",
          "Full angle discovery",
          "Ad scripts & competitor ad library",
          "Private supplier network",
        ],
      },
      {
        key: "enterprise",
        label: "Enterprise",
        price: "$89.90",
        tagline: "Agencies & power sellers",
        color: "#f59e0b",
        features: [
          "Unlimited analyses",
          "Everything in Pro",
          "White label reports",
          "API access & team seats",
          "Dedicated account manager",
        ],
      },
    ] as const;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(4,4,6,0.98)",
          backdropFilter: "blur(28px)",
          overflowY: "auto",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <style>{`
          @keyframes uw-glow  { 0%,100%{opacity:.35} 50%{opacity:.8} }
          @keyframes uw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes uw-spin  { to{transform:rotate(360deg)} }
        `}</style>

        {/* Background glow */}
        <div style={{ position: "fixed", top: "0%", left: "50%", transform: "translateX(-50%)", width: 800, height: 400, background: "radial-gradient(ellipse, rgba(108,71,255,0.14) 0%, transparent 70%)", pointerEvents: "none", animation: "uw-glow 5s ease-in-out infinite" }} />

        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 20px 80px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 56, marginBottom: 20, display: "inline-block", animation: "uw-float 3.5s ease-in-out infinite" }}>🔒</div>
            <div style={{ background: "rgba(255,68,68,0.12)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: 20, padding: "5px 18px", display: "inline-block", color: "#ff6b6b", fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", marginBottom: 24 }}>
              FREE ANALYSIS USED
            </div>
            <h2 style={{ color: "white", fontSize: "clamp(24px,5vw,38px)", fontWeight: 900, marginBottom: 14, lineHeight: 1.2 }}>
              You&apos;ve used your free analysis
            </h2>
            <p style={{ color: "#666", fontSize: 16, lineHeight: 1.8, maxWidth: 500, margin: "0 auto" }}>
              Pick a plan below to keep validating products, discovering winning angles, and launching with confidence.
            </p>
          </div>

          {/* Plan cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginBottom: 44 }}>
            {UPGRADE_PLANS.map((plan) => (
              <div
                key={plan.key}
                style={{
                  background: "#0c0c14",
                  border: `1px solid ${"popular" in plan && plan.popular ? "rgba(108,71,255,0.55)" : "#1a1a1a"}`,
                  borderRadius: 20,
                  padding: "28px 24px",
                  position: "relative",
                  boxShadow: "popular" in plan && plan.popular ? "0 0 48px rgba(108,71,255,0.22)" : "none",
                }}
              >
                {"popular" in plan && plan.popular && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#6c47ff", borderRadius: 20, padding: "4px 18px", fontSize: 10, fontWeight: 800, color: "white", whiteSpace: "nowrap", letterSpacing: "1px" }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: "white", fontWeight: 900, fontSize: 30 }}>{plan.price}</span>
                  <span style={{ color: "#444", fontSize: 14 }}>/mo</span>
                </div>
                <div style={{ color: plan.color, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{plan.label}</div>
                <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>{plan.tagline}</div>
                <div style={{ marginBottom: 24 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", color: "#999", fontSize: 13 }}>
                      <span style={{ color: plan.color, fontSize: 11, marginTop: 2, flexShrink: 0 }}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={subscribingPlan !== null}
                  onClick={() => void subscribeToPlan(plan.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    background: "popular" in plan && plan.popular ? "#6c47ff" : "transparent",
                    border: `2px solid ${"popular" in plan && plan.popular ? "#6c47ff" : plan.color}`,
                    borderRadius: 12,
                    padding: "14px",
                    color: "popular" in plan && plan.popular ? "white" : plan.color,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: subscribingPlan !== null ? "not-allowed" : "pointer",
                    opacity: subscribingPlan !== null && subscribingPlan !== plan.key ? 0.35 : 1,
                    transition: "all 0.2s",
                    boxShadow: "popular" in plan && plan.popular ? "0 6px 24px rgba(108,71,255,0.38)" : "none",
                  }}
                >
                  {subscribingPlan === plan.key ? (
                    <>
                      <span style={{ width: 15, height: 15, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "uw-spin 0.8s linear infinite" }} />
                      Redirecting…
                    </>
                  ) : (
                    `Get ${plan.label} →`
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#3a3a3a", fontSize: 13, marginBottom: 18 }}>
              7-day money-back guarantee · Cancel anytime · No hidden fees
            </p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              style={{ background: "transparent", border: "1px solid #1a1a1a", borderRadius: 8, padding: "9px 22px", color: "#444", fontSize: 13, cursor: "pointer", transition: "color 0.2s, border-color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.borderColor = "#333"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#444"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
            >
              Sign out
            </button>
          </div>

        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: BG, position: "relative", color: "#fff", paddingTop: 96, fontFamily: "system-ui, sans-serif" }} className="sm:pt-14">
      <AnimatedBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
      {/* Top bar: logo + actions */}
      <header
        className="fixed left-0 right-0 top-0 z-[200]"
        style={{
          background: "rgba(4,4,6,0.97)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(108,71,255,0.1)",
        }}
      >
        {/* Row 1: logo + buttons */}
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-5">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 no-underline">
            <ProdIqLogoImg />
            <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>
              Prod<span style={{ color: PURPLE }}>IQ</span>
            </span>
          </Link>
          {/* Desktop: centered tab bar (hidden on mobile) */}
          <div
            className="absolute left-1/2 hidden -translate-x-1/2 sm:flex"
            style={{
              alignItems: "center",
              gap: 2,
              background: "#0c0c14",
              borderRadius: 30,
              padding: 4,
              border: "1px solid #1a1a1a",
              maxWidth: "calc(100vw - 260px)",
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                onMouseEnter={(e) => { if (activeTab !== t.id) e.currentTarget.style.color = "#888"; }}
                onMouseLeave={(e) => { if (activeTab !== t.id) e.currentTarget.style.color = "#555"; }}
                style={{
                  background: activeTab === t.id ? PURPLE : "transparent",
                  border: "none",
                  borderRadius: 26,
                  padding: "7px 13px",
                  color: activeTab === t.id ? "white" : "#555",
                  fontSize: 12,
                  fontWeight: activeTab === t.id ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleNewProduct}
              className="hidden sm:block"
              style={{
                background: "#6c47ff",
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                visibility: (activeTab === "launch" || activeTab === "discover" || activeTab === "advisor") ? "visible" : "hidden",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              + New Product
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              style={{
                background: "transparent",
                border: "1px solid #1a1a1a",
                borderRadius: 8,
                padding: "7px 10px",
                color: "#555",
                cursor: "pointer",
                fontSize: 16,
                transition: "all 0.2s",
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6c47ff";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1a1a1a";
                e.currentTarget.style.color = "#555";
              }}
              aria-label="Settings"
            >
              ⚙
            </button>
          </div>
        </div>
        {/* Row 2: mobile-only tab scroll bar */}
        <div
          className="flex items-center gap-1 overflow-x-auto px-3 pb-2 pt-0 sm:hidden"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? PURPLE : "transparent",
                border: `1px solid ${activeTab === t.id ? PURPLE : "#1a1a1a"}`,
                borderRadius: 20,
                padding: "5px 14px",
                color: activeTab === t.id ? "white" : "#555",
                fontSize: 12,
                fontWeight: activeTab === t.id ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <DashboardSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        user={user}
        analyses={analyses}
        onLogout={() => void handleLogout()}
      />

      <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">{renderTabBody()}</main>
      </div>
    </div>
  );
}
