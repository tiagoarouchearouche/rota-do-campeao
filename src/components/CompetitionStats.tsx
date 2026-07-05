import type { Fixture, TeamStanding } from "@/services/sportsData/types";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </div>
  );
}

export function CompetitionStats({ standings, fixtures }: { standings: TeamStanding[]; fixtures: Fixture[] }) {
  if (standings.length === 0) return null;

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
