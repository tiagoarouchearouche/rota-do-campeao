import { NextRequest, NextResponse } from "next/server";
import { getFixtures } from "@/services/sportsData/sportsDataService";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const competitionId = searchParams.get("competitionId");
  const refresh = searchParams.get("refresh") === "true";

  if (!competitionId) {
    return NextResponse.json({ error: "competitionId é obrigatório" }, { status: 400 });
  }

  const result = await getFixtures(competitionId, refresh);
  return NextResponse.json(result);
}
