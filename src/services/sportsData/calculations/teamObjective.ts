import type { Competition, TeamStanding } from "../types";
import { getZoneBand } from "./classificationZones";

export type TeamObjective = "title" | "libertadores" | "pre-libertadores" | "sula" | "mid" | "risk" | "relegation";

/**
 * Derives the team's primary objective purely from table position + competition config —
 * never from `TeamStanding.status`, which is only populated by the mock provider/scenario
 * engine and stays `undefined` for real football-data.org standings. Relying on `status` here
 * silently broke the "title"/"relegation" headlines in production (always falling back to
 * "mid"), since real data never sets it.
 */
export function resolveTeamObjective(team: TeamStanding, standings: TeamStanding[], competition: Competition): TeamObjective {
  const totalTeams = standings.length;
  const titleWindow = Math.max(competition.titleSpots ?? 1, 4);
  if (team.position <= titleWindow) return "title";

  const band = getZoneBand(team.position, totalTeams, competition);
  if (band?.tone === "libertadores") return "libertadores";
  if (band?.tone === "pre-libertadores") return "pre-libertadores";
  if (band?.tone === "sula") return "sula";
  if (band?.tone === "relegation") return "relegation";

  if (competition.hasRelegation && competition.relegationSpots) {
    const relegationLine = totalTeams - competition.relegationSpots;
    if (team.position > relegationLine - 3 && team.position <= relegationLine) return "risk";
  }

  return "mid";
}
