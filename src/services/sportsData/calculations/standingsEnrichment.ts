import type { Fixture, TeamStanding } from "../types";

function computeForm(teamId: string, fixtures: Fixture[]): string | undefined {
  const finished = fixtures
    .filter((f) => f.status === "finished" && (f.homeTeamId === teamId || f.awayTeamId === teamId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-5);

  if (finished.length === 0) return undefined;

  return finished
    .map((f) => {
      const isHome = f.homeTeamId === teamId;
      const goalsFor = (isHome ? f.homeGoals : f.awayGoals) ?? 0;
      const goalsAgainst = (isHome ? f.awayGoals : f.homeGoals) ?? 0;
      if (goalsFor > goalsAgainst) return "W";
      if (goalsFor < goalsAgainst) return "L";
      return "D";
    })
    .join("");
}

function computeNextMatch(teamId: string, fixtures: Fixture[]): string | undefined {
  // Deliberately excludes "postponed" — a match whose original date already passed and has no
  // confirmed new one is not "next", and showing it as such was the "jogo de julho aparecendo
  // em outubro" bug. If the only pending fixture is postponed, there's simply no known next
  // match to show (undefined), which is more honest than a stale date.
  const upcoming = fixtures
    .filter((f) => (f.status === "scheduled" || f.status === "live") && (f.homeTeamId === teamId || f.awayTeamId === teamId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const next = upcoming[0];
  if (!next) return undefined;

  const isHome = next.homeTeamId === teamId;
  const opponent = isHome ? next.awayTeamName : next.homeTeamName;
  const date = new Date(next.date);
  const formattedDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  return `${isHome ? "vs" : "@"} ${opponent} (${formattedDate})`;
}

/**
 * Fills in derived display fields (percentage, form, next match) on top of whatever a
 * provider already returned. Never overwrites a value the provider already supplied —
 * some providers (API-Football) include `form` natively and it should win over our guess.
 */
export function enrichStandings(standings: TeamStanding[], fixtures: Fixture[]): TeamStanding[] {
  return standings.map((team) => ({
    ...team,
    percentage: team.percentage ?? (team.played > 0 ? Math.round((team.points / (team.played * 3)) * 100) : 0),
    form: team.form ?? computeForm(team.teamId, fixtures),
    nextMatch: team.nextMatch ?? computeNextMatch(team.teamId, fixtures),
  }));
}
