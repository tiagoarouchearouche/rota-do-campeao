import { NextRequest, NextResponse } from "next/server";
import { getCompetitionsForTeam } from "@/services/sportsData/teamSearch";

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId é obrigatório" }, { status: 400 });
  }

  const result = await getCompetitionsForTeam(teamId);
  if (!result) {
    return NextResponse.json({ teamId, competitions: [] });
  }

  return NextResponse.json({
    teamId: result.teamId,
    teamName: result.teamName,
    logo: result.logo,
    competitions: result.competitions,
    source: "football-data",
    updatedAt: new Date().toISOString(),
  });
}
