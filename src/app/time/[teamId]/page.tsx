import { redirect, notFound } from "next/navigation";
import { getStandings } from "@/services/sportsData/sportsDataService";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { getTeamUrl } from "@/lib/teamSlug";

type Params = { teamId: string };

/** Legacy URL kept working via a permanent redirect to the slug-based /brasileirao/time/[slug]. */
export default async function LegacyTeamPathRedirect({ params }: { params: Promise<Params> }) {
  const { teamId } = await params;
  const { data: standings } = await getStandings(BRASILEIRAO_COMPETITION_ID);
  const team = standings.find((s) => s.teamId === teamId);
  if (!team) notFound();
  redirect(getTeamUrl(team.teamName));
}
