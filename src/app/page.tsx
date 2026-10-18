import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";
import { getCurrentRound } from "@/services/sportsData/calculations/matchHelpers";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { BrasileiraoHomeClient } from "@/app/BrasileiraoHomeClient";

export default async function HomePage() {
  const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
    getStandings(BRASILEIRAO_COMPETITION_ID),
    getFixtures(BRASILEIRAO_COMPETITION_ID),
  ]);

  const standings = enrichStandings(standingsEnvelope.data, fixturesEnvelope.data);
  const { round, totalRounds } = getCurrentRound(fixturesEnvelope.data);

  const isMock = standingsEnvelope.isMock || fixturesEnvelope.isMock;
  const source = standingsEnvelope.isMock ? fixturesEnvelope.source : standingsEnvelope.source;
  const updatedAt =
    standingsEnvelope.updatedAt > fixturesEnvelope.updatedAt ? standingsEnvelope.updatedAt : fixturesEnvelope.updatedAt;

  return (
    <BrasileiraoHomeClient
      initialStandings={standings}
      initialFixtures={fixturesEnvelope.data}
      competition={standingsEnvelope.competition}
      round={round}
      totalRounds={totalRounds}
      isMock={isMock}
      source={source}
      updatedAt={updatedAt}
      cached={Boolean(standingsEnvelope.cached && fixturesEnvelope.cached)}
      showTechnicalStatus={standingsEnvelope.showTechnicalStatus}
    />
  );
}
