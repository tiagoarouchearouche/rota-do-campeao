import { siteConfig } from "@/lib/siteConfig";

export type AnalyticsEvent =
  | "select_team"
  | "open_simulator"
  | "simulate_match"
  | "share_team"
  | "compare_teams";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * No-op until NEXT_PUBLIC_GA_ID is actually configured and a gtag loader is wired in — this
 * only prepares the call sites so analytics can be switched on in one place later, never fakes
 * tracking in the meantime.
 */
export function trackEvent(name: AnalyticsEvent, params?: Record<string, string | number | boolean>): void {
  if (!siteConfig.analyticsEnabled) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
