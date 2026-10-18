import { Trophy, Globe2, ShieldAlert } from "lucide-react";
import type { Competition, TeamStanding } from "@/services/sportsData/types";
import { TeamLogo } from "@/components/TeamLogo";

function Row({ team }: { team: TeamStanding }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 truncate">
        <span className="w-5 shrink-0 text-xs text-muted-2">{team.position}º</span>
        <TeamLogo team={team.teamName} size="sm" />
        <span className="truncate text-white">{team.teamName}</span>
      </span>
      <span className="shrink-0 font-bold text-white">{team.points}</span>
    </div>
  );
}

function SituationCard({
  icon: Icon,
  tone,
  title,
  teams,
  summary,
}: {
  icon: typeof Trophy;
  tone: string;
  title: string;
  teams: TeamStanding[];
  summary: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-graphite p-4">
      <h3 className={`flex items-center gap-2 font-display text-sm font-bold uppercase ${tone}`}>
        <Icon size={16} aria-hidden="true" />
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {teams.map((team) => (
          <Row key={team.teamId} team={team} />
        ))}
      </div>
      <p className="text-xs text-muted">{summary}</p>
    </div>
  );
}

export function ChampionshipSituation({ standings, competition }: { standings: TeamStanding[]; competition: Competition }) {
  if (standings.length < 2) return null;

  const [leader, runnerUp] = standings;
  const titleDiff = leader.points - runnerUp.points;

  const totalTeams = standings.length;
  const relegationSpots = competition.relegationSpots ?? 0;
  const firstOutsideZ4 = standings[totalTeams - relegationSpots - 1];
  const firstInsideZ4 = standings[totalTeams - relegationSpots];
  const relegationDiff = firstOutsideZ4 && firstInsideZ4 ? firstOutsideZ4.points - firstInsideZ4.points : 0;

  const libertadoresCutLine = 6;
  const lastQualified = standings[libertadoresCutLine - 1];
  const firstOutOfLibertadores = standings[libertadoresCutLine];
  const libertadoresDiff = lastQualified && firstOutOfLibertadores ? lastQualified.points - firstOutOfLibertadores.points : 0;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold uppercase text-white">O que está em jogo</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SituationCard
          icon={Trophy}
          tone="text-success"
          title="Título"
          teams={[leader, runnerUp]}
          summary={titleDiff === 0 ? "Os líderes estão empatados em pontos." : `${titleDiff} ponto${titleDiff > 1 ? "s" : ""} separa${titleDiff > 1 ? "m" : ""} os líderes.`}
        />
        {lastQualified && firstOutOfLibertadores && (
          <SituationCard
            icon={Globe2}
            tone="text-info"
            title="Libertadores"
            teams={[lastQualified, firstOutOfLibertadores]}
            summary={
              libertadoresDiff === 0
                ? "Times empatados na briga pela vaga."
                : `${libertadoresDiff} ponto${libertadoresDiff > 1 ? "s" : ""} separa${libertadoresDiff > 1 ? "m" : ""} a vaga na Libertadores.`
            }
          />
        )}
        {firstOutsideZ4 && firstInsideZ4 && (
          <SituationCard
            icon={ShieldAlert}
            tone="text-danger"
            title="Rebaixamento"
            teams={[firstOutsideZ4, firstInsideZ4]}
            summary={
              relegationDiff === 0
                ? "Times empatados na briga contra o Z4."
                : `${relegationDiff} ponto${relegationDiff > 1 ? "s" : ""} separa${relegationDiff > 1 ? "m" : ""} ${firstInsideZ4.teamName} da saída do Z4.`
            }
          />
        )}
      </div>
    </section>
  );
}
