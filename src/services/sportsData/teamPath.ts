import { getStandings, getFixtures, shouldShowTechnicalStatus } from "./sportsDataService";
import {
  calculatePointsNeededForTitle,
  calculatePointsNeededForQualification,
  calculatePointsNeededToAvoidRelegation,
  identifyDirectConfrontations,
} from "./calculations/pathEngine";
import {
  generateOptimisticScenario,
  generateRealisticScenario,
  generatePessimisticScenario,
} from "./calculations/scenarioEngine";
import { enrichStandings } from "./calculations/standingsEnrichment";
import { getCompetitionById } from "./competitions/competitionRegistry";
import type { ApiErrorCode } from "@/lib/apiErrors";
import type { TeamPathResponse } from "./types";

export type TeamPathResult =
  | { ok: true; data: TeamPathResponse }
  | { ok: false; code: ApiErrorCode; message: string; status: number };

/**
 * Builds the full team-path analysis (path analyses, scenarios, decisive matches).
 * Shared by `/api/team-path` (client-side refresh) and the team page's server
 * component (first render) so the calculation logic lives in exactly one place.
 */
export async function getTeamPathData(competitionId: string, teamId: string, refresh = false): Promise<TeamPathResult> {
  // Guard against an unknown competitionId BEFORE fetching anything — sportsDataService
  // would otherwise silently substitute a fallback competition, which is how this route
  // used to crash the client with "Cannot read properties of undefined (reading 'season')".
  if (!getCompetitionById(competitionId)) {
    return {
      ok: false,
      code: "competition_not_found",
      message: `Competição "${competitionId}" não existe ou foi removida.`,
      status: 404,
    };
  }

  try {
    const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
      getStandings(competitionId, refresh),
      getFixtures(competitionId, refresh),
    ]);

    const { competition } = standingsEnvelope;
    const { data: fixtures } = fixturesEnvelope;
    const standings = enrichStandings(standingsEnvelope.data, fixtures);

    const team = standings.find((s) => s.teamId === teamId);
    if (!team) {
      return {
        ok: false,
        code: "team_not_found",
        message: `Time "${teamId}" não foi encontrado na competição "${competitionId}".`,
        status: 404,
      };
    }

    const pathToTitle = calculatePointsNeededForTitle(team, standings, fixtures, competition);
    const pathToQualification = calculatePointsNeededForQualification(team, standings, fixtures, competition);
    const pathToAvoidRelegation = calculatePointsNeededToAvoidRelegation(team, standings, fixtures, competition);

    const scenarios = {
      optimistic: generateOptimisticScenario(team, standings, fixtures, competition),
      realistic: generateRealisticScenario(team, standings, fixtures, competition),
      pessimistic: generatePessimisticScenario(team, standings, fixtures, competition),
    };

    const decisiveMatches = identifyDirectConfrontations(team, standings, fixtures);

    const isMock = standingsEnvelope.isMock || fixturesEnvelope.isMock;
    const source = standingsEnvelope.isMock ? fixturesEnvelope.source : standingsEnvelope.source;
    const warning = standingsEnvelope.warning ?? fixturesEnvelope.warning;
    const cached = Boolean(standingsEnvelope.cached && fixturesEnvelope.cached);
    const updatedAt =
      standingsEnvelope.updatedAt > fixturesEnvelope.updatedAt ? standingsEnvelope.updatedAt : fixturesEnvelope.updatedAt;

    const data: TeamPathResponse = {
      team,
      competition,
      standings,
      fixtures,
      pathToTitle,
      pathToQualification,
      ...(pathToAvoidRelegation ? { pathToAvoidRelegation } : {}),
      scenarios,
      decisiveMatches,
      source,
      updatedAt,
      isMock,
      cached,
      showTechnicalStatus: shouldShowTechnicalStatus(),
      ...(warning ? { warning } : {}),
    };

    return { ok: true, data };
  } catch {
    return {
      ok: false,
      code: "internal_error",
      message: "Não foi possível calcular a análise agora. Tente novamente.",
      status: 500,
    };
  }
}
