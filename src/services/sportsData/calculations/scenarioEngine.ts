import type { Competition, Fixture, ScenarioName, ScenarioResult, TeamStanding, TeamStatus } from "../types";

function getRemainingFixtures(team: TeamStanding, fixtures: Fixture[]): Fixture[] {
  return fixtures
    .filter((f) => f.status !== "finished" && (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

type Outcome = "win" | "draw" | "loss";

/** Largest-remainder style distribution so ratios (e.g. 70/20/10) are spread evenly across the fixtures instead of clustered. */
function distributeOutcomes(count: number, winRatio: number, drawRatio: number): Outcome[] {
  const outcomes: Outcome[] = [];
  let wins = 0;
  let draws = 0;
  for (let i = 1; i <= count; i++) {
    if (wins < winRatio * i) {
      outcomes.push("win");
      wins++;
    } else if (draws < drawRatio * i) {
      outcomes.push("draw");
      draws++;
    } else {
      outcomes.push("loss");
    }
  }
  return outcomes;
}

function applyOutcomeToFixture(fixture: Fixture, team: TeamStanding, outcome: Outcome): Fixture {
  const isHome = fixture.homeTeamId === team.teamId;
  const scorelines: Record<Outcome, [number, number]> = {
    win: [2, 1],
    draw: [1, 1],
    loss: [0, 1],
  };
  const [forGoals, againstGoals] = scorelines[outcome];

  return {
    ...fixture,
    homeGoals: isHome ? forGoals : againstGoals,
    awayGoals: isHome ? againstGoals : forGoals,
  };
}

function pointsForOutcome(outcome: Outcome): number {
  return outcome === "win" ? 3 : outcome === "draw" ? 1 : 0;
}

function deriveProjectedStatus(position: number, totalTeams: number, competition: Competition): TeamStatus {
  const titleWindow = Math.max(competition.titleSpots ?? 1, 4);
  if (position <= titleWindow) return "title_race";
  if (competition.qualificationSpots && position <= competition.qualificationSpots) return "qualification_zone";
  if (competition.hasRelegation && competition.relegationSpots) {
    const relegationLine = totalTeams - competition.relegationSpots;
    if (position > relegationLine) return "relegation_zone";
    if (position > relegationLine - 3) return "relegation_risk";
  }
  return "mid_table";
}

function projectPosition(
  team: TeamStanding,
  projectedPoints: number,
  standings: TeamStanding[],
  fixtures: Fixture[]
): number {
  const projections = standings.map((other) => {
    if (other.teamId === team.teamId) return { teamId: other.teamId, points: projectedPoints };
    const otherRemaining = getRemainingFixtures(other, fixtures).length;
    const ppg = other.played > 0 ? other.points / other.played : 0;
    return { teamId: other.teamId, points: other.points + ppg * otherRemaining };
  });

  projections.sort((a, b) => b.points - a.points);
  const index = projections.findIndex((p) => p.teamId === team.teamId);
  return index === -1 ? team.position : index + 1;
}

function buildScenario(
  name: ScenarioName,
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  competition: Competition,
  projectedPointsOverride: number | undefined,
  winRatio: number,
  drawRatio: number,
  messageBuilder: (ctx: { projectedPoints: number; projectedPosition: number; status: TeamStatus }) => string
): ScenarioResult {
  const remaining = getRemainingFixtures(team, fixtures);
  const outcomes = distributeOutcomes(remaining.length, winRatio, drawRatio);
  const simulatedFixtures = remaining.map((fixture, i) => applyOutcomeToFixture(fixture, team, outcomes[i]));

  const projectedPoints =
    projectedPointsOverride ?? team.points + outcomes.reduce((sum, o) => sum + pointsForOutcome(o), 0);
  const roundedPoints = Math.round(projectedPoints);
  const projectedPosition = projectPosition(team, roundedPoints, standings, fixtures);
  const projectedStatus = deriveProjectedStatus(projectedPosition, standings.length, competition);

  return {
    name,
    projectedPoints: roundedPoints,
    projectedPosition,
    projectedStatus,
    message: messageBuilder({ projectedPoints: roundedPoints, projectedPosition, status: projectedStatus }),
    simulatedFixtures,
  };
}

const STATUS_LABEL: Record<TeamStatus, string> = {
  title_race: "na briga pelo título",
  qualification_zone: "na zona de classificação",
  mid_table: "no meio de tabela",
  relegation_risk: "em risco de rebaixamento",
  relegation_zone: "na zona de rebaixamento",
};

export function generateOptimisticScenario(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  competition: Competition
): ScenarioResult {
  return buildScenario(
    "optimistic",
    team,
    standings,
    fixtures,
    competition,
    undefined,
    0.7,
    0.2,
    ({ projectedPoints, projectedPosition, status }) =>
      `Em um cenário otimista, vencendo a maioria dos jogos restantes, ${team.teamName} pode chegar a ${projectedPoints} pontos e terminar na ${projectedPosition}ª posição, ficando ${STATUS_LABEL[status]}.`
  );
}

export function generateRealisticScenario(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  competition: Competition
): ScenarioResult {
  const remaining = getRemainingFixtures(team, fixtures);
  const ppg = team.played > 0 ? team.points / team.played : 1;
  const projectedPoints = team.points + ppg * remaining.length;
  const winRatio = Math.max(0, Math.min(1, (ppg - 0.25) / 3));
  const drawRatio = 0.25;

  return buildScenario(
    "realistic",
    team,
    standings,
    fixtures,
    competition,
    projectedPoints,
    winRatio,
    drawRatio,
    ({ projectedPoints: pts, projectedPosition, status }) =>
      `Mantendo a média atual de pontos por jogo, ${team.teamName} projeta ${pts} pontos ao final da competição e terminaria na ${projectedPosition}ª posição, ficando ${STATUS_LABEL[status]}.`
  );
}

export function generatePessimisticScenario(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  competition: Competition
): ScenarioResult {
  return buildScenario(
    "pessimistic",
    team,
    standings,
    fixtures,
    competition,
    undefined,
    0.25,
    0.3,
    ({ projectedPoints, projectedPosition, status }) =>
      `Em um cenário pessimista, com perda de pontos importantes, ${team.teamName} cairia para ${projectedPoints} pontos e a ${projectedPosition}ª posição, ficando ${STATUS_LABEL[status]}.`
  );
}
