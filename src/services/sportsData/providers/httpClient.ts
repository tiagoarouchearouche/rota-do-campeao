import type { ProviderFetchResult } from "../types";

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Thin fetch wrapper shared by external providers. Never throws — every
 * failure mode (network, timeout, invalid JSON, HTTP status) is translated
 * into a ProviderFetchResult so sportsDataService can decide when to fall
 * back to mock data without needing try/catch at every call site.
 */
export async function fetchJson<T>(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ProviderFetchResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });

    // football-data.org returns 400 (not 401/403) for an invalid/expired token.
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { ok: false, errorReason: "invalid_key" };
    }
    if (response.status === 429) {
      return { ok: false, errorReason: "rate_limited" };
    }
    if (response.status >= 500) {
      return { ok: false, errorReason: "provider_down" };
    }
    if (!response.ok) {
      return { ok: false, errorReason: "provider_down" };
    }

    try {
      const data = (await response.json()) as T;
      return { ok: true, data };
    } catch {
      return { ok: false, errorReason: "invalid_json" };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, errorReason: "timeout" };
    }
    return { ok: false, errorReason: "network_error" };
  } finally {
    clearTimeout(timeout);
  }
}
