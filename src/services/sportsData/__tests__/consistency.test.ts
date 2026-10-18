import { describe, expect, it } from "vitest";
import {
  calculateMaximumPossiblePoints,
  calculatePointsNeededForTitle,
  calculatePointsNeededForQualification,
  calculatePointsNeededToAvoidRelegation,
} from "../calculations/pathEngine";
import {
  generateOptimisticScenario,
  generateRealisticScenario,
  generatePessimisticScenario,
} from "../calculations/scenarioEngine";
import type { Competition, Fixture, TeamStanding } from "../types";

/**
 * Cross-checks that the numbers shown across path analyses, scenarios and the "pontuação
 * máxima" figure can never contradict each other — e.g. a projected scenario claiming more
 * points than the team could mathematically reach, or a negative points-needed/remaining
 * value. These are invariants, not product-logic changes.
 */
const competition: Competition = {
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

function makeStanding(overrides: Partial<TeamStanding>): TeamStanding {
  return {
    teamId: "team",
    teamName: "Time",
    position: 10,
    played: 30,
    wins: 8,
    draws: 10,
    losses: 12,
    goalsFor: 30,
    goalsAgainst: 35,
    goalDifference: -5,
    points: 34,
    ...overrides,
  };
}

function makeRemainingFixtures(teamId: string, teamName: string, opponentIds: string[]): Fixture[] {
  return opponentIds.map((opponentId, index) => ({
    fixtureId: `${teamId}-vs-${opponentId}`,
    date: new Date(2026, 9, index + 1).toISOString(),
    homeTeamId: teamId,
    homeTeamName: teamName,
    awayTeamId: opponentId,
    awayTeamName: `Rival ${opponentId}`,
    status: "scheduled" as const,
  }));
}

const standings: TeamStanding[] = [
  makeStanding({ teamId: "leader", teamName: "Líder", position: 1, points: 66, played: 31 }),
  makeStanding({ teamId: "runner-up", teamName: "Vice", position: 2, points: 64, played: 30 }),
  makeStanding({ teamId: "mid", teamName: "Meio de Tabela", position: 10, points: 40, played: 30 }),
  makeStanding({ teamId: "z4", teamName: "Rebaixado", position: 17, points: 25, played: 31 }),
];

const mid = standings[2];
const fixtures = makeRemainingFixtures(mid.teamId, mid.teamName, ["a", "b", "c", "d", "e", "f", "g", "h"]);

describe("invariants across path analyses and scenarios", () => {
  it("maximum possible points is never lower than current points", () => {
    for (const team of standings) {
      expect(calculateMaximumPossiblePoints(team, fixtures)).toBeGreaterThanOrEqual(team.points);
    }
  });

  it("pointsNeeded is never negative for any target", () => {
    const title = calculatePointsNeededForTitle(mid, standings, fixtures, competition);
    const qualification = calculatePointsNeededForQualification(mid, standings, fixtures, competition);
    const relegation = calculatePointsNeededToAvoidRelegation(mid, standings, fixtures, competition);

    expect(title.pointsNeeded).toBeGreaterThanOrEqual(0);
    expect(qualification.pointsNeeded).toBeGreaterThanOrEqual(0);
    expect(relegation?.pointsNeeded ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("maximumPossiblePoints reported by a PathAnalysis matches the shared calculation and covers pointsNeeded when achievable", () => {
    const expectedMax = calculateMaximumPossiblePoints(mid, fixtures);
    const title = calculatePointsNeededForTitle(mid, standings, fixtures, competition);
    expect(title.maximumPossiblePoints).toBe(expectedMax);
    // riskLevel is only "critical" when pointsNeeded can legitimately exceed what's left to play for.
    if (title.riskLevel !== "critical") {
      expect(mid.points + title.pointsNeeded).toBeLessThanOrEqual(expectedMax);
    }
  });

  it("no scenario ever projects more points than the team could mathematically reach", () => {
    const max = calculateMaximumPossiblePoints(mid, fixtures);
    for (const scenario of [
      generateOptimisticScenario(mid, standings, fixtures, competition),
      generateRealisticScenario(mid, standings, fixtures, competition),
      generatePessimisticScenario(mid, standings, fixtures, competition),
    ]) {
      expect(scenario.projectedPoints).toBeLessThanOrEqual(max);
      expect(scenario.projectedPoints).toBeGreaterThanOrEqual(mid.points);
    }
  });

  it("the optimistic scenario never projects fewer points than the pessimistic one", () => {
    const optimistic = generateOptimisticScenario(mid, standings, fixtures, competition);
    const pessimistic = generatePessimisticScenario(mid, standings, fixtures, competition);
    expect(optimistic.projectedPoints).toBeGreaterThanOrEqual(pessimistic.projectedPoints);
  });
});
