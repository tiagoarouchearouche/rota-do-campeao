import { Flame, TriangleAlert, Globe2 } from "lucide-react";
import type { Competition, Fixture, TeamStanding } from "@/services/sportsData/types";
import { MatchCard, type MatchBadge } from "@/components/MatchCard";

function pickNextRound(fixtures: Fixture[]): Fixture[] {
  const upcoming = fixtures.filter((f) => f.status !== "finished");
  if (upcoming.length === 0) return [];
  const nextRound = upcoming[0].round;
  return upcoming.filter((f) => f.round === nextRound);
}

/**
 * Only flags a matchup as "decisive" when the two teams' table positions actually put
 * them in the same relevant race — never invents relevance for an arbitrary pair.
 */
function detectBadge(fixture: Fixture, standings: TeamStanding[], totalTeams: number, relegationSpots: number): MatchBadge {
  const home = standings.find((t) => t.teamId === fixture.homeTeamId);
  const away = standings.find((t) => t.teamId === fixture.awayTeamId);
  if (!home || !away) return null;

  if ((home.position === 1 && away.position === 2) || (home.position === 2 && away.position === 1)) {
    return { icon: Flame, label: "Confronto direto pela liderança", tone: "bg-success/15 text-success" };
  }

  const relegationLine = totalTeams - relegationSpots;
  const nearRelegation = (pos: number) => pos > relegationLine - 3;
  if (nearRelegation(home.position) && nearRelegation(away.position)) {
    return { icon: TriangleAlert, label: "Confronto direto contra o rebaixamento", tone: "bg-warning/15 text-warning" };
  }

  const nearLibertadoresCut = (pos: number) => pos >= 4 && pos <= 8;
  if (nearLibertadoresCut(home.position) && nearLibertadoresCut(away.position)) {
    return { icon: Globe2, label: "Confronto direto pela Libertadores", tone: "bg-info/15 text-info" };
  }

  return null;
}

export function NextRound({ fixtures, standings, competition }: { fixtures: Fixture[]; standings: TeamStanding[]; competition: Competition }) {
  const round = pickNextRound(fixtures);
  if (round.length === 0) {
    return (
      <section id="proxima-rodada" className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-bold uppercase text-white">Próxima rodada</h2>
        <p className="text-sm text-muted">Nenhum jogo agendado no momento.</p>
      </section>
    );
  }

  const totalTeams = standings.length;
  const relegationSpots = competition.relegationSpots ?? 0;

  return (
    <section id="proxima-rodada" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase text-white">Próxima rodada</h2>
        {round[0].round && <span className="text-xs text-muted-2">{round[0].round}</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {round.map((fixture) => (
          <MatchCard key={fixture.fixtureId} fixture={fixture} badge={detectBadge(fixture, standings, totalTeams, relegationSpots)} />
        ))}
      </div>
    </section>
  );
}
