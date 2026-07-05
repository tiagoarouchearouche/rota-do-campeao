import { describe, expect, it } from "vitest";
import {
  calculateMaximumPossiblePoints,
  calculatePointsNeededForTitle,
  calculatePointsNeededForQualification,
  calculatePointsNeededToAvoidRelegation,
  identifyDirectConfrontations,
} from "../calculations/pathEngine";
import type { Competition, Fixture, TeamStanding } from "../types";

const competition: Competition = {
  id: "test-league",
  name: "Liga de Teste",
  type: "league",
  provider: "mock",
  season: 2026,
  hasRelegation: true,
  relegationSpots: 2,
  qualificationSpots: 2,
  titleSpots: 1,
};

function makeStanding(overrides: Partial<TeamStanding>): TeamStanding {
  return {
    teamId: "team",
    teamName: "Time",
    position: 1,
    played: 20,
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

const standings: TeamStanding[] = [
  makeStanding({ teamId: "a", teamName: "Líder", position: 1, points: 50 }),
  makeStanding({ teamId: "b", teamName: "Vice", position: 2, points: 45 }),
  makeStanding({ teamId: "c", teamName: "Meio de Tabela", position: 3, points: 40 }),
  makeStanding({ teamId: "d", teamName: "Quarto", position: 4, points: 35 }),
  makeStanding({ teamId: "e", teamName: "Penúltimo", position: 5, points: 15 }),
  makeStanding({ teamId: "f", teamName: "Lanterna", position: 6, points: 10 }),
];

function makeRemainingFixtures(teamId: string, opponents: string[]): Fixture[] {
  return opponents.map((opponentId, index) => ({
    fixtureId: `${teamId}-${opponentId}-${index}`,
    date: new Date(2026, 5, index + 1).toISOString(),
    homeTeamId: teamId,
    homeTeamName: teamId,
    awayTeamId: opponentId,
    awayTeamName: opponentId,
    status: "scheduled",
    round: `Rodada ${index + 1}`,
  }));
}

describe("calculateMaximumPossiblePoints", () => {
  it("adds 3 points per remaining fixture to current points", () => {
    const team = standings[2];
    const fixtures = makeRemainingFixtures("c", ["a", "b", "d"]);
    expect(calculateMaximumPossiblePoints(team, fixtures)).toBe(40 + 3 * 3);
  });

  it("returns current points when there are no remaining fixtures", () => {
    const team = standings[0];
    expect(calculateMaximumPossiblePoints(team, [])).toBe(50);
  });
});

describe("calculatePointsNeededForTitle", () => {
  it("requires only a small safety-margin buffer when the team already leads", () => {
    const fixtures = makeRemainingFixtures("a", ["b", "c"]);
    const result = calculatePointsNeededForTitle(standings[0], standings, fixtures, competition);
    expect(result.target).toBe("title");
    expect(result.pointsNeeded).toBeLessThanOrEqual(3);
    expect(["low", "medium"]).toContain(result.riskLevel);
  });

  it("requires positive points for a team trailing the leader", () => {
    const fixtures = makeRemainingFixtures("c", ["a", "b", "d", "e", "f"]);
    const result = calculatePointsNeededForTitle(standings[2], standings, fixtures, competition);
    expect(result.pointsNeeded).toBeGreaterThan(0);
    expect(result.minimumWinsNeeded).toBe(Math.ceil(result.pointsNeeded / 3));
  });
});

describe("calculatePointsNeededForQualification", () => {
  it("is satisfied for a team comfortably inside the qualification zone", () => {
    const fixtures = makeRemainingFixtures("a", ["c"]);
    const result = calculatePointsNeededForQualification(standings[0], standings, fixtures, competition);
    expect(result.target).toBe("qualification");
    expect(result.pointsNeeded).toBe(0);
  });

  it("requires points for a team outside the qualification zone", () => {
    const fixtures = makeRemainingFixtures("e", ["a", "b", "f"]);
    const result = calculatePointsNeededForQualification(standings[4], standings, fixtures, competition);
    expect(result.pointsNeeded).toBeGreaterThan(0);
  });
});

describe("calculatePointsNeededToAvoidRelegation", () => {
  it("returns null when the competition has no relegation", () => {
    const noRelegationCompetition: Competition = { ...competition, hasRelegation: false, relegationSpots: undefined };
    const fixtures = makeRemainingFixtures("f", ["a"]);
    const result = calculatePointsNeededToAvoidRelegation(standings[5], standings, fixtures, noRelegationCompetition);
    expect(result).toBeNull();
  });

  it("flags a high/critical risk for the bottom team", () => {
    const fixtures = makeRemainingFixtures("f", ["a", "b"]);
    const result = calculatePointsNeededToAvoidRelegation(standings[5], standings, fixtures, competition);
    expect(result).not.toBeNull();
    expect(result?.pointsNeeded).toBeGreaterThan(0);
    expect(["high", "critical"]).toContain(result?.riskLevel);
  });

  it("is low risk for a team clear of the relegation zone", () => {
    const fixtures = makeRemainingFixtures("a", ["b", "c"]);
    const result = calculatePointsNeededToAvoidRelegation(standings[0], standings, fixtures, competition);
    expect(result?.riskLevel).toBe("low");
  });
});

describe("identifyDirectConfrontations", () => {
  const wideStandings: TeamStanding[] = [
    ...standings,
    makeStanding({ teamId: "g", teamName: "Sétimo", position: 7, points: 8 }),
    makeStanding({ teamId: "h", teamName: "Oitavo", position: 8, points: 6 }),
  ];

  it("only returns remaining fixtures against nearby rivals", () => {
    const fixtures: Fixture[] = [
      ...makeRemainingFixtures("c", ["b"]),
      ...makeRemainingFixtures("c", ["h"]),
    ];
    const result = identifyDirectConfrontations(standings[2], wideStandings, fixtures);
    expect(result.some((f) => f.awayTeamId === "b")).toBe(true);
    expect(result.some((f) => f.awayTeamId === "h")).toBe(false);
  });

  it("excludes already finished fixtures", () => {
    const fixtures: Fixture[] = [
      { ...makeRemainingFixtures("c", ["b"])[0], status: "finished", homeGoals: 1, awayGoals: 1 },
    ];
    const result = identifyDirectConfrontations(standings[2], standings, fixtures);
    expect(result).toHaveLength(0);
  });
});
