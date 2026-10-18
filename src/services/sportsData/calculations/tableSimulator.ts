import type { Fixture, TeamStanding } from "../types";

export type MatchOverride = "home" | "draw" | "away";

type Totals = {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

/**
 * Recomputes the table after applying user-chosen results to a subset of the
 * remaining (not-yet-finished) fixtures. Finished fixtures are never touched.
 * Scorelines are simplified (1-0 / 1-1 / 0-1), same simplification scenarioEngine
 * already uses for optimistic/realistic/pessimistic projections — this is a
 * what-if tool, not a score predictor, so the exact scoreline doesn't matter,
 * only the points/goal-difference delta.
 */
export function applySimulatedResults(
  standings: TeamStanding[],
  fixtures: Fixture[],
  overrides: Record<string, MatchOverride>
): TeamStanding[] {
  const deltas = new Map<string, Totals>();

  const getDelta = (teamId: string): Totals => {
    const existing = deltas.get(teamId);
    if (existing) return existing;
    const created: Totals = { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
    deltas.set(teamId, created);
    return created;
  };

  for (const fixture of fixtures) {
    if (fixture.status === "finished") continue;
    const override = overrides[fixture.fixtureId];
    if (!override) continue;

    const home = getDelta(fixture.homeTeamId);
    const away = getDelta(fixture.awayTeamId);

    if (override === "home") {
      home.wins++;
      home.points += 3;
      home.goalsFor += 1;
      away.losses++;
      away.goalsAgainst += 1;
    } else if (override === "away") {
      away.wins++;
      away.points += 3;
      away.goalsFor += 1;
      home.losses++;
      home.goalsAgainst += 1;
    } else {
      home.draws++;
      home.points += 1;
      home.goalsFor += 1;
      home.goalsAgainst += 1;
      away.draws++;
      away.points += 1;
      away.goalsFor += 1;
      away.goalsAgainst += 1;
    }
  }

  const simulated = standings.map((team) => {
    const delta = deltas.get(team.teamId);
    if (!delta) return { ...team };
    const played = team.played + delta.wins + delta.draws + delta.losses;
    const goalsFor = team.goalsFor + delta.goalsFor;
    const goalsAgainst = team.goalsAgainst + delta.goalsAgainst;
    return {
      ...team,
      played,
      wins: team.wins + delta.wins,
      draws: team.draws + delta.draws,
      losses: team.losses + delta.losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: team.points + delta.points,
      percentage: played > 0 ? Math.round(((team.points + delta.points) / (played * 3)) * 100) : team.percentage,
    };
  });

  simulated.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return simulated.map((team, index) => ({ ...team, position: index + 1 }));
}
