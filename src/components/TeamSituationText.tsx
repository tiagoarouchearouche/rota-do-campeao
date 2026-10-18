import type { Competition, Fixture, TeamStanding } from "@/services/sportsData/types";
import { resolveTeamObjective } from "@/services/sportsData/calculations/teamObjective";
import { getRemainingMatches } from "@/services/sportsData/calculations/matchHelpers";

/**
 * Four distinct templates (leader / continental zone / mid-table / relegation zone) so the 20
 * team pages don't read as the same paragraph with the name swapped — see CLAUDE.md "não gerar
 * 20 páginas com exatamente o mesmo texto". Every number used comes straight from `standings`.
 */
export function TeamSituationText({
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
  const totalTeams = standings.length;
  const remaining = getRemainingMatches(team, fixtures).length;
  const objective = resolveTeamObjective(team, standings, competition);

  let paragraph: string;

  if (team.position === 1) {
    const runnerUp = standings[1];
    const diff = runnerUp ? team.points - runnerUp.points : 0;
    paragraph = runnerUp
      ? `O ${team.teamName} lidera o Brasileirão Série A com ${team.points} pontos, ${diff} na frente do ${runnerUp.teamName} (${runnerUp.points} pts). Restam ${remaining} jogos para confirmar a liderança até o fim da temporada.`
      : `O ${team.teamName} lidera o Brasileirão Série A com ${team.points} pontos, com ${remaining} jogos restantes.`;
  } else if (objective === "relegation") {
    const relegationSpots = competition.relegationSpots ?? 0;
    const firstOutsideZ4 = relegationSpots > 0 ? standings[totalTeams - relegationSpots - 1] : undefined;
    const diff = firstOutsideZ4 ? firstOutsideZ4.points - team.points : 0;
    paragraph = firstOutsideZ4
      ? `O ${team.teamName} está na ${team.position}ª posição, dentro da zona de rebaixamento, com ${team.points} pontos. Faltam ${diff} pontos para alcançar o ${firstOutsideZ4.teamName} (${firstOutsideZ4.points} pts) e saber da zona de queda, com ${remaining} jogos ainda por disputar.`
      : `O ${team.teamName} está na ${team.position}ª posição, dentro da zona de rebaixamento, com ${team.points} pontos e ${remaining} jogos restantes.`;
  } else if (objective === "risk") {
    paragraph = `O ${team.teamName} está na ${team.position}ª posição, fora da zona de rebaixamento mas ainda sob risco, com ${team.points} pontos. Restam ${remaining} jogos para garantir a permanência na Série A.`;
  } else if (objective === "title") {
    paragraph = `O ${team.teamName} ocupa a ${team.position}ª posição, na briga pelo título, com ${team.points} pontos. Com ${remaining} jogos restantes, o time ainda disputa a liderança do Brasileirão.`;
  } else if (objective === "libertadores" || objective === "pre-libertadores" || objective === "sula") {
    const zoneLabel = objective === "sula" ? "Sul-Americana" : "Libertadores";
    paragraph = `O ${team.teamName} ocupa a ${team.position}ª posição, na zona de ${zoneLabel}, com ${team.points} pontos. Com ${remaining} jogos restantes, o time ainda pode melhorar sua posição nessa briga.`;
  } else {
    paragraph = `O ${team.teamName} está na ${team.position}ª posição, no meio da tabela, com ${team.points} pontos em ${team.played} jogos. Restam ${remaining} jogos para o time definir se ainda entra na briga por uma vaga continental ou garante a permanência com tranquilidade.`;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-bold uppercase text-white">Situação do {team.teamName} no Brasileirão</h2>
      <p className="text-sm text-muted">{paragraph}</p>
    </section>
  );
}
