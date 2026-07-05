import type { ScenarioName } from "@/services/sportsData/types";

const KEYS = {
  lastCompetitionId: "rota-do-campeao:last-competition-id",
  lastTeamId: "rota-do-campeao:last-team-id",
  scenarioPreference: "rota-do-campeao:scenario-preference",
} as const;

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

export function getLastCompetitionId(): string | null {
  return safeGet(KEYS.lastCompetitionId);
}

export function setLastCompetitionId(id: string): void {
  safeSet(KEYS.lastCompetitionId, id);
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
