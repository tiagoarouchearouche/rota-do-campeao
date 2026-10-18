import type { Fixture, TeamStanding } from "../types";

/**
 * Single source of truth for "which fixtures belong to this team", "how many games does it
 * have left", "what's the current round" and "how should a given fixture's status be
 * displayed" — every component used to reimplement a slightly different version of these,
 * which is how a team's "próximos jogos" ended up showing other teams' matches, and how a
 * single stale POSTPONED fixture could make the whole site think the season was many rounds
 * behind where it actually is.
 */

function isTeamFixture(fixture: Fixture, teamId: string): boolean {
  return fixture.homeTeamId === teamId || fixture.awayTeamId === teamId;
}

function byDateAscending(a: Fixture, b: Fixture): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

export function getTeamFixtures(fixtures: Fixture[], teamId: string): Fixture[] {
  return fixtures.filter((f) => isTeamFixture(f, teamId));
}

/**
 * Games the team still has to play — finished ones excluded. Postponed games DO count: the
 * team still owes that match, it just lacks a confirmed date. Excluding them here would make
 * "pontuação máxima possível" undercount real remaining opportunities.
 */
export function getRemainingMatches(team: TeamStanding, fixtures: Fixture[]): Fixture[] {
  return getTeamFixtures(fixtures, team.teamId).filter((f) => f.status !== "finished");
}

export function getRemainingPoints(team: TeamStanding, fixtures: Fixture[]): number {
  return Math.max(0, getRemainingMatches(team, fixtures).length) * 3;
}

export function getMaximumPossiblePoints(team: TeamStanding, fixtures: Fixture[]): number {
  return team.points + getRemainingPoints(team, fixtures);
}

/**
 * The next N fixtures this specific team actually has confirmed (scheduled or live),
 * chronologically ordered. Postponed matches are deliberately excluded from this "what's
 * next" list — showing a game whose original date already passed as if it were a normal
 * upcoming match is exactly the "jogo de julho aparecendo em outubro" bug. Use
 * `getTeamPostponedMatches` to surface those separately, with their own "adiada" label.
 */
export function getTeamUpcomingMatches(fixtures: Fixture[], teamId: string, limit?: number): Fixture[] {
  const upcoming = getTeamFixtures(fixtures, teamId)
    .filter((f) => f.status === "scheduled" || f.status === "live")
    .sort(byDateAscending);
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export function getTeamPostponedMatches(fixtures: Fixture[], teamId: string): Fixture[] {
  return getTeamFixtures(fixtures, teamId).filter((f) => f.status === "postponed");
}

export type CurrentRoundInfo = { round: number | null; totalRounds: number | null };

/**
 * The season's current round, derived from how far play has actually progressed — NOT from
 * "the lowest round number with any non-finished fixture", which breaks the moment a single
 * match gets postponed (it would peg the whole site to that old round forever, even once
 * every other team is 10 rounds further along). A round only "blocks" progress if it still
 * has a genuinely scheduled/live fixture; a round where the only pending fixture is postponed
 * is treated as settled for this purpose.
 */
export function getCurrentRound(fixtures: Fixture[]): CurrentRoundInfo {
  const roundsInOrder: string[] = [];
  for (const fixture of fixtures) {
    if (fixture.round && !roundsInOrder.includes(fixture.round)) roundsInOrder.push(fixture.round);
  }
  if (roundsInOrder.length === 0) return { round: null, totalRounds: null };

  let currentIndex = roundsInOrder.length - 1; // default: season fully settled, last round stands
  for (let i = 0; i < roundsInOrder.length; i++) {
    const hasGenuinelyPending = fixtures.some((f) => f.round === roundsInOrder[i] && f.status === "scheduled");
    const hasLive = fixtures.some((f) => f.round === roundsInOrder[i] && f.status === "live");
    if (hasGenuinelyPending || hasLive) {
      currentIndex = i;
      break;
    }
  }

  const currentRoundLabel = roundsInOrder[currentIndex];
  const parsed = currentRoundLabel.match(/\d+/);
  return {
    round: parsed ? Number(parsed[0]) : currentIndex + 1,
    totalRounds: roundsInOrder.length,
  };
}

export type MatchDisplayStatus =
  | { kind: "finished"; homeGoals: number; awayGoals: number }
  | { kind: "live" }
  | { kind: "postponed" }
  | { kind: "scheduled"; date: Date };

/** Normalizes a fixture's status into exactly what a display component needs to render it. */
export function getMatchDisplayStatus(fixture: Fixture): MatchDisplayStatus {
  if (fixture.status === "finished") {
    return { kind: "finished", homeGoals: fixture.homeGoals ?? 0, awayGoals: fixture.awayGoals ?? 0 };
  }
  if (fixture.status === "live") return { kind: "live" };
  if (fixture.status === "postponed") return { kind: "postponed" };
  return { kind: "scheduled", date: new Date(fixture.date) };
}
