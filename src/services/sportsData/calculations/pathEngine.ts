import type { Competition, Fixture, PathAnalysis, RiskLevel, TeamStanding } from "../types";

function getRemainingFixtures(team: TeamStanding, fixtures: Fixture[]): Fixture[] {
  return fixtures.filter(
    (f) => f.status !== "finished" && (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId)
  );
}

function computeSafetyMargin(remainingGames: number): number {
  if (remainingGames <= 0) return 0;
  if (remainingGames <= 5) return 3;
  if (remainingGames <= 10) return 5;
  if (remainingGames <= 15) return 7;
  return 9;
}

function minimumWins(pointsNeeded: number): number {
  if (pointsNeeded <= 0) return 0;
  return Math.ceil(pointsNeeded / 3);
}

function deriveRiskLevel(pointsNeeded: number, remainingGames: number): RiskLevel {
  if (pointsNeeded <= 0) return "low";
  const maxAdditional = Math.max(1, remainingGames * 3);
  if (pointsNeeded > maxAdditional) return "critical";
  const ratio = pointsNeeded / maxAdditional;
  if (ratio <= 0.35) return "low";
  if (ratio <= 0.6) return "medium";
  if (ratio <= 0.85) return "high";
  return "critical";
}

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "baixo",
  medium: "médio",
  high: "alto",
  critical: "crítico",
};

export function calculateMaximumPossiblePoints(team: TeamStanding, fixtures: Fixture[]): number {
  const remaining = getRemainingFixtures(team, fixtures);
  return team.points + remaining.length * 3;
}

/**
 * Decisive matches = remaining games against opponents currently close to the
 * team in the table. The same "nearby rival" window naturally covers title
 * races (rivals near the top) and relegation battles (rivals near the bottom).
 */
export function identifyDirectConfrontations(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[]
): Fixture[] {
  const teamStanding = standings.find((s) => s.teamId === team.teamId) ?? team;
  const windowSize = 4;
  const rivalIds = new Set(
    standings
      .filter((s) => s.teamId !== team.teamId && Math.abs(s.position - teamStanding.position) <= windowSize)
      .map((s) => s.teamId)
  );

  return fixtures.filter(
    (f) =>
      f.status !== "finished" &&
      (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId) &&
      (rivalIds.has(f.homeTeamId) || rivalIds.has(f.awayTeamId))
  );
}

export function calculatePointsNeededForTitle(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  _competition: Competition
): PathAnalysis {
  const remaining = getRemainingFixtures(team, fixtures);
  const maximumPossiblePoints = calculateMaximumPossiblePoints(team, fixtures);
  const sorted = [...standings].sort((a, b) => a.position - b.position);
  const leader = sorted[0] ?? team;
  const margin = computeSafetyMargin(remaining.length);
  const estimatedCutLine = (leader.teamId === team.teamId ? team.points : leader.points) + margin;
  const pointsNeeded = Math.max(0, estimatedCutLine - team.points);
  const riskLevel = deriveRiskLevel(pointsNeeded, remaining.length);
  const keyMatches = identifyDirectConfrontations(team, standings, fixtures);

  const message =
    pointsNeeded <= 0
      ? `${team.teamName} está na ${team.position}ª posição com ${team.points} pontos e já reúne condições de brigar pelo título com a pontuação atual, mas precisa manter a regularidade nos jogos restantes.`
      : `${team.teamName} está na ${team.position}ª posição com ${team.points} pontos. Ainda pode chegar a ${maximumPossiblePoints} pontos. Para disputar o título, precisa buscar aproximadamente ${pointsNeeded} pontos nos jogos restantes, o que equivale a pelo menos ${minimumWins(
          pointsNeeded
        )} vitórias ou combinação equivalente. O risco de não conseguir é ${RISK_LABEL[riskLevel]}.`;

  return {
    target: "title",
    currentPoints: team.points,
    currentPosition: team.position,
    pointsNeeded,
    maximumPossiblePoints,
    minimumWinsNeeded: minimumWins(pointsNeeded),
    estimatedCutLine,
    message,
    keyMatches,
    riskLevel,
  };
}

