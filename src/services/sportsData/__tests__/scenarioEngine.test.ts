import { describe, expect, it } from "vitest";
import {
  generateOptimisticScenario,
  generateRealisticScenario,
  generatePessimisticScenario,
} from "../calculations/scenarioEngine";
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

const team: TeamStanding = {
  teamId: "c",
  teamName: "Meio de Tabela",
  position: 3,
  played: 20,
  wins: 10,
  draws: 4,
  losses: 6,
  goalsFor: 30,
  goalsAgainst: 22,
  goalDifference: 8,
  points: 34,
};

const standings: TeamStanding[] = [
  { ...team, teamId: "a", teamName: "Líder", position: 1, points: 45, played: 20 },
  { ...team, teamId: "b", teamName: "Vice", position: 2, points: 40, played: 20 },
  team,
  { ...team, teamId: "d", teamName: "Quarto", position: 4, points: 30, played: 20 },
];

function remainingFixtures(count: number): Fixture[] {
  return Array.from({ length: count }, (_, index) => ({
    fixtureId: `c-opp-${index}`,
    date: new Date(2026, 5, index + 1).toISOString(),
    homeTeamId: "c",
    homeTeamName: "Meio de Tabela",
    awayTeamId: index % 2 === 0 ? "a" : "d",
    awayTeamName: index % 2 === 0 ? "Líder" : "Quarto",
    status: "scheduled" as const,
    round: `Rodada ${index + 1}`,
  }));
}

describe("generateOptimisticScenario", () => {
  it("projects more points than the pessimistic scenario", () => {
    const fixtures = remainingFixtures(10);
    const optimistic = generateOptimisticScenario(team, standings, fixtures, competition);
    const pessimistic = generatePessimisticScenario(team, standings, fixtures, competition);
    expect(optimistic.name).toBe("optimistic");
    expect(optimistic.projectedPoints).toBeGreaterThan(pessimistic.projectedPoints);
  });

  it("returns one simulated fixture per remaining game", () => {
    const fixtures = remainingFixtures(6);
    const result = generateOptimisticScenario(team, standings, fixtures, competition);
    expect(result.simulatedFixtures).toHaveLength(6);
  });
});

describe("generateRealisticScenario", () => {
  it("matches the points-per-game projection formula", () => {
    const fixtures = remainingFixtures(10);
    const result = generateRealisticScenario(team, standings, fixtures, competition);
    const ppg = team.points / team.played;
    const expected = Math.round(team.points + ppg * fixtures.length);
    expect(result.projectedPoints).toBe(expected);
  });
});

describe("generatePessimisticScenario", () => {
  it("projects fewer points than current pace continuing well", () => {
    const fixtures = remainingFixtures(10);
    const pessimistic = generatePessimisticScenario(team, standings, fixtures, competition);
    const realistic = generateRealisticScenario(team, standings, fixtures, competition);
    expect(pessimistic.projectedPoints).toBeLessThanOrEqual(realistic.projectedPoints);
  });
});
