import type { Competition, Fixture, ProviderFetchResult, SportsDataProviderClient, Team, TeamStanding } from "../types";
import { fetchJson } from "./httpClient";
import {
  normalizeApiFootballFixtures,
  normalizeApiFootballStandings,
  normalizeApiFootballTeams,
} from "../normalizers/apiFootballNormalizer";

const BASE_URL = "https://v3.football.api-sports.io";

function getApiKey(): string | undefined {
  return process.env.API_FOOTBALL_KEY;
}

function headers(): Record<string, string> {
  return { "x-apisports-key": getApiKey() ?? "" };
}

/** API-Football has no single "list competitions" call relevant to our registry; competitions come from our own registry. */
async function fetchCompetitions(): Promise<ProviderFetchResult<Competition[]>> {
  return { ok: false, errorReason: "not_mapped" };
}

async function fetchStandings(competition: Competition): Promise<ProviderFetchResult<TeamStanding[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };
  if (!competition.providerLeagueId) return { ok: false, errorReason: "not_mapped" };

  const url = `${BASE_URL}/standings?league=${competition.providerLeagueId}&season=${competition.season}`;
  const result = await fetchJson<unknown>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<TeamStanding[]>;

  const standings = normalizeApiFootballStandings(result.data, competition);
  if (standings.length === 0) return { ok: false, errorReason: "invalid_data" };
  return { ok: true, data: standings };
}

async function fetchFixtures(competition: Competition): Promise<ProviderFetchResult<Fixture[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };
  if (!competition.providerLeagueId) return { ok: false, errorReason: "not_mapped" };

  const url = `${BASE_URL}/fixtures?league=${competition.providerLeagueId}&season=${competition.season}`;
  const result = await fetchJson<unknown>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<Fixture[]>;

  const fixtures = normalizeApiFootballFixtures(result.data, competition);
  if (fixtures.length === 0) return { ok: false, errorReason: "invalid_data" };
  return { ok: true, data: fixtures };
}

async function fetchTeams(competition: Competition): Promise<ProviderFetchResult<Team[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };
  if (!competition.providerLeagueId) return { ok: false, errorReason: "not_mapped" };

  const url = `${BASE_URL}/teams?league=${competition.providerLeagueId}&season=${competition.season}`;
  const result = await fetchJson<unknown>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<Team[]>;

  const teams = normalizeApiFootballTeams(result.data, competition);
  if (teams.length === 0) return { ok: false, errorReason: "invalid_data" };
  return { ok: true, data: teams };
}

export const apiFootballProvider: SportsDataProviderClient = {
  id: "api-football",
  fetchCompetitions,
  fetchStandings,
  fetchFixtures,
  fetchTeams,
};

export type LeagueSearchResult = {
  id: number;
  name: string;
  type?: string;
  country?: string;
  seasons: number[];
};

type ApiFootballLeagueSearchResponse = {
  response?: Array<{
    league?: { id: number; name: string; type?: string };
    country?: { name?: string };
    seasons?: Array<{ year: number }>;
  }>;
};

/**
 * Dev-only helper for mapping new competitions: looks up league IDs by name via
 * API-Football's /leagues?search= endpoint. Not used by any user-facing route —
 * intended to be called manually (e.g. via the /api/leagues-search internal route)
 * while filling in competitionRegistry.ts entries.
 */
export async function searchLeagues(query: string): Promise<ProviderFetchResult<LeagueSearchResult[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };

  const url = `${BASE_URL}/leagues?search=${encodeURIComponent(query)}`;
  const result = await fetchJson<ApiFootballLeagueSearchResponse>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<LeagueSearchResult[]>;

  const leagues = (result.data.response ?? [])
    .filter((item) => item?.league?.id && item?.league?.name)
    .map((item): LeagueSearchResult => ({
      id: item.league!.id,
      name: item.league!.name,
      type: item.league!.type,
      country: item.country?.name,
      seasons: (item.seasons ?? []).map((s) => s.year),
    }));

  return { ok: true, data: leagues };
}
