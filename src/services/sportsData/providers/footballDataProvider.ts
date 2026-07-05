import type {
  Competition,
  CompetitionAvailability,
  Fixture,
  ProviderFetchResult,
  SportsDataProviderClient,
  Team,
  TeamStanding,
} from "../types";
import { fetchJson } from "./httpClient";
import { getFromCache, setCache } from "../cache/memoryCache";
import {
  normalizeFootballDataFixtures,
  normalizeFootballDataStandings,
  normalizeFootballDataTeams,
} from "../normalizers/footballDataNormalizer";

const BASE_URL = "https://api.football-data.org/v4";
const CATALOG_CACHE_KEY = "footballdata:catalog";
const CATALOG_TTL_SECONDS = 6 * 60 * 60; // the plan/coverage list changes rarely — cache it long

function getApiKey(): string | undefined {
  return process.env.FOOTBALL_DATA_KEY;
}

function headers(): Record<string, string> {
  return { "X-Auth-Token": getApiKey() ?? "" };
}

/** Competitions come from our own registry; football-data.org's /competitions list isn't used directly. */
async function fetchCompetitions(): Promise<ProviderFetchResult<Competition[]>> {
  return { ok: false, errorReason: "not_mapped" };
}

async function fetchStandings(competition: Competition): Promise<ProviderFetchResult<TeamStanding[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };
  if (!competition.providerCompetitionCode) return { ok: false, errorReason: "not_mapped" };

  const url = `${BASE_URL}/competitions/${competition.providerCompetitionCode}/standings?season=${competition.season}`;
  const result = await fetchJson<unknown>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<TeamStanding[]>;

  const standings = normalizeFootballDataStandings(result.data, competition);
  if (standings.length === 0) return { ok: false, errorReason: "invalid_data" };
  return { ok: true, data: standings };
}

async function fetchFixtures(competition: Competition): Promise<ProviderFetchResult<Fixture[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };
  if (!competition.providerCompetitionCode) return { ok: false, errorReason: "not_mapped" };

  const url = `${BASE_URL}/competitions/${competition.providerCompetitionCode}/matches?season=${competition.season}`;
  const result = await fetchJson<unknown>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<Fixture[]>;

  const fixtures = normalizeFootballDataFixtures(result.data, competition);
  if (fixtures.length === 0) return { ok: false, errorReason: "invalid_data" };
  return { ok: true, data: fixtures };
}

async function fetchTeams(competition: Competition): Promise<ProviderFetchResult<Team[]>> {
  if (!getApiKey()) return { ok: false, errorReason: "missing_key" };
  if (!competition.providerCompetitionCode) return { ok: false, errorReason: "not_mapped" };

  const url = `${BASE_URL}/competitions/${competition.providerCompetitionCode}/teams?season=${competition.season}`;
  const result = await fetchJson<unknown>(url, headers());
  if (!result.ok || !result.data) return result as ProviderFetchResult<Team[]>;

  const teams = normalizeFootballDataTeams(result.data, competition);
  if (teams.length === 0) return { ok: false, errorReason: "invalid_data" };
  return { ok: true, data: teams };
}

export const footballDataProvider: SportsDataProviderClient = {
  id: "football-data",
  fetchCompetitions,
  fetchStandings,
  fetchFixtures,
  fetchTeams,
};

type FootballDataCatalogEntry = { code: string; plan: string };

type FootballDataCompetitionsListResponse = {
  competitions?: Array<{ code?: string; plan?: string }>;
};

/**
 * Fetches football-data.org's own /competitions list once (heavily cached — this rarely
 * changes) so we can tell which of OUR registry entries are actually reachable on the
 * current plan. football-data.org tags each competition with a `plan` (e.g. "TIER_ONE" is
 * the free tier); anything else needs a paid subscription.
 */
async function fetchCatalog(): Promise<FootballDataCatalogEntry[] | null> {
  const cached = getFromCache<FootballDataCatalogEntry[]>(CATALOG_CACHE_KEY);
  if (cached) return cached;

  if (!getApiKey()) return null;

  const result = await fetchJson<FootballDataCompetitionsListResponse>(`${BASE_URL}/competitions`, headers());
  if (!result.ok || !result.data) return null;

  const entries = (result.data.competitions ?? [])
    .filter((c): c is { code: string; plan?: string } => Boolean(c?.code))
    .map((c) => ({ code: c.code, plan: c.plan ?? "UNKNOWN" }));

  if (entries.length === 0) return null;
  setCache(CATALOG_CACHE_KEY, entries, CATALOG_TTL_SECONDS);
  return entries;
}

/**
 * Resolves whether a registry competition is actually usable right now: confirms the code
 * exists in football-data.org's own catalog and that its plan tier matches what our key can
 * access. Returns the competition's own baseline `status` (unchanged) when the catalog can't
 * be checked (no key, network issue) — the existing fetch/fallback machinery already handles
 * that case gracefully by falling back to mock, so we never need to guess here.
 */
export async function resolveCompetitionAvailability(competition: Competition): Promise<CompetitionAvailability> {
  if (competition.status === "needs_mapping" || !competition.providerCompetitionCode) {
    return "needs_mapping";
  }

  const catalog = await fetchCatalog();
  if (!catalog) return competition.status ?? "available";

  const entry = catalog.find((c) => c.code === competition.providerCompetitionCode);
  if (!entry) return "needs_mapping";
  if (entry.plan !== "TIER_ONE") return "unavailable_plan";
  return "available";
}
