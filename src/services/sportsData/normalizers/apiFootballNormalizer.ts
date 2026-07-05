import type { Competition, Fixture, MatchStatus, Team, TeamStanding } from "../types";

/** Minimal shapes of the API-Football (v3) JSON payloads we consume. */
type ApiFootballStandingRow = {
  rank: number;
  team: { id: number; name: string; logo?: string };
  points: number;
  goalsDiff: number;
  form?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
};

type ApiFootballStandingsResponse = {
  response?: Array<{ league?: { standings?: ApiFootballStandingRow[][] } }>;
};

type ApiFootballFixtureItem = {
  fixture: { id: number; date: string; status?: { short?: string }; venue?: { name?: string } };
  league?: { round?: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
};

type ApiFootballFixturesResponse = {
  response?: ApiFootballFixtureItem[];
};

type ApiFootballTeamItem = {
  team: { id: number; name: string; logo?: string; country?: string };
};

type ApiFootballTeamsResponse = {
  response?: ApiFootballTeamItem[];
};

function mapFixtureStatus(shortStatus?: string): MatchStatus {
  if (!shortStatus) return "scheduled";
  if (["FT", "AET", "PEN"].includes(shortStatus)) return "finished";
  if (["1H", "2H", "HT", "ET", "LIVE", "BT", "P"].includes(shortStatus)) return "live";
  return "scheduled";
}

export function normalizeApiFootballStandings(
  raw: unknown,
  _competition: Competition
): TeamStanding[] {
  const payload = raw as ApiFootballStandingsResponse;
  const groups = payload.response?.[0]?.league?.standings ?? [];
  const rows = groups.flat();

  return rows
    .filter((row) => row?.team && typeof row.rank === "number")
    .map((row): TeamStanding => ({
      teamId: String(row.team.id),
      teamName: row.team.name,
      logo: row.team.logo,
      position: row.rank,
      played: row.all?.played ?? 0,
      wins: row.all?.win ?? 0,
      draws: row.all?.draw ?? 0,
      losses: row.all?.lose ?? 0,
      goalsFor: row.all?.goals?.for ?? 0,
      goalsAgainst: row.all?.goals?.against ?? 0,
      goalDifference: row.goalsDiff ?? 0,
      points: row.points ?? 0,
      form: row.form,
    }));
}

export function normalizeApiFootballFixtures(raw: unknown, _competition: Competition): Fixture[] {
  const payload = raw as ApiFootballFixturesResponse;
  const items = payload.response ?? [];

  return items
    .filter((item) => item?.fixture && item?.teams?.home && item?.teams?.away)
    .map((item): Fixture => ({
      fixtureId: String(item.fixture.id),
      date: item.fixture.date,
      homeTeamId: String(item.teams.home.id),
      homeTeamName: item.teams.home.name,
      awayTeamId: String(item.teams.away.id),
      awayTeamName: item.teams.away.name,
      homeGoals: item.goals?.home ?? undefined,
      awayGoals: item.goals?.away ?? undefined,
      status: mapFixtureStatus(item.fixture.status?.short),
      round: item.league?.round,
      venue: item.fixture.venue?.name,
    }));
}

export function normalizeApiFootballTeams(raw: unknown, _competition: Competition): Team[] {
  const payload = raw as ApiFootballTeamsResponse;
  const items = payload.response ?? [];

  return items
    .filter((item) => item?.team)
    .map((item): Team => ({
      teamId: String(item.team.id),
      teamName: item.team.name,
      logo: item.team.logo,
      country: item.team.country,
    }));
}
