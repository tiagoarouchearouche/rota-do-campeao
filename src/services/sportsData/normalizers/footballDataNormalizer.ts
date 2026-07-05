import type { Competition, Fixture, MatchStatus, Team, TeamStanding } from "../types";

/** Minimal shapes of the football-data.org (v4) JSON payloads we consume. */
type FootballDataStandingRow = {
  position: number;
  team: { id: number; name: string; crest?: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference: number;
};

type FootballDataStandingsResponse = {
  standings?: Array<{ type?: string; group?: string | null; table?: FootballDataStandingRow[] }>;
};

type FootballDataMatchItem = {
  id: number;
  utcDate: string;
  status?: string;
  matchday?: number;
  venue?: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score?: { fullTime?: { home: number | null; away: number | null } };
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatchItem[];
};

type FootballDataTeamItem = {
  id: number;
  name: string;
  crest?: string;
  area?: { name?: string };
};

type FootballDataTeamsResponse = {
  teams?: FootballDataTeamItem[];
};

function mapMatchStatus(status?: string): MatchStatus {
  if (!status) return "scheduled";
  if (status === "FINISHED") return "finished";
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(status)) return "live";
  return "scheduled";
}

/**
 * League-style competitions return a single TOTAL table. Groups-stage tournaments (e.g. the
 * World Cup) return one TOTAL entry PER GROUP instead — we flatten all of them into one array
 * and tag each row with its `group` so callers can either treat it as one table (leagues) or
 * split it back into per-group mini-tables (see components/GroupStandings.tsx).
 */
export function normalizeFootballDataStandings(
  raw: unknown,
  _competition: Competition
): TeamStanding[] {
  const payload = raw as FootballDataStandingsResponse;
  const totalEntries = (payload.standings ?? []).filter((s) => s.type === "TOTAL" && s.table);
  const entries = totalEntries.length > 0 ? totalEntries : payload.standings?.slice(0, 1) ?? [];

  return entries.flatMap((entry) =>
    (entry.table ?? [])
      .filter((row) => row?.team && typeof row.position === "number")
      .map((row): TeamStanding => ({
        teamId: String(row.team.id),
        teamName: row.team.name,
        logo: row.team.crest,
        position: row.position,
        played: row.playedGames ?? 0,
        wins: row.won ?? 0,
        draws: row.draw ?? 0,
        losses: row.lost ?? 0,
        goalsFor: row.goalsFor ?? 0,
        goalsAgainst: row.goalsAgainst ?? 0,
        goalDifference: row.goalDifference ?? 0,
        points: row.points ?? 0,
        group: entry.group ?? undefined,
      }))
  );
}

export function normalizeFootballDataFixtures(raw: unknown, _competition: Competition): Fixture[] {
  const payload = raw as FootballDataMatchesResponse;
  const matches = payload.matches ?? [];

  return matches
    .filter((match) => match?.homeTeam && match?.awayTeam)
    .map((match): Fixture => ({
      fixtureId: String(match.id),
      date: match.utcDate,
      homeTeamId: String(match.homeTeam.id),
      homeTeamName: match.homeTeam.name,
      awayTeamId: String(match.awayTeam.id),
      awayTeamName: match.awayTeam.name,
      homeGoals: match.score?.fullTime?.home ?? undefined,
      awayGoals: match.score?.fullTime?.away ?? undefined,
      status: mapMatchStatus(match.status),
      round: match.matchday ? `Rodada ${match.matchday}` : undefined,
      venue: match.venue,
    }));
}

export function normalizeFootballDataTeams(raw: unknown, _competition: Competition): Team[] {
  const payload = raw as FootballDataTeamsResponse;
  const teams = payload.teams ?? [];

  return teams
    .filter((team) => team?.id && team?.name)
    .map((team): Team => ({
      teamId: String(team.id),
      teamName: team.name,
      logo: team.crest,
      country: team.area?.name,
    }));
}
