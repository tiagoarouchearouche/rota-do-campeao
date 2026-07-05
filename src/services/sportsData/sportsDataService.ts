import type {
  Competition,
  CompetitionAvailability,
  DataProvider,
  Fixture,
  ProviderFetchResult,
  SportsDataProviderClient,
  SportsDataProviderMode,
  Team,
  TeamStanding,
} from "./types";
import { buildCacheKey, getFromCache, setCache, clearCache } from "./cache/memoryCache";
import { competitions, getCompetitionById, isCompetitionMapped } from "./competitions/competitionRegistry";
import { mockProvider, MOCK_WARNING } from "./providers/mockProvider";
import { footballDataProvider, resolveCompetitionAvailability } from "./providers/footballDataProvider";

export type ServiceEnvelope<T> = {
  data: T;
  source: DataProvider;
  isMock: boolean;
  updatedAt: string;
  warning?: string;
  /** True when this response came straight from memoryCache instead of a fresh fetch. */
  cached?: boolean;
  /** Mirrors SHOW_TECHNICAL_DATA_STATUS — client components can't read that env var directly. */
  showTechnicalStatus?: boolean;
};

/** Server-only diagnostic log — never prints key values, only whether one is present. */
function logDataFetch(event: {
  competitionId: string;
  season: number;
  mode: SportsDataProviderMode;
  provider?: DataProvider;
  footballDataKeyPresent: boolean;
  httpErrorReason?: ProviderFetchResult<unknown>["errorReason"];
  cacheHit: boolean;
  fellBackToMock: boolean;
}): void {
  console.log(
    `[sportsData] competition=${event.competitionId} season=${event.season} mode=${event.mode} ` +
      `provider=${event.provider ?? "-"} footballDataKey=${event.footballDataKeyPresent} ` +
      `cacheHit=${event.cacheHit} fellBackToMock=${event.fellBackToMock}` +
      `${event.httpErrorReason ? ` reason=${event.httpErrorReason}` : ""}`
  );
}

function resolveProviderMode(): SportsDataProviderMode {
  const raw = process.env.SPORTS_DATA_PROVIDER?.trim().toLowerCase();
  return raw === "football-data" ? "football-data" : "mock";
}

function hasFootballDataKey(): boolean {
  return Boolean(process.env.FOOTBALL_DATA_KEY);
}

export function shouldShowTechnicalStatus(): boolean {
  return process.env.SHOW_TECHNICAL_DATA_STATUS === "true";
}

function warningForReason(reason?: ProviderFetchResult<unknown>["errorReason"]): string {
  switch (reason) {
    case "missing_key":
      return "Chave FOOTBALL_DATA_KEY não configurada. Exibindo dados demonstrativos.";
    case "invalid_key":
      return "Chave de API inválida ou expirada. Exibindo dados demonstrativos.";
    case "rate_limited":
      return "Limite de requisições da API atingido. Exibindo dados demonstrativos.";
    case "provider_down":
      return "Provedor de dados indisponível no momento. Exibindo dados demonstrativos.";
    case "not_mapped":
      return "Esta competição ainda não possui código confirmado na football-data.org. Exibindo dados demonstrativos.";
    case "network_error":
      return "Erro de rede ao buscar dados oficiais. Exibindo dados demonstrativos.";
    case "invalid_json":
    case "invalid_data":
      return "Dados recebidos da API estão incompletos. Exibindo dados demonstrativos.";
    case "timeout":
      return "Tempo de resposta da API excedido. Exibindo dados demonstrativos.";
    default:
      return MOCK_WARNING;
  }
}

function validateStandings(rows: TeamStanding[]): boolean {
  if (rows.length === 0) return false;
  return rows.every(
    (row) =>
      row.teamId &&
      row.teamName &&
      typeof row.position === "number" &&
      typeof row.played === "number" &&
      typeof row.wins === "number" &&
      typeof row.draws === "number" &&
      typeof row.losses === "number" &&
      typeof row.goalsFor === "number" &&
      typeof row.goalsAgainst === "number" &&
      typeof row.goalDifference === "number" &&
      typeof row.points === "number"
  );
}

