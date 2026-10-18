import { describe, expect, it } from "vitest";
import { applySimulatedResults } from "../calculations/tableSimulator";
import type { Fixture, TeamStanding } from "../types";

function makeStanding(overrides: Partial<TeamStanding>): TeamStanding {
  return {
    teamId: "team",
    teamName: "Time",
    position: 1,
    played: 10,
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

function makeFixture(overrides: Partial<Fixture>): Fixture {
  return {
    fixtureId: "f1",
    date: "2026-11-01T00:00:00Z",
    homeTeamId: "a",
    homeTeamName: "A",
    awayTeamId: "b",
    awayTeamName: "B",
    status: "scheduled",
    ...overrides,
  };
}

describe("applySimulatedResults", () => {
  const standings: TeamStanding[] = [
    makeStanding({ teamId: "a", teamName: "A", points: 10, position: 2 }),
    makeStanding({ teamId: "b", teamName: "B", points: 12, position: 1 }),
  ];

  it("awards 3 points and adjusts goal difference for a home win override", () => {
    const fixtures = [makeFixture({ fixtureId: "f1", homeTeamId: "a", awayTeamId: "b" })];
    const result = applySimulatedResults(standings, fixtures, { f1: "home" });

    const a = result.find((t) => t.teamId === "a")!;
    const b = result.find((t) => t.teamId === "b")!;
    expect(a.points).toBe(13);
    expect(a.position).toBe(1);
    expect(b.points).toBe(12);
    expect(b.position).toBe(2);
  });

  it("splits points evenly for a draw override", () => {
    const fixtures = [makeFixture({ fixtureId: "f1", homeTeamId: "a", awayTeamId: "b" })];
    const result = applySimulatedResults(standings, fixtures, { f1: "draw" });

    expect(result.find((t) => t.teamId === "a")!.points).toBe(11);
    expect(result.find((t) => t.teamId === "b")!.points).toBe(13);
  });

  it("never touches finished fixtures even if an override is present", () => {
    const fixtures = [makeFixture({ fixtureId: "f1", homeTeamId: "a", awayTeamId: "b", status: "finished", homeGoals: 1, awayGoals: 0 })];
    const result = applySimulatedResults(standings, fixtures, { f1: "away" });

    expect(result.find((t) => t.teamId === "a")!.points).toBe(10);
    expect(result.find((t) => t.teamId === "b")!.points).toBe(12);
  });

  it("ignores fixtures without an override", () => {
    const fixtures = [makeFixture({ fixtureId: "f1", homeTeamId: "a", awayTeamId: "b" })];
    const result = applySimulatedResults(standings, fixtures, {});

    expect(result.find((t) => t.teamId === "a")!.points).toBe(10);
    expect(result.find((t) => t.teamId === "b")!.points).toBe(12);
  });
});
