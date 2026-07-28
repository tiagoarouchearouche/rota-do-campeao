import { NextRequest, NextResponse } from "next/server";
import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";
import { getCompetitionById } from "@/services/sportsData/competitions/competitionRegistry";
import { apiError, competitionNotFoundResponse } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitionId = searchParams.get("competitionId");
  const refresh = searchParams.get("refresh") === "true";

  if (!competitionId) {
    return apiError(400, "missing_param", "competitionId é obrigatório");
  }
  if (!getCompetitionById(competitionId)) {
    return competitionNotFoundResponse(competitionId);
  }

  try {
    const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
      getStandings(competitionId, refresh),
      getFixtures(competitionId, refresh),
    ]);

    return NextResponse.json({
      ...standingsEnvelope,
      data: enrichStandings(standingsEnvelope.data, fixturesEnvelope.data),
    });
  } catch {
    return apiError(500, "internal_error", "Não foi possível carregar a tabela agora. Tente novamente.");
  }
}
