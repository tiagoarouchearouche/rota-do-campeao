import { describe, expect, it } from "vitest";
import {
  getCurrentRound,
  getMatchDisplayStatus,
  getMaximumPossiblePoints,
  getRemainingMatches,
  getTeamPostponedMatches,
  getTeamUpcomingMatches,
} from "../calculations/matchHelpers";
import type { Fixture, TeamStanding } from "../types";

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    fixtureId: "f",
    date: "2026-01-01T00:00:00Z",
    homeTeamId: "a",
    homeTeamName: "A",
    awayTeamId: "b",
    awayTeamName: "B",
    status: "finished",
    ...overrides,
  };
}

function makeStanding(overrides: Partial<TeamStanding>): TeamStanding {
  return {
    teamId: "a",
    teamName: "A",
    position: 1,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    ...overrides,
  };
}

describe("getCurrentRound", () => {
  it("does not get stuck on a round whose only pending fixture is postponed", () => {
    const fixtures: Fixture[] = [
      makeFixture({ fixtureId: "r21-a", round: "Rodada 21", status: "finished" }),
      makeFixture({ fixtureId: "r21-b", round: "Rodada 21", status: "postponed", date: "2026-07-01T00:00:00Z" }),
      makeFixture({ fixtureId: "r22-a", round: "Rodada 22", status: "finished" }),
      makeFixture({ fixtureId: "r30-a", round: "Rodada 30", status: "finished" }),
      makeFixture({ fixtureId: "r31-a", round: "Rodada 31", status: "scheduled", date: "2026-10-20T00:00:00Z" }),
      makeFixture({ fixtureId: "r38-a", round: "Rodada 38", status: "scheduled", date: "2026-12-01T00:00:00Z" }),
    ];

    expect(getCurrentRound(fixtures)).toEqual({ round: 31, totalRounds: 5 });
  });

  it("treats the last round as current once the whole season is finished or postponed", () => {
    const fixtures: Fixture[] = [
      makeFixture({ fixtureId: "1", round: "Rodada 1", status: "finished" }),
      makeFixture({ fixtureId: "2", round: "Rodada 2", status: "postponed" }),
    ];
    expect(getCurrentRound(fixtures)).toEqual({ round: 2, totalRounds: 2 });
  });

  it("returns nulls when fixtures have no round info", () => {
    expect(getCurrentRound([makeFixture({ round: undefined })])).toEqual({ round: null, totalRounds: null });
  });
});

describe("getTeamUpcomingMatches", () => {
  const fixtures: Fixture[] = [
    makeFixture({ fixtureId: "own-scheduled", homeTeamId: "a", awayTeamId: "c", status: "scheduled", date: "2026-11-01T00:00:00Z" }),
    makeFixture({ fixtureId: "own-postponed", homeTeamId: "a", awayTeamId: "d", status: "postponed", date: "2026-07-01T00:00:00Z" }),
    makeFixture({ fixtureId: "other-team", homeTeamId: "x", awayTeamId: "y", status: "scheduled", date: "2026-10-01T00:00:00Z" }),
  ];

  it("only returns the given team's own fixtures", () => {
    const upcoming = getTeamUpcomingMatches(fixtures, "a");
    expect(upcoming.every((f) => f.homeTeamId === "a" || f.awayTeamId === "a")).toBe(true);
    expect(upcoming.find((f) => f.fixtureId === "other-team")).toBeUndefined();
  });

  it("excludes postponed fixtures from the normal upcoming list", () => {
    const upcoming = getTeamUpcomingMatches(fixtures, "a");
    expect(upcoming.find((f) => f.fixtureId === "own-postponed")).toBeUndefined();
  });

  it("still exposes postponed fixtures via the dedicated getter", () => {
    const postponed = getTeamPostponedMatches(fixtures, "a");
    expect(postponed.map((f) => f.fixtureId)).toEqual(["own-postponed"]);
  });
});

describe("getRemainingMatches / getMaximumPossiblePoints", () => {
  it("counts postponed fixtures as still-remaining (they still owe the points)", () => {
    const team = makeStanding({ teamId: "a", points: 50 });
    const fixtures: Fixture[] = [
      makeFixture({ homeTeamId: "a", awayTeamId: "b", status: "finished" }),
      makeFixture({ homeTeamId: "a", awayTeamId: "c", status: "postponed" }),
      makeFixture({ homeTeamId: "a", awayTeamId: "d", status: "scheduled" }),
    ];
    expect(getRemainingMatches(team, fixtures)).toHaveLength(2);
    expect(getMaximumPossiblePoints(team, fixtures)).toBe(56);
  });

  it("never returns a negative remaining count", () => {
    const team = makeStanding({ teamId: "a", points: 10 });
    expect(getRemainingMatches(team, [])).toHaveLength(0);
    expect(getMaximumPossiblePoints(team, [])).toBe(10);
  });
});

describe("getMatchDisplayStatus", () => {
  it("maps postponed fixtures to their own display kind instead of a stale date", () => {
    expect(getMatchDisplayStatus(makeFixture({ status: "postponed", date: "2026-07-01T00:00:00Z" }))).toEqual({
      kind: "postponed",
    });
  });
});
