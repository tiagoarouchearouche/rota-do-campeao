import type { Fixture, TeamStanding } from "@/services/sportsData/types";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-graphite p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function CompetitionStats({ standings, fixtures }: { standings: TeamStanding[]; fixtures: Fixture[] }) {
  if (standings.length === 0) {
    return <p className="text-sm text-muted">Estatísticas indisponíveis para esta competição no momento.</p>;
  }

  const bestAttack = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefense = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
  const mostWins = [...standings].sort((a, b) => b.wins - a.wins)[0];
  const finishedFixtures = fixtures.filter((f) => f.status === "finished");
  const totalGoals = finishedFixtures.reduce((sum, f) => sum + (f.homeGoals ?? 0) + (f.awayGoals ?? 0), 0);
  const avgGoalsPerMatch = finishedFixtures.length > 0 ? (totalGoals / finishedFixtures.length).toFixed(2) : "—";
  const remaining = fixtures.filter((f) => f.status !== "finished").length;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Ataque mais positivo" value={bestAttack.teamName} sub={`${bestAttack.goalsFor} gols marcados`} />
      <StatCard label="Defesa mais sólida" value={bestDefense.teamName} sub={`${bestDefense.goalsAgainst} gols sofridos`} />
      <StatCard label="Mais vitórias" value={mostWins.teamName} sub={`${mostWins.wins} vitórias`} />
      <StatCard label="Média de gols por jogo" value={avgGoalsPerMatch} sub={`${finishedFixtures.length} jogos disputados`} />
      <StatCard label="Jogos restantes" value={String(remaining)} sub="na competição inteira" />
      <StatCard label="Times na disputa" value={String(standings.length)} />
    </div>
  );
}
