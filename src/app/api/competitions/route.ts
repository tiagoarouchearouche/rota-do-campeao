import { NextRequest, NextResponse } from "next/server";
import { getCompetitions } from "@/services/sportsData/sportsDataService";

export async function GET(request: NextRequest) {
  const showUnavailable = request.nextUrl.searchParams.get("showUnavailable") === "true";
  const result = await getCompetitions({ showUnavailable });
  return NextResponse.json(result);
}
