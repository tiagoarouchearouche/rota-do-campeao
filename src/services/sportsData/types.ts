export type DataProvider = "api-football" | "football-data" | "mock";

export type CompetitionType = "league" | "cup" | "groups" | "knockout";

export type TeamStatus =
  | "title_race"
  | "qualification_zone"
  | "mid_table"
  | "relegation_risk"
  | "relegation_zone";

export type MatchStatus = "scheduled" | "live" | "finished";

export type CompetitionAvailability = "available" | "unavailable_plan" | "coming_soon" | "needs_mapping";

export type Competition = {
  id: string;
  name: string;
  country?: string;
  continent?: string;
  type: CompetitionType;
  provider: DataProvider;
  providerLeagueId?: string | number;
  providerCompetitionCode?: string;
  season: number;
  hasRelegation: boolean;
  relegationSpots?: number;
  qualificationSpots?: number;
  titleSpots?: number;
  status?: CompetitionAvailability;
};

export type Team = {
  teamId: string;
  teamName: string;
  shortName?: string;
  logo?: string;
  country?: string;
};

export type TeamStanding = {
  teamId: string;
  teamName: string;
  logo?: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Last-5 results, oldest first, e.g. "WWDLW". Not all providers/competitions expose this. */
  form?: string;
  /** Human-readable opponent + date of the next scheduled fixture, e.g. "vs Palmeiras (15/07)". */
  nextMatch?: string;
  /** Point-take percentage: points / (played * 3) * 100, rounded. Always derivable, so always present when played > 0. */
  percentage?: number;
  status?: TeamStatus;
  /** Group name for groups-stage tournaments (e.g. World Cup "Group A"). Absent for regular leagues. */
  group?: string;
};

export type Fixture = {
  fixtureId: string;
  date: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeGoals?: number;
  awayGoals?: number;
  status: MatchStatus;
  round?: string;
  venue?: string;
};

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type PathAnalysis = {
  target: "title" | "qualification" | "avoid_relegation";
  currentPoints: number;
  currentPosition: number;
  pointsNeeded: number;
  maximumPossiblePoints: number;
  minimumWinsNeeded: number;
  estimatedCutLine: number;
  message: string;
  keyMatches: Fixture[];
  riskLevel: RiskLevel;
};

export type ScenarioName = "optimistic" | "realistic" | "pessimistic";

export type ScenarioResult = {
  name: ScenarioName;
  projectedPoints: number;
  projectedPosition: number;
  projectedStatus: TeamStatus;
  message: string;
  simulatedFixtures: Fixture[];
};

export type ApiEnvelope<T> = {
  data: T;
  source: DataProvider;
  updatedAt: string;
  isMock: boolean;
  warning?: string;
  /** True when this response came straight from the in-memory cache instead of a fresh fetch. */
  cached?: boolean;
  /** Mirrors SHOW_TECHNICAL_DATA_STATUS server-side — client components can't read that env var directly. */
  showTechnicalStatus?: boolean;
};

export type CompetitionsResponse = ApiEnvelope<Competition[]>;

export type StandingsResponse = ApiEnvelope<TeamStanding[]> & {
  competition: Competition;
};

export type FixturesResponse = ApiEnvelope<Fixture[]> & {
  competition: Competition;
};

export type TeamsResponse = ApiEnvelope<Team[]> & {
  competition: Competition;
};

export type TeamPathResponse = {
  team: TeamStanding;
  competition: Competition;
  standings: TeamStanding[];
  fixtures: Fixture[];
  pathToTitle: PathAnalysis;
  pathToQualification: PathAnalysis;
  pathToAvoidRelegation?: PathAnalysis;
  scenarios: {
    optimistic: ScenarioResult;
    realistic: ScenarioResult;
    pessimistic: ScenarioResult;
  };
  decisiveMatches: Fixture[];
  source: DataProvider;
  updatedAt: string;
  isMock: boolean;
  warning?: string;
  cached?: boolean;
  showTechnicalStatus?: boolean;
  otherCompetitions?: TeamSearchCompetitionRef[];
};

/**
 * Only "football-data" (real) and "mock" (fallback) are reachable from the app's
 * configuration. API-Football support still exists in providers/apiFootballProvider.ts
 * but is intentionally disconnected from sportsDataService and the UI — see CLAUDE.md.
 */
export type SportsDataProviderMode = "football-data" | "mock";

export type TeamSearchCompetitionRef = {
  competitionId: string;
  name: string;
  code: string;
  status: CompetitionAvailability;
};

export type TeamSearchResult = {
  teamId: string;
  teamName: string;
  logo?: string;
  competitions: TeamSearchCompetitionRef[];
};

export type TeamSearchResponse = {
  query: string;
  results: TeamSearchResult[];
  source: DataProvider;
  updatedAt: string;
};

/** Raw fetch result from an external provider before validation/normalization. */
export type ProviderFetchResult<T> = {
  ok: boolean;
  data?: T;
  errorReason?:
    | "missing_key"
    | "invalid_key"
    | "rate_limited"
    | "provider_down"
    | "not_mapped"
    | "network_error"
    | "invalid_json"
    | "timeout"
    | "invalid_data";
};

/** Common contract every data provider (real or mock) must implement. */
export interface SportsDataProviderClient {
  readonly id: DataProvider;
  fetchCompetitions(): Promise<ProviderFetchResult<Competition[]>>;
  fetchStandings(competition: Competition): Promise<ProviderFetchResult<TeamStanding[]>>;
  fetchFixtures(competition: Competition): Promise<ProviderFetchResult<Fixture[]>>;
  fetchTeams(competition: Competition): Promise<ProviderFetchResult<Team[]>>;
}
