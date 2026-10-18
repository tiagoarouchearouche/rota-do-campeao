import type { Competition, TeamStanding } from "@/services/sportsData/types";

/**
 * Original, data-derived prose (never invented numbers/probabilities) so the page reads as
 * analysis, not just a table pulled from an API — see CLAUDE.md "conteúdo textual original".
 */
export function BrasileiraoAnalysis({ standings, competition }: { standings: TeamStanding[]; competition: Competition }) {
  if (standings.length < 2) return null;

  const totalTeams = standings.length;
  const [leader, runnerUp] = standings;
  const titleDiff = leader.points - runnerUp.points;

  const libertadoresCutLine = 6;
  const lastQualified = standings[libertadoresCutLine - 1];
  const firstOutOfLibertadores = standings[libertadoresCutLine];
  const libertadoresDiff = lastQualified && firstOutOfLibertadores ? lastQualified.points - firstOutOfLibertadores.points : 0;

  const relegationSpots = competition.relegationSpots ?? 0;
  const firstInsideZ4 = relegationSpots > 0 ? standings[totalTeams - relegationSpots] : undefined;
  const firstOutsideZ4 = relegationSpots > 0 ? standings[totalTeams - relegationSpots - 1] : undefined;
  const relegationDiff = firstInsideZ4 && firstOutsideZ4 ? firstOutsideZ4.points - firstInsideZ4.points : 0;

  const maxRemainingGames = Math.max(...standings.map((t) => t.played));
  const leaderRemaining = Math.max(0, maxRemainingGames - leader.played);

  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-display text-xl font-bold uppercase text-white">Situação atual do Brasileirão</h2>

      <div className="flex flex-col gap-4 text-sm text-muted">
        <p>
          O <strong className="text-white">{leader.teamName}</strong> lidera o Brasileirão com {leader.points} pontos,
          seguido pelo <strong className="text-white">{runnerUp.teamName}</strong>, com {runnerUp.points} pontos. A
          diferença atual entre os dois é de {titleDiff} ponto{titleDiff !== 1 ? "s" : ""}.
        </p>

        <div>
          <h3 className="mb-1 font-display text-base font-bold uppercase text-white">Disputa pelo título</h3>
          <p>
            Com {leaderRemaining} rodadas restantes, o {leader.teamName} ainda pode somar até{" "}
            {leaderRemaining * 3} pontos, o que daria {leader.points + leaderRemaining * 3} pontos ao final da
            competição caso vença todos os jogos restantes.
          </p>
        </div>

        {lastQualified && firstOutOfLibertadores && (
          <div>
            <h3 className="mb-1 font-display text-base font-bold uppercase text-white">Libertadores</h3>
            <p>
              O corte da Libertadores está hoje com o <strong className="text-white">{lastQualified.teamName}</strong>{" "}
              ({lastQualified.points} pts), {libertadoresDiff} ponto{libertadoresDiff !== 1 ? "s" : ""} na frente do{" "}
              {firstOutOfLibertadores.teamName} ({firstOutOfLibertadores.points} pts).
            </p>
          </div>
        )}

        {firstInsideZ4 && firstOutsideZ4 && (
          <div>
            <h3 className="mb-1 font-display text-base font-bold uppercase text-white">Rebaixamento</h3>
            <p>
              O {firstOutsideZ4.position}º colocado, <strong className="text-white">{firstOutsideZ4.teamName}</strong>{" "}
              ({firstOutsideZ4.points} pts), está {relegationDiff} ponto{relegationDiff !== 1 ? "s" : ""} na frente do{" "}
              {firstInsideZ4.position}º, {firstInsideZ4.teamName} ({firstInsideZ4.points} pts), primeiro time dentro
              da zona de rebaixamento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
