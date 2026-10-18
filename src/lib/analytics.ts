import { siteConfig } from "@/lib/siteConfig";
import { getCookieConsent } from "@/lib/userPreferences";

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
 * No-op until NEXT_PUBLIC_GA_ID is actually configured, a gtag loader is wired in, AND the
 * visitor has consented to the "analytics" cookie category — "Somente necessários" must
 * really block optional tracking, not just hide the banner. Whichever of these three is
 * missing, this stays a silent no-op; it never fakes tracking in the meantime.
 */
export function trackEvent(name: AnalyticsEvent, params?: Record<string, string | number | boolean>): void {
  if (!siteConfig.analyticsEnabled) return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (getCookieConsent()?.analytics !== true) return;
  window.gtag("event", name, params);
}
