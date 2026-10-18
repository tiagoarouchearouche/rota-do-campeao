import { describe, expect, it } from "vitest";
import { resolveTeamObjective } from "../calculations/teamObjective";
import type { Competition, TeamStanding } from "../types";

const brasileirao: Competition = {
  id: "brasileirao-serie-a",
  name: "Brasileirão Série A",
  type: "league",
  provider: "football-data",
  season: 2026,
  hasRelegation: true,
  relegationSpots: 4,
  qualificationSpots: 6,
  titleSpots: 1,
};

function makeStandings(count: number): TeamStanding[] {
  return Array.from({ length: count }, (_, index) => ({
    teamId: String(index + 1),
    teamName: `Time ${index + 1}`,
    position: index + 1,
    played: 30,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    // `status` intentionally omitted — real football-data.org rows never set it, which is
    // exactly the production bug this resolver exists to avoid depending on.
  }));
}

describe("resolveTeamObjective", () => {
  const standings = makeStandings(20);

  it("returns 'title' for the leader even without TeamStanding.status set", () => {
    expect(resolveTeamObjective(standings[0], standings, brasileirao)).toBe("title");
  });

  it("returns 'title' for the runner-up (within the broader title window)", () => {
    expect(resolveTeamObjective(standings[1], standings, brasileirao)).toBe("title");
  });

  it("returns 'pre-libertadores' for 5th/6th place", () => {
    expect(resolveTeamObjective(standings[4], standings, brasileirao)).toBe("pre-libertadores");
  });

  it("returns 'sula' for 7th-12th place", () => {
    expect(resolveTeamObjective(standings[6], standings, brasileirao)).toBe("sula");
  });

  it("returns 'relegation' for the bottom 4 without TeamStanding.status set", () => {
    expect(resolveTeamObjective(standings[19], standings, brasileirao)).toBe("relegation");
  });

  it("returns 'risk' just above the relegation line", () => {
    expect(resolveTeamObjective(standings[14], standings, brasileirao)).toBe("risk");
  });

  it("returns 'mid' for a safely mid-table position", () => {
    expect(resolveTeamObjective(standings[12], standings, brasileirao)).toBe("mid");
  });
});
