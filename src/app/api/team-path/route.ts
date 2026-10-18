import { NextRequest, NextResponse } from "next/server";
import { getTeamPathData } from "@/services/sportsData/teamPath";
import { apiError } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitionId = searchParams.get("competitionId");
  const teamId = searchParams.get("teamId");
  const refresh = searchParams.get("refresh") === "true";

  if (!competitionId || !teamId) {
    return apiError(400, "missing_param", "competitionId e teamId são obrigatórios");
  }

  const result = await getTeamPathData(competitionId, teamId, refresh);
  if (!result.ok) {
    return apiError(result.status, result.code, result.message);
  }
  return NextResponse.json(result.data);
}
