import type { ScenarioName } from "@/services/sportsData/types";

const KEYS = {
  myTeamId: "rota-do-campeao:my-team-id",
  lastTeamId: "rota-do-campeao:last-team-id",
  scenarioPreference: "rota-do-campeao:scenario-preference",
  cookieConsent: "rota-do-campeao:cookie-consent",
} as const;

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
};

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage indisponível (modo privado, quota excedida, etc.) — ignora silenciosamente
  }
}

export function getMyTeamId(): string | null {
  return safeGet(KEYS.myTeamId);
}

export function setMyTeamId(id: string): void {
  safeSet(KEYS.myTeamId, id);
}

export function getLastTeamId(): string | null {
  return safeGet(KEYS.lastTeamId);
}

export function setLastTeamId(id: string): void {
  safeSet(KEYS.lastTeamId, id);
}

export function getScenarioPreference(): ScenarioName | null {
  const value = safeGet(KEYS.scenarioPreference);
  if (value === "optimistic" || value === "realistic" || value === "pessimistic") return value;
  return null;
}

export function setScenarioPreference(scenario: ScenarioName): void {
  safeSet(KEYS.scenarioPreference, scenario);
}

export function getCookieConsent(): CookieConsent | null {
  const value = safeGet(KEYS.cookieConsent);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.analytics === "boolean" && typeof parsed.advertising === "boolean") {
      return { necessary: true, analytics: parsed.analytics, advertising: parsed.advertising };
    }
    return null;
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: CookieConsent): void {
  safeSet(KEYS.cookieConsent, JSON.stringify(consent));
}
