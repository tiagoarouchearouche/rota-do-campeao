import type { TeamSearchCompetitionRef, TeamSearchResult } from "./types";
import { competitions } from "./competitions/competitionRegistry";
import { getTeams } from "./sportsDataService";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Aggregates team lists across every competition currently marked "available" (already
 * cached per-competition by getTeams — cheap after the first warm-up) and returns only the
 * teams that actually matched a real football-data.org response. Mock-only competitions are
 * silently excluded so search results never present demo data as a real competition link.
 */
async function buildTeamIndex(): Promise<Map<string, TeamSearchResult>> {
  const availableCompetitions = competitions.filter((c) => c.status === "available");
  const index = new Map<string, TeamSearchResult>();

  await Promise.all(
    availableCompetitions.map(async (competition) => {
      const envelope = await getTeams(competition.id);
      if (envelope.isMock) return; // don't associate a team with a competition we couldn't really confirm

      const ref: TeamSearchCompetitionRef = {
        competitionId: competition.id,
        name: competition.name,
        code: competition.providerCompetitionCode ?? "",
        status: "available",
      };

      for (const team of envelope.data) {
        const existing = index.get(team.teamId);
        if (existing) {
          existing.competitions.push(ref);
        } else {
          index.set(team.teamId, {
            teamId: team.teamId,
            teamName: team.teamName,
            logo: team.logo,
            competitions: [ref],
          });
        }
      }
    })
  );

  return index;
}

export async function searchTeams(query: string): Promise<TeamSearchResult[]> {
  const needle = normalize(query.trim());
  if (!needle) return [];

  const index = await buildTeamIndex();
  return Array.from(index.values()).filter((team) => normalize(team.teamName).includes(needle));
}

export async function getCompetitionsForTeam(teamId: string): Promise<TeamSearchResult | null> {
  const index = await buildTeamIndex();
  return index.get(teamId) ?? null;
}
