import Link from "next/link";
import { Trophy, ShieldAlert, TriangleAlert, Globe2, ArrowRight } from "lucide-react";
import type { Competition, Fixture, TeamStanding } from "@/services/sportsData/types";
import {
  calculateMaximumPossiblePoints,
  calculatePointsNeededForTitle,
  calculatePointsNeededForQualification,
  calculatePointsNeededToAvoidRelegation,
} from "@/services/sportsData/calculations/pathEngine";
import { resolveTeamObjective, type TeamObjective } from "@/services/sportsData/calculations/teamObjective";
import { getTeamUrl } from "@/lib/teamSlug";
import { TeamLogo } from "@/components/TeamLogo";

const MOOD_CONFIG: Record<TeamObjective, { label: string; icon: typeof Trophy; tone: string; cta: string }> = {
  title: { label: "Disputando o título", icon: Trophy, tone: "text-success", cta: "Ver rota para o título" },
  libertadores: { label: "Na zona de Libertadores", icon: Trophy, tone: "text-success", cta: "Ver rota para a Libertadores" },
  "pre-libertadores": { label: "Na zona de pré-Libertadores", icon: Globe2, tone: "text-info", cta: "Ver rota para a Libertadores" },
  sula: { label: "Na zona de Sul-Americana", icon: Globe2, tone: "text-sula", cta: "Ver rota para a Sul-Americana" },
  mid: { label: "Meio de tabela", icon: ArrowRight, tone: "text-muted", cta: "Ver análise completa" },
  risk: { label: "Risco de rebaixamento", icon: TriangleAlert, tone: "text-warning", cta: "Ver rota para escapar" },
  relegation: { label: "Zona de rebaixamento", icon: ShieldAlert, tone: "text-danger", cta: "Ver rota para escapar" },
};

export function MyTeamCard({
  team,
  standings,
  fixtures,
  competition,
}: {
  team: TeamStanding;
  standings: TeamStanding[];
  fixtures: Fixture[];
  competition: Competition;
}) {
  const mood = resolveTeamObjective(team, standings, competition);
  const config = MOOD_CONFIG[mood];
  const Icon = config.icon;

  const remainingGames = fixtures.filter(
    (f) => f.status !== "finished" && (f.homeTeamId === team.teamId || f.awayTeamId === team.teamId)
  ).length;
  const maxPoints = calculateMaximumPossiblePoints(team, fixtures);

  let detailLine: string;
  if (mood === "relegation" || mood === "risk") {
    const analysis = calculatePointsNeededToAvoidRelegation(team, standings, fixtures, competition);
    detailLine = analysis ? analysis.message : "Sem risco de rebaixamento nesta competição.";
  } else if (mood === "title") {
    const analysis = calculatePointsNeededForTitle(team, standings, fixtures, competition);
    detailLine = analysis.message;
  } else {
    const analysis = calculatePointsNeededForQualification(team, standings, fixtures, competition);
    detailLine = analysis.message;
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-graphite p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-center gap-4">
        <TeamLogo team={team.teamName} size="lg" />
        <div>
          <p className="font-display text-xl font-bold uppercase text-white">{team.teamName}</p>
          <p className="text-sm text-muted">
            {team.position}º colocado · <span className="font-bold text-white">{team.points} pts</span>
          </p>
          <span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase ${config.tone}`}>
            <Icon size={14} aria-hidden="true" />
            {config.label}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted sm:max-w-xs sm:text-right">
        <p>{detailLine}</p>
        <p className="text-xs text-muted-2">
          {remainingGames} jogos restantes · pontuação máxima possível: {maxPoints} pts
        </p>
        <Link
          href={getTeamUrl(team.teamName)}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink hover:bg-lime-dark sm:self-end"
        >
          {config.cta}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