function validateFixtures(rows: Fixture[]): boolean {
  if (rows.length === 0) return false;
  return rows.every(
    (row) =>
      row.fixtureId &&
      row.date &&
      row.homeTeamId &&
      row.homeTeamName &&
      row.awayTeamId &&
      row.awayTeamName &&
      row.status
  );
}

function validateTeams(rows: Team[]): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => row.teamId && row.teamName);
}

async function fetchWithFallback<T>(
  namespace: string,
  competition: Competition,
  refresh: boolean,
  fetcher: (provider: SportsDataProviderClient) => Promise<ProviderFetchResult<T>>,
  validate: (rows: T) => boolean,
  mockFetcher: (provider: SportsDataProviderClient) => Promise<ProviderFetchResult<T>>
): Promise<ServiceEnvelope<T>> {
  const cacheKey = buildCacheKey(namespace, { competitionId: competition.id, season: competition.season });
  const mode = resolveProviderMode();
  const footballDataKeyPresent = hasFootballDataKey();
  const showTechnicalStatus = shouldShowTechnicalStatus();

  if (!refresh) {
    const cached = getFromCache<ServiceEnvelope<T>>(cacheKey);
    if (cached) {
      logDataFetch({
        competitionId: competition.id,
        season: competition.season,
        mode,
        provider: cached.source,
        footballDataKeyPresent,
        cacheHit: true,
        fellBackToMock: cached.isMock,
      });
      return { ...cached, cached: true, showTechnicalStatus };
    }
  }

  const mapped = isCompetitionMapped(competition);

  if (mode === "football-data" && mapped) {
    if (footballDataKeyPresent) {
      const result = await fetcher(footballDataProvider);
      if (result.ok && result.data && validate(result.data)) {
        const envelope: ServiceEnvelope<T> = {
          data: result.data,
          source: "football-data",
          isMock: false,
          updatedAt: new Date().toISOString(),
          cached: false,
          showTechnicalStatus,
        };
        setCache(cacheKey, envelope);
        logDataFetch({
          competitionId: competition.id,
          season: competition.season,
          mode,
          provider: "football-data",
          footballDataKeyPresent,
          cacheHit: false,
          fellBackToMock: false,
        });
        return envelope;
      }

      const reason = result.errorReason ?? "invalid_data";
      const mockResult = await mockFetcher(mockProvider);
      const envelope: ServiceEnvelope<T> = {
        data: (mockResult.data as T) ?? (([] as unknown) as T),
        source: "mock",
        isMock: true,
        updatedAt: new Date().toISOString(),
        warning: warningForReason(reason),
        cached: false,
        showTechnicalStatus,
      };
      setCache(cacheKey, envelope);
      logDataFetch({
        competitionId: competition.id,
        season: competition.season,
        mode,
        provider: "mock",
        footballDataKeyPresent,
        httpErrorReason: reason,
        cacheHit: false,
        fellBackToMock: true,
      });
      return envelope;
    }

    const mockResult = await mockFetcher(mockProvider);
    const envelope: ServiceEnvelope<T> = {
      data: (mockResult.data as T) ?? (([] as unknown) as T),
      source: "mock",
      isMock: true,
      updatedAt: new Date().toISOString(),
      warning: warningForReason("missing_key"),
      cached: false,
      showTechnicalStatus,
    };
    setCache(cacheKey, envelope);
    logDataFetch({
      competitionId: competition.id,
      season: competition.season,
      mode,
      provider: "mock",
      footballDataKeyPresent,
      httpErrorReason: "missing_key",
      cacheHit: false,
      fellBackToMock: true,
    });
    return envelope;
  }

  const mockResult = await mockFetcher(mockProvider);
  const fallbackReason = !mapped ? "not_mapped" : undefined;
  const envelope: ServiceEnvelope<T> = {
    data: (mockResult.data as T) ?? (([] as unknown) as T),
    source: "mock",
    isMock: true,
    updatedAt: new Date().toISOString(),
    warning: !mapped ? warningForReason("not_mapped") : MOCK_WARNING,
    cached: false,
    showTechnicalStatus,
  };
  setCache(cacheKey, envelope);
  logDataFetch({
    competitionId: competition.id,
    season: competition.season,
    mode,
    provider: "mock",
    footballDataKeyPresent,
    httpErrorReason: fallbackReason,
    cacheHit: false,
    fellBackToMock: true,
  });
  return envelope;
}

