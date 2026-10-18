import { getStandings, getFixtures } from "@/services/sportsData/sportsDataService";
import { enrichStandings } from "@/services/sportsData/calculations/standingsEnrichment";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { BrasileiraoHomeClient } from "@/app/BrasileiraoHomeClient";

function computeRoundInfo(fixtures: { round?: string; status: string }[]): { round?: number; totalRounds?: number } {
  const roundsInOrder: string[] = [];
  for (const fixture of fixtures) {
    if (fixture.round && !roundsInOrder.includes(fixture.round)) roundsInOrder.push(fixture.round);
  }
  if (roundsInOrder.length === 0) return {};

  const firstUpcoming = fixtures.find((f) => f.status !== "finished" && f.round);
  const currentRoundLabel = firstUpcoming?.round ?? roundsInOrder[roundsInOrder.length - 1];
  const index = roundsInOrder.indexOf(currentRoundLabel);
  const parsed = currentRoundLabel.match(/\d+/);

  return {
    round: parsed ? Number(parsed[0]) : index + 1,
    totalRounds: roundsInOrder.length,
  };
}

export default async function HomePage() {
  const [standingsEnvelope, fixturesEnvelope] = await Promise.all([
    getStandings(BRASILEIRAO_COMPETITION_ID),
    getFixtures(BRASILEIRAO_COMPETITION_ID),
  ]);

  const standings = enrichStandings(standingsEnvelope.data, fixturesEnvelope.data);
  const { round, totalRounds } = computeRoundInfo(fixturesEnvelope.data);

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
