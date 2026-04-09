/** Verdict styling — TEST CAREFULLY uses amber, not red. */
export function getVerdictColor(verdict: string) {
  if (verdict === "GO") return "#00d4aa";
  if (verdict === "NO-GO") return "#ff4444";
  if (verdict === "TEST CAREFULLY") return "#f59e0b";
  return "#f59e0b";
}

export function getVerdictBg(verdict: string) {
  if (verdict === "GO") return "rgba(0,212,170,0.1)";
  if (verdict === "NO-GO") return "rgba(255,68,68,0.1)";
  if (verdict === "TEST CAREFULLY") return "rgba(245,158,11,0.1)";
  return "rgba(245,158,11,0.1)";
}

export function getVerdictBorder(verdict: string) {
  if (verdict === "GO") return "rgba(0,212,170,0.3)";
  if (verdict === "NO-GO") return "rgba(255,68,68,0.3)";
  if (verdict === "TEST CAREFULLY") return "rgba(245,158,11,0.3)";
  return "rgba(245,158,11,0.3)";
}

type AnalysisLike = {
  full_report?: Record<string, unknown> | null;
  potential_success?: unknown;
} | null;

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Resolve potential_success from report row and/or embedded full_report. */
export function getSuccessRate(analysis: AnalysisLike, report: Record<string, unknown> | null | undefined): number | null {
  const r = report ?? {};
  const nested = r.full_report as Record<string, unknown> | undefined;
  return (
    numOrNull(r.potential_success) ??
    numOrNull(nested?.potential_success) ??
    numOrNull(analysis?.full_report?.potential_success) ??
    numOrNull(analysis?.potential_success) ??
    null
  );
}

/** Stable stand-in when the API row has no potential_success (avoids Math.random flicker). */
export function fallbackPotentialSuccess(id: string, score: number): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const jitter = ((h >>> 0) % 801) / 100;
  return Math.min(94, Math.max(52, Math.round(score * 0.85 + jitter)));
}
