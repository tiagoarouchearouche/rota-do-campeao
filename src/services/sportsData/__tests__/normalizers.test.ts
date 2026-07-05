import { describe, expect, it } from "vitest";
import {
  normalizeApiFootballStandings,
  normalizeApiFootballFixtures,
  normalizeApiFootballTeams,
} from "../normalizers/apiFootballNormalizer";
import {
  normalizeFootballDataStandings,
  normalizeFootballDataFixtures,
  normalizeFootballDataTeams,
} from "../normalizers/footballDataNormalizer";
import type { Competition } from "../types";

const competition: Competition = {
  id: "brasileirao-serie-a",
  name: "Brasileirão Série A",
  type: "league",
  provider: "api-football",
  providerLeagueId: 71,
  providerCompetitionCode: "BSA",
  season: 2026,
  hasRelegation: true,
  relegationSpots: 4,
  qualificationSpots: 6,
};

describe("normalizeApiFootballStandings", () => {
  const payload = {
    response: [
      {
        league: {
          standings: [
            [
              {
                rank: 1,
                team: { id: 127, name: "Flamengo", logo: "flamengo.png" },
                points: 45,
                goalsDiff: 10,
                all: { played: 20, win: 13, draw: 6, lose: 1, goals: { for: 35, against: 25 } },
              },
            ],
          ],
        },
      },
    ],
  };

  it("maps rows into internal TeamStanding shape", () => {
    const result = normalizeApiFootballStandings(payload, competition);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      teamId: "127",
      teamName: "Flamengo",
      position: 1,
      played: 20,
      wins: 13,
      draws: 6,
      losses: 1,
      goalsFor: 35,
      goalsAgainst: 25,
      goalDifference: 10,
      points: 45,
    });
  });

  it("returns an empty array for a malformed payload", () => {
    expect(normalizeApiFootballStandings({}, competition)).toEqual([]);
  });
});

describe("normalizeApiFootballFixtures", () => {
  it("maps fixture status codes into internal MatchStatus", () => {
    const payload = {
      response: [
        {
          fixture: { id: 1001, date: "2026-06-01T20:00:00Z", status: { short: "FT" } },
          league: { round: "Round 20" },
          teams: { home: { id: 1, name: "Flamengo" }, away: { id: 2, name: "Palmeiras" } },
          goals: { home: 2, away: 1 },
        },
      ],
    };
    const result = normalizeApiFootballFixtures(payload, competition);
    expect(result[0]).toMatchObject({
      fixtureId: "1001",
      homeTeamName: "Flamengo",
      awayTeamName: "Palmeiras",
      status: "finished",
      homeGoals: 2,
      awayGoals: 1,
    });
  });
});

describe("normalizeApiFootballTeams", () => {
  it("maps team entries into internal Team shape", () => {
    const payload = { response: [{ team: { id: 127, name: "Flamengo", country: "Brazil" } }] };
    const result = normalizeApiFootballTeams(payload, competition);
    expect(result[0]).toMatchObject({ teamId: "127", teamName: "Flamengo", country: "Brazil" });
  });
});

describe("normalizeFootballDataStandings", () => {
  const payload = {
    standings: [
      {
        type: "TOTAL",
        table: [
          {
            position: 1,
            team: { id: 1778, name: "Flamengo", crest: "flamengo.svg" },
            playedGames: 20,
            won: 13,
            draw: 6,
            lost: 1,
            points: 45,
            goalsFor: 35,
            goalsAgainst: 25,
            goalDifference: 10,
          },
        ],
      },
    ],
  };

  it("maps the TOTAL table into internal TeamStanding shape", () => {
    const result = normalizeFootballDataStandings(payload, competition);
    expect(result[0]).toMatchObject({
      teamId: "1778",
      teamName: "Flamengo",
      position: 1,
      points: 45,
      goalDifference: 10,
    });
  });

  it("returns an empty array for a malformed payload", () => {
    expect(normalizeFootballDataStandings({}, competition)).toEqual([]);
  });
});

describe("normalizeFootballDataFixtures", () => {
  it("maps FINISHED matches into internal MatchStatus", () => {
    const payload = {
      matches: [
        {
          id: 500,
          utcDate: "2026-06-01T20:00:00Z",
          status: "FINISHED",
          matchday: 20,
          homeTeam: { id: 1, name: "Flamengo" },
          awayTeam: { id: 2, name: "Palmeiras" },
          score: { fullTime: { home: 2, away: 1 } },
        },
      ],
    };
    const result = normalizeFootballDataFixtures(payload, competition);
    expect(result[0]).toMatchObject({ fixtureId: "500", status: "finished", homeGoals: 2, awayGoals: 1 });
  });
});

describe("normalizeFootballDataTeams", () => {
  it("maps team entries into internal Team shape", () => {
    const payload = { teams: [{ id: 1778, name: "Flamengo", area: { name: "Brazil" } }] };
    const result = normalizeFootballDataTeams(payload, competition);
    expect(result[0]).toMatchObject({ teamId: "1778", teamName: "Flamengo", country: "Brazil" });
  });
});
