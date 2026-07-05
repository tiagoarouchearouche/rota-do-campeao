import type { ScenarioName } from "@/services/sportsData/types";

export type ShareState = {
  scenario: ScenarioName;
  season: number;
  simulatedAt: string;
};

export function encodeShareState(state: ShareState): string {
  const json = JSON.stringify(state);
  if (typeof window === "undefined") return Buffer.from(json, "utf-8").toString("base64");
  return window.btoa(unescape(encodeURIComponent(json)));
}

export function decodeShareState(encoded: string): ShareState | null {
  try {
    const json =
      typeof window === "undefined"
        ? Buffer.from(encoded, "base64").toString("utf-8")
        : decodeURIComponent(escape(window.atob(encoded)));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.scenario === "string") return parsed as ShareState;
    return null;
  } catch {
    return null;
  }
}

export function buildTeamShareUrl(params: {
  origin: string;
  competitionId: string;
  teamId: string;
  season: number;
  scenario: ScenarioName;
}): string {
  const state = encodeShareState({
    scenario: params.scenario,
    season: params.season,
    simulatedAt: new Date().toISOString(),
  });
  const url = new URL(`/competicao/${params.competitionId}/time/${params.teamId}`, params.origin);
  url.searchParams.set("season", String(params.season));
  url.searchParams.set("scenario", params.scenario);
  url.searchParams.set("state", state);
  return url.toString();
}

export function buildWhatsAppShareUrl(shareUrl: string, message: string): string {
  const text = encodeURIComponent(`${message} ${shareUrl}`);
  return `https://wa.me/?text=${text}`;
}
