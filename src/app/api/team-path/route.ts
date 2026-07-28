import { NextRequest, NextResponse } from "next/server";
import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import {
  calculatePointsNeededForTitle,
  calculatePointsNeededForQualification,
  calculatePointsNeededToAvoidRelegation,
  identifyDirectConfrontations,
} from "@/services/sportsData/calculations/pathEngine";
import {
  generateOptimisticScenario,
  generateRealisticScenario,
  generatePessimisticScenario,
} from "@/services/sportsData/calculations/scenarioEngine";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";
import { getCompetitionsForTeam } from "@/services/sportsData/teamSearch";
import { shouldShowTechnicalStatus } from "@/services/sportsData/sportsDataService";
import { getCompetitionById } from "@/services/sportsData/competitions/competitionRegistry";
import { apiError, competitionNotFoundResponse, teamNotFoundResponse } from "@/lib/apiErrors";
import type { TeamPathResponse } from "@/services/sportsData/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitionId = searchParams.get("competitionId");
  const teamId = searchParams.get("teamId");
  const refresh = searchParams.get("refresh") === "true";

  if (!competitionId || !teamId) {
    return apiError(400, "missing_param", "competitionId e teamId são obrigatórios");
  }

  // Guard against an unknown competitionId BEFORE fetching anything — sportsDataService
  // would otherwise silently substitute a fallback competition, which is how this route
  // used to crash the client with "Cannot read properties of undefined (reading 'season')".
  if (!getCompetitionById(competitionId)) {
    return competitionNotFoundResponse(competitionId);
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
      return teamNotFoundResponse(teamId, competitionId);
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

    const teamCompetitions = !standingsEnvelope.isMock ? await getCompetitionsForTeam(teamId) : null;
    const otherCompetitions = teamCompetitions?.competitions.filter((c) => c.competitionId !== competitionId) ?? [];

    const isMock = standingsEnvelope.isMock || fixturesEnvelope.isMock;
    const source = standingsEnvelope.isMock ? fixturesEnvelope.source : standingsEnvelope.source;
    const warning = standingsEnvelope.warning ?? fixturesEnvelope.warning;
    const cached = Boolean(standingsEnvelope.cached && fixturesEnvelope.cached);
    const updatedAt =
      standingsEnvelope.updatedAt > fixturesEnvelope.updatedAt
        ? standingsEnvelope.updatedAt
        : fixturesEnvelope.updatedAt;

    const response: TeamPathResponse = {
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
      otherCompetitions,
      ...(warning ? { warning } : {}),
    };

    return NextResponse.json(response);
  } catch {
    return apiError(500, "internal_error", "Não foi possível calcular a análise agora. Tente novamente.");
  }
}
