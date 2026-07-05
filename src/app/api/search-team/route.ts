import { NextRequest, NextResponse } from "next/server";
import { searchTeams } from "@/services/sportsData/teamSearch";
import type { TeamSearchResponse } from "@/services/sportsData/types";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Informe ao menos 2 caracteres em ?query=" }, { status: 400 });
  }

  const results = await searchTeams(query);

  const response: TeamSearchResponse = {
    query,
    results,
    source: "football-data",
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response);
}
