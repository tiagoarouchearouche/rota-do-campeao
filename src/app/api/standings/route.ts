import { NextRequest, NextResponse } from "next/server";
import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitionId = searchParams.get("competitionId");
  const refresh = searchParams.get("refresh") === "true";

  if (!competitionId) {
    return NextResponse.json({ error: "competitionId é obrigatório" }, { status: 400 });
  }

  const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
    getStandings(competitionId, refresh),
    getFixtures(competitionId, refresh),
  ]);

  return NextResponse.json({
    ...standingsEnvelope,
    data: enrichStandings(standingsEnvelope.data, fixturesEnvelope.data),
  });
}