export type CompetitionsQueryOptions = {
  showUnavailable?: boolean;
};

/**
 * Cross-references the registry against football-data.org's own /competitions catalog so the
 * home page only ever lists what's actually reachable on the configured plan. Falls back to
 * the registry's baseline status (never blocking) when the catalog can't be checked.
 */
export async function getCompetitions(
  options: CompetitionsQueryOptions = {}
): Promise<ServiceEnvelope<Competition[]>> {
  const mode = resolveProviderMode();
  const showTechnicalStatus = shouldShowTechnicalStatus();

  if (mode === "mock" || !hasFootballDataKey()) {
    return {
      data: options.showUnavailable ? competitions : competitions.filter((c) => c.status !== "needs_mapping"),
      source: "mock",
      isMock: true,
      updatedAt: new Date().toISOString(),
      warning: warningForReason("missing_key"),
      showTechnicalStatus,
    };
  }

  const resolved = await Promise.all(
    competitions.map(async (competition) => ({
      ...competition,
      status: await resolveCompetitionAvailability(competition),
    }))
  );

  const primary = resolved.filter((c) => c.status === "available");
  const data = options.showUnavailable ? resolved : primary;

  return {
    data,
    source: "football-data",
    isMock: false,
    updatedAt: new Date().toISOString(),
    showTechnicalStatus,
  };
}

export async function getStandings(
  competitionId: string,
  refresh = false
): Promise<ServiceEnvelope<TeamStanding[]> & { competition: Competition }> {
  const competition = getCompetitionById(competitionId);
  if (!competition) {
    return {
      data: [],
      source: "mock",
      isMock: true,
      updatedAt: new Date().toISOString(),
      warning: "Competição não encontrada. Exibindo dados demonstrativos.",
      competition: competitions[0],
    };
  }

  const envelope = await fetchWithFallback<TeamStanding[]>(
    "standings",
    competition,
    refresh,
    (provider) => provider.fetchStandings(competition),
    validateStandings,
    (provider) => provider.fetchStandings(competition)
  );

  return { ...envelope, competition };
}

export async function getFixtures(
  competitionId: string,
  refresh = false
): Promise<ServiceEnvelope<Fixture[]> & { competition: Competition }> {
  const competition = getCompetitionById(competitionId);
  if (!competition) {
    return {
      data: [],
      source: "mock",
      isMock: true,
      updatedAt: new Date().toISOString(),
      warning: "Competição não encontrada. Exibindo dados demonstrativos.",
      competition: competitions[0],
    };
  }

  const envelope = await fetchWithFallback<Fixture[]>(
    "fixtures",
    competition,
    refresh,
    (provider) => provider.fetchFixtures(competition),
    validateFixtures,
    (provider) => provider.fetchFixtures(competition)
  );

  return { ...envelope, competition };
}

export async function getTeams(
  competitionId: string,
  refresh = false
): Promise<ServiceEnvelope<Team[]> & { competition: Competition }> {
  const competition = getCompetitionById(competitionId);
  if (!competition) {
    return {
      data: [],
      source: "mock",
      isMock: true,
      updatedAt: new Date().toISOString(),
      warning: "Competição não encontrada. Exibindo dados demonstrativos.",
      competition: competitions[0],
    };
  }

  const envelope = await fetchWithFallback<Team[]>(
    "teams",
    competition,
    refresh,
    (provider) => provider.fetchTeams(competition),
    validateTeams,
    (provider) => provider.fetchTeams(competition)
  );

  return { ...envelope, competition };
}

/** Competitions considered "real" enough to include in cross-competition team search. */
export async function getAvailableCompetitions(): Promise<Competition[]> {
  const envelope = await getCompetitions();
  return envelope.data;
}

export function refreshAllCaches(): void {
  clearCache();
}

export type { CompetitionAvailability };
