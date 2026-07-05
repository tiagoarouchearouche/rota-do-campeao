import type { TeamStanding, WorldCupMode } from "./types";

/**
 * The World Cup 2026 needs a dedicated presentation mode because football-data.org's real
 * coverage of it varies by tournament phase: full group standings, matches-only (schedule
 * published but standings not yet computed), or neither (too early / provider gap). We never
 * want to present the mock simulation as if it were the real bracket, so the mode is derived
 * purely from whether standings/fixtures actually came from football-data.org (`isMock`).
 */
export function resolveWorldCupMode(standingsIsMock: boolean, fixturesIsMock: boolean): WorldCupMode {
  if (!standingsIsMock) return "official_data";
  if (!fixturesIsMock) return "schedule_only";
  return "simulation_only";
}

export function groupStandingsByGroup(standings: TeamStanding[]): Array<{ group: string; teams: TeamStanding[] }> {
  const groups = new Map<string, TeamStanding[]>();
  for (const team of standings) {
    const key = team.group ?? "Tabela geral";
    groups.set(key, [...(groups.get(key) ?? []), team]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teams]) => ({ group, teams }));
}
