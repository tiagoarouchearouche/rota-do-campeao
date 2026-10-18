import { resolveTeamSlug } from "@/lib/teamLogos";
import type { TeamStanding } from "@/services/sportsData/types";

/** Generic fallback for a team outside the known-20 alias table (e.g. newly promoted). */
function genericSlugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Short, human-friendly slug (e.g. "atletico-mineiro") used in team URLs. */
export function getTeamSlug(teamName: string): string {
  return resolveTeamSlug(teamName) ?? genericSlugify(teamName);
}

export function getTeamUrl(teamName: string): string {
  return `/brasileirao/time/${getTeamSlug(teamName)}`;
}

export function findTeamBySlug(standings: TeamStanding[], slug: string): TeamStanding | undefined {
  return standings.find((team) => getTeamSlug(team.teamName) === slug);
}