export function calculatePointsNeededForQualification(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  competition: Competition
): PathAnalysis {
  const remaining = getRemainingFixtures(team, fixtures);
  const maximumPossiblePoints = calculateMaximumPossiblePoints(team, fixtures);
  const sorted = [...standings].sort((a, b) => a.position - b.position);
  const qualificationSpots = competition.qualificationSpots ?? Math.max(1, Math.round(sorted.length / 2));
  const cutLineTeam = sorted[qualificationSpots - 1] ?? sorted[sorted.length - 1];
  const margin = computeSafetyMargin(remaining.length);
  const estimatedCutLine =
    (team.position <= qualificationSpots ? Math.min(team.points, cutLineTeam.points) : cutLineTeam.points) + margin;
  const pointsNeeded = Math.max(0, estimatedCutLine - team.points);
  const riskLevel = deriveRiskLevel(pointsNeeded, remaining.length);
  const keyMatches = identifyDirectConfrontations(team, standings, fixtures);

  const message =
    pointsNeeded <= 0
      ? `${team.teamName} ocupa a ${team.position}ª posição, dentro da zona de classificação, com boa margem sobre a linha de corte.`
      : `Para garantir classificação, ${team.teamName} precisa buscar cerca de ${pointsNeeded} pontos nos jogos restantes (aproximadamente ${minimumWins(
          pointsNeeded
        )} vitórias). O risco de ficar fora da zona de classificação é ${RISK_LABEL[riskLevel]}.`;

  return {
    target: "qualification",
    currentPoints: team.points,
    currentPosition: team.position,
    pointsNeeded,
    maximumPossiblePoints,
    minimumWinsNeeded: minimumWins(pointsNeeded),
    estimatedCutLine,
    message,
    keyMatches,
    riskLevel,
  };
}

export function calculatePointsNeededToAvoidRelegation(
  team: TeamStanding,
  standings: TeamStanding[],
  fixtures: Fixture[],
  competition: Competition
): PathAnalysis | null {
  if (!competition.hasRelegation || !competition.relegationSpots) return null;

  const remaining = getRemainingFixtures(team, fixtures);
  const maximumPossiblePoints = calculateMaximumPossiblePoints(team, fixtures);
  const sorted = [...standings].sort((a, b) => a.position - b.position);
  const totalTeams = sorted.length;
  const safeLineIndex = Math.max(0, totalTeams - competition.relegationSpots - 1);
  const safeLineTeam = sorted[safeLineIndex] ?? sorted[totalTeams - 1];
  const margin = computeSafetyMargin(remaining.length);
  const estimatedCutLine = safeLineTeam.points + margin;
  const pointsNeeded = Math.max(0, estimatedCutLine - team.points);
  const riskLevel = deriveRiskLevel(pointsNeeded, remaining.length);
  const keyMatches = identifyDirectConfrontations(team, standings, fixtures);

  const relegationLinePosition = totalTeams - competition.relegationSpots;
  const message =
    pointsNeeded <= 0 && team.position <= relegationLinePosition
      ? `${team.teamName} está na ${team.position}ª posição, fora da zona de rebaixamento, com risco ${RISK_LABEL[riskLevel]} de queda.`
      : `${team.teamName} está na ${team.position}ª posição com ${team.points} pontos. Para sair/se manter fora da zona de rebaixamento, precisa buscar aproximadamente ${pointsNeeded} pontos nos jogos restantes. O cenário é ${RISK_LABEL[riskLevel]} porque depende de resultados diretos e do desempenho dos concorrentes.`;

  return {
    target: "avoid_relegation",
    currentPoints: team.points,
    currentPosition: team.position,
    pointsNeeded,
    maximumPossiblePoints,
    minimumWinsNeeded: minimumWins(pointsNeeded),
    estimatedCutLine,
    message,
    keyMatches,
    riskLevel,
  };
}
