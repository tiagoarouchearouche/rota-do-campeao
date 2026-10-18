import { Trophy } from "lucide-react";
import type { Competition, TeamStanding } from "@/services/sportsData/types";
import { TeamLogo } from "@/components/TeamLogo";

function TeamChip({ team }: { team: TeamStanding }) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-surface px-2.5 py-1.5 text-sm text-white">
      <TeamLogo team={team.teamName} size="sm" />
      <span className="truncate">{team.teamName}</span>
    </li>
  );
}

function Column({ title, teams }: { title: string; teams: TeamStanding[] }) {
  if (teams.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <ul className="flex flex-col gap-1.5">
        {teams.map((team) => (
          <TeamChip key={team.teamId} team={team} />
        ))}
      </ul>
    </div>
  );
}

export function IfItEndedToday({ standings, competition }: { standings: TeamStanding[]; competition: Competition }) {
  if (standings.length === 0) return null;

  const champion = standings[0];
  const libertadores = standings.slice(0, 6);
  const sulAmericana = standings.slice(6, 12);
  const relegationSpots = competition.relegationSpots ?? 0;
  const relegated = relegationSpots > 0 ? standings.slice(standings.length - relegationSpots) : [];

  return (
    <section className="flex flex-col gap-4 rounded-md border border-border bg-graphite p-4 sm:p-6">
      <h2 className="font-display text-xl font-bold uppercase text-white">Se terminasse hoje</h2>

      <div className="flex items-center gap-3 rounded-md bg-surface p-3">
        <Trophy size={20} className="text-lime" aria-hidden="true" />
        <TeamLogo team={champion.teamName} size="md" />
        <div>
          <p className="text-xs uppercase text-muted-2">Campeão</p>
          <p className="font-display font-bold text-white">{champion.teamName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Column title="Libertadores" teams={libertadores} />
        <Column title="Sul-Americana" teams={sulAmericana} />
        <Column title="Rebaixados" teams={relegated} />
      </div>
    </section>
  );
}
